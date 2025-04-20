package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"lang-portal/internal/services"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

type JLPTHandler struct {
	db neo4j.DriverWithContext
}

func NewJLPTHandler(db neo4j.DriverWithContext) *JLPTHandler {
	return &JLPTHandler{
		db: db,
	}
}

// ImportJLPTLevel handles importing kanji for a specific JLPT level
func (h *JLPTHandler) ImportJLPTLevel(c *fiber.Ctx) error {
	level := c.Query("level")
	if level == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "JLPT level is required",
		})
	}

	// Convert JLPT level to kanjiapi.dev grade
	grade := convertJLPTToGrade(level)
	if grade == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid JLPT level",
		})
	}

	// Fetch kanji from kanjiapi.dev
	url := fmt.Sprintf("https://kanjiapi.dev/v1/kanji/jlpt-%d", grade)
	resp, err := http.Get(url)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch kanji data",
		})
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read response body",
		})
	}

	var kanjiList []string
	if err := json.Unmarshal(body, &kanjiList); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to parse kanji data",
		})
	}

	ctx := context.Background()

	// Store kanji in Neo4j
	err = h.storeKanjiInNeo4j(ctx, kanjiList, level)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to store kanji in database",
		})
	}

	// Parse dictionary and store compound words
	parser := services.NewDictionaryParser("internal/database/dict/JMdict_e", kanjiList)
	compounds, err := parser.ParseDictionary()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to parse dictionary: %v", err),
		})
	}

	// Store compound words and their relationships in Neo4j
	err = h.storeCompoundWords(ctx, compounds)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to store compound words: %v", err),
		})
	}

	return c.JSON(fiber.Map{
		"message": fmt.Sprintf("Successfully imported %d kanji and %d compound words for JLPT %s",
			len(kanjiList), len(compounds), level),
		"kanji_count":    len(kanjiList),
		"compound_count": len(compounds),
		"level":          level,
	})
}

// storeKanjiInNeo4j stores the kanji list in Neo4j with JLPT level information
func (h *JLPTHandler) storeKanjiInNeo4j(ctx context.Context, kanjiList []string, level string) error {
	session := h.db.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		for _, kanji := range kanjiList {
			// Create or merge Kanji node with JLPT level
			_, err := tx.Run(ctx,
				`MERGE (k:Kanji {char: $char})
				 SET k.jlptLevel = $level,
				     k.label = $char
				 RETURN k`,
				map[string]any{
					"char":  kanji,
					"level": level,
				},
			)
			if err != nil {
				return nil, err
			}
		}
		return nil, nil
	})

	return err
}

// storeCompoundWords stores compound words and their relationships with kanji in Neo4j
func (h *JLPTHandler) storeCompoundWords(ctx context.Context, compounds []services.CompoundWord) error {
	session := h.db.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		for _, compound := range compounds {
			// Create compound word node with kanji order information
			_, err := tx.Run(ctx,
				`MERGE (w:Word {text: $text})
				 SET w.reading = $reading,
				     w.meaning = $meaning
				 WITH w
				 UNWIND $kanjiWithIndex as ki
				 MATCH (kn:Kanji {char: ki.kanji})
				 MERGE (kn)-[r:PART_OF {order: ki.index, kanji: ki.kanji}]->(w)
				 RETURN w`,
				map[string]any{
					"text":    compound.Word,
					"reading": compound.Reading,
					"meaning": compound.Meaning,
					"kanjiWithIndex": func() []map[string]any {
						result := make([]map[string]any, len(compound.Kanji))
						for i, k := range compound.Kanji {
							result[i] = map[string]any{
								"kanji": k,
								"index": i,
							}
						}
						return result
					}(),
				},
			)
			if err != nil {
				return nil, err
			}
		}
		return nil, nil
	})

	return err
}

// convertJLPTToGrade converts JLPT level to kanjiapi.dev grade
func convertJLPTToGrade(level string) int {
	// This is a simplified mapping and might need adjustment
	switch level {
	case "N5":
		return 1
	case "N4":
		return 2
	case "N3":
		return 3
	case "N2":
		return 4
	case "N1":
		return 5
	default:
		return 0
	}
}