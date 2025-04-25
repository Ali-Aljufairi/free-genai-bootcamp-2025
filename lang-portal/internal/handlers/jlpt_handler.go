package handlers

import (
	"context"
	"fmt"
	"lang-portal/internal/database"
	"lang-portal/internal/services"
	"math/rand"
	"net/url"

	"github.com/gofiber/fiber/v2"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"gorm.io/gorm"
)

type JLPTHandler struct {
	db    *gorm.DB
	neo4j neo4j.DriverWithContext
}

// JLPTSQLiteHandler handles SQLite-only JLPT operations
type JLPTSQLiteHandler struct {
	db *gorm.DB
}

func NewJLPTHandler(db *gorm.DB, neo4j neo4j.DriverWithContext) *JLPTHandler {
	return &JLPTHandler{
		db:    db,
		neo4j: neo4j,
	}
}

func NewJLPTSQLiteHandler(db *database.DB) *JLPTSQLiteHandler {
	return &JLPTSQLiteHandler{
		db: db.GetDB(),
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

	// Get all kanji with their JLPT levels first
	var allKanji []struct {
		Character string
		Level     string
	}
	if err := h.db.Raw("SELECT character, level FROM kanji").Scan(&allKanji).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to fetch kanji data: %v", err),
		})
	}

	allKanjiLevels := make(map[string]string)
	for _, k := range allKanji {
		allKanjiLevels[k.Character] = k.Level
	}

	// Get current level kanji
	var currentLevelKanji []string
	if err := h.db.Raw("SELECT character FROM kanji WHERE level = ?", level).Pluck("character", &currentLevelKanji).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to fetch current level kanji: %v", err),
		})
	}

	ctx := context.Background()

	// Store kanji in Neo4j
	err := h.storeKanjiInNeo4j(ctx, currentLevelKanji, level)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to store kanji in Neo4j: %v", err),
		})
	}

	// Parse dictionary with all kanji level information
	parser := services.NewDictionaryParser("internal/database/dict/JMdict_e", currentLevelKanji, level, allKanjiLevels)
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
			len(currentLevelKanji), len(compounds), level),
		"kanji_count":    len(currentLevelKanji),
		"compound_count": len(compounds),
		"level":          level,
	})
}

// storeKanjiInNeo4j stores the kanji list in Neo4j with JLPT level information
func (h *JLPTHandler) storeKanjiInNeo4j(ctx context.Context, kanjiList []string, level string) error {
	session := h.neo4j.NewSession(ctx, neo4j.SessionConfig{})
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
	session := h.neo4j.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	// Create indexes for better performance - one at a time
	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		// Create word index
		_, err := tx.Run(ctx,
			`CREATE INDEX word_text IF NOT EXISTS FOR (w:Word) ON (w.text)`,
			nil,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create word index: %w", err)
		}

		// Create kanji index
		_, err = tx.Run(ctx,
			`CREATE INDEX kanji_char IF NOT EXISTS FOR (k:Kanji) ON (k.char)`,
			nil,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create kanji index: %w", err)
		}

		return nil, nil
	})
	if err != nil {
		return err
	}

	// Store compounds with optimized relationships
	_, err = session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		for _, compound := range compounds {
			// Create or merge the compound word node
			_, err := tx.Run(ctx,
				`MERGE (w:Word {text: $text})
                 SET w.reading = $reading,
                     w.meaning = $meaning,
                     w.length = $length
                 WITH w
                 UNWIND $positions as pos
                 MATCH (k:Kanji {char: pos.kanji})
                 MERGE (k)-[r:FORMS]->(w)
                 SET r.position = pos.position
                 RETURN w`,
				map[string]any{
					"text":    compound.Word,
					"reading": compound.Reading,
					"meaning": compound.Meaning,
					"length":  len(compound.Kanji),
					"positions": func() []map[string]any {
						positions := make([]map[string]any, len(compound.Kanji))
						for i, k := range compound.Kanji {
							positions[i] = map[string]any{
								"kanji":    k,
								"position": i,
							}
						}
						return positions
					}(),
				},
			)
			if err != nil {
				return nil, fmt.Errorf("failed to store compound word %s: %w", compound.Word, err)
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

// GetRandomKanji returns a random kanji with compounds and possible combinations
func (h *JLPTHandler) GetRandomKanji(c *fiber.Ctx) error {
	level := c.Params("level")
	if level == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Level parameter is required",
		})
	}

	// Get random kanji from SQLite
	var targetKanji struct {
		Character string `db:"character"`
		Level     string `db:"level"`
	}
	err := h.db.Raw("SELECT character, level FROM kanji WHERE level = ? ORDER BY RANDOM() LIMIT 1", level).Scan(&targetKanji).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch random kanji",
		})
	}

	// Get compound information from Neo4j
	session := h.neo4j.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.Run(context.Background(),
		`MATCH (k:Kanji {char: $kanji})-[r:PART_OF]->(w:Word)
         WITH w, r
         MATCH (other:Kanji)-[r2:PART_OF]->(w)
         WHERE other.char <> $kanji
         RETURN DISTINCT w.text as word, w.reading as reading, w.meaning as meaning,
                r.order as targetPosition, collect({kanji: other.char, position: r2.order}) as otherKanji,
                other.jlptLevel as level
         ORDER BY w.text`,
		map[string]any{
			"kanji": targetKanji.Character,
		},
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch compounds",
		})
	}

	compounds := []map[string]interface{}{}
	validKanji := make(map[string]bool)

	for result.Next(context.Background()) {
		record := result.Record()
		word, _ := record.Get("word")
		reading, _ := record.Get("reading")
		meaning, _ := record.Get("meaning")
		targetPos, _ := record.Get("targetPosition")
		otherKanjiList, _ := record.Get("otherKanji")

		// Track all valid kanji that can form compounds
		if otherKanji, ok := otherKanjiList.([]interface{}); ok {
			for _, k := range otherKanji {
				if kMap, ok := k.(map[string]interface{}); ok {
					if kanji, exists := kMap["kanji"].(string); exists {
						validKanji[kanji] = true
					}
				}
			}
		}

		compounds = append(compounds, map[string]interface{}{
			"word":           word,
			"reading":        reading,
			"meaning":        meaning,
			"targetPosition": targetPos,
			"otherKanji":     otherKanjiList,
		})
	}

	// Convert validKanji map to slice
	validKanjiList := make([]string, 0, len(validKanji))
	for k := range validKanji {
		validKanjiList = append(validKanjiList, k)
	}

	return c.JSON(fiber.Map{
		"kanji":      targetKanji.Character,
		"level":      targetKanji.Level,
		"compounds":  compounds,
		"validKanji": validKanjiList,
	})
}

// GetRandomKanji returns a random kanji with similar kanji options from the same JLPT level
func (h *JLPTSQLiteHandler) GetRandomKanji(c *fiber.Ctx) error {
	level := c.Params("level")
	if level == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Level parameter is required",
		})
	}

	var kanji struct {
		Character string `json:"character"`
		Level     string `json:"level"`
	}

	// Get random kanji for the level
	err := h.db.Raw("SELECT character, level FROM kanji WHERE level = ? ORDER BY RANDOM() LIMIT 1", level).Scan(&kanji).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch random kanji",
		})
	}

	// Get similar kanji as options
	var similarKanji []string
	err = h.db.Raw("SELECT character FROM kanji WHERE level = ? AND character != ? ORDER BY RANDOM() LIMIT 3",
		level, kanji.Character).Scan(&similarKanji).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch similar kanji",
		})
	}

	// Prepare similar kanji options
	kanjiOptions := make([]map[string]interface{}, len(similarKanji))
	for i, k := range similarKanji {
		kanjiOptions[i] = map[string]interface{}{
			"kanji":   k,
			"correct": false,
		}
	}

	// Add target kanji to options in random position
	targetOption := map[string]interface{}{
		"kanji":   kanji.Character,
		"correct": true,
	}
	position := rand.Intn(len(kanjiOptions) + 1)
	kanjiOptions = append(kanjiOptions[:position], append([]map[string]interface{}{targetOption}, kanjiOptions[position:]...)...)

	return c.JSON(fiber.Map{
		"kanji":         kanji.Character,
		"level":         kanji.Level,
		"similar_kanji": kanjiOptions,
	})
}

// GetKanjiCompounds returns compound words for a kanji from Neo4j
func (h *JLPTHandler) GetKanjiCompounds(c *fiber.Ctx) error {
	kanji := c.Params("kanji")
	if kanji == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Kanji parameter is required",
		})
	}

	// URL decode the kanji parameter
	decodedKanji, err := url.QueryUnescape(kanji)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid kanji parameter",
		})
	}

	// Get compounds from Neo4j using the new FORMS relationship
	session := h.neo4j.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	// First, let's check if the kanji exists
	result, err := session.Run(context.Background(),
		`MATCH (k:Kanji {char: $kanji})
         RETURN k`,
		map[string]any{
			"kanji": decodedKanji,
		},
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check kanji existence",
		})
	}

	if !result.Next(context.Background()) {
		return c.JSON(fiber.Map{
			"kanji":     decodedKanji,
			"compounds": []map[string]interface{}{},
		})
	}

	// Now get the compounds
	result, err = session.Run(context.Background(),
		`MATCH (k:Kanji {char: $kanji})-[r:FORMS]->(w:Word)
         WITH w, r.position as pos
         MATCH (k2:Kanji)-[r2:FORMS]->(w)
         WHERE k2.char <> $kanji
         WITH w, pos, collect({kanji: k2.char, position: r2.position}) as otherKanji
         RETURN w.text as word,
                w.reading as reading,
                w.meaning as meaning,
                w.length as length,
                pos as position,
                otherKanji
         ORDER BY w.text`,
		map[string]any{
			"kanji": decodedKanji,
		},
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch compound words",
		})
	}

	// Process results with additional compound information
	var compounds []map[string]interface{}
	for result.Next(context.Background()) {
		record := result.Record()
		word, _ := record.Get("word")
		reading, _ := record.Get("reading")
		meaning, _ := record.Get("meaning")
		length, _ := record.Get("length")
		position, _ := record.Get("position")
		otherKanji, _ := record.Get("otherKanji")

		compounds = append(compounds, map[string]interface{}{
			"word":       word,
			"reading":    reading,
			"meaning":    meaning,
			"length":     length,
			"position":   position,
			"otherKanji": otherKanji,
		})
	}

	return c.JSON(fiber.Map{
		"kanji":     decodedKanji,
		"compounds": compounds,
	})
}

// ValidateKanjiCompound validates if a kanji can form a compound with the target word
func (h *JLPTHandler) ValidateKanjiCompound(c *fiber.Ctx) error {
	// Get parameters
	kanji := c.Query("kanji")
	targetWord := c.Query("targetWord")
	position := c.QueryInt("position", -1)

	if kanji == "" || targetWord == "" || position < 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "kanji, targetWord and position are required",
		})
	}

	// Get validation from Neo4j using the FORMS relationship
	session := h.neo4j.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	result, err := session.Run(context.Background(),
		`MATCH (k:Kanji {char: $kanji})-[r:FORMS]->(w:Word {text: $targetWord})
         WHERE r.position = $position
         RETURN w.text as word,
                w.reading as reading,
                w.meaning as meaning,
                w.length as length,
                EXISTS((k)-[r:FORMS]->(w)) as isValid`,
		map[string]any{
			"kanji":      kanji,
			"targetWord": targetWord,
			"position":   position,
		},
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to validate compound",
		})
	}

	if result.Next(context.Background()) {
		record := result.Record()
		isValid, _ := record.Get("isValid")
		word, _ := record.Get("word")
		reading, _ := record.Get("reading")
		meaning, _ := record.Get("meaning")
		length, _ := record.Get("length")

		return c.JSON(fiber.Map{
			"isValid": isValid,
			"word":    word,
			"reading": reading,
			"meaning": meaning,
			"length":  length,
		})
	}

	return c.JSON(fiber.Map{
		"isValid": false,
	})
}

// CleanupNeo4j removes all nodes and relationships from Neo4j
func (h *JLPTHandler) CleanupNeo4j(c *fiber.Ctx) error {
	session := h.neo4j.NewSession(context.Background(), neo4j.SessionConfig{})
	defer session.Close(context.Background())

	_, err := session.ExecuteWrite(context.Background(), func(tx neo4j.ManagedTransaction) (any, error) {
		// Delete all nodes and relationships
		_, err := tx.Run(context.Background(),
			`MATCH (n)
             DETACH DELETE n`,
			nil,
		)
		return nil, err
	})

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to cleanup Neo4j database",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Successfully cleaned up Neo4j database",
	})
}
