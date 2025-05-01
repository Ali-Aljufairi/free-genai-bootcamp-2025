package handlers

import (
	"lang-portal/internal/database"
	"lang-portal/internal/database/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// WordWithGroups represents a request to create a word with associated groups
type WordWithGroups struct {
	Word     models.Word `json:"word"`
	GroupIDs []int64     `json:"group_ids,omitempty"`
}

// WordsWithGroupsBatch represents a request to create multiple words with groups
type WordsWithGroupsBatch struct {
	Words []WordWithGroups `json:"words"`
}

type WordHandler struct {
	db *database.DB
}

func NewWordHandler(db *database.DB) *WordHandler {
	return &WordHandler{db: db}
}

// GetWords returns paginated words
func (h *WordHandler) GetWords(c *fiber.Ctx) error {
	// Get page and pageSize from query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "10"))

	// Ensure valid pagination parameters
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	words, total, err := h.db.GetWords(page, pageSize)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get words",
		})
	}

	return c.JSON(fiber.Map{
		"items":      words,
		"total":      total,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// GetWord returns a specific word by ID
func (h *WordHandler) GetWord(c *fiber.Ctx) error {
	wordID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid word ID",
		})
	}

	var word models.Word
	result := h.db.GetDB().First(&word, wordID)
	if result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Word not found",
		})
	}

	return c.JSON(word)
}

// CreateWord adds a new word or multiple words to the database
func (h *WordHandler) CreateWord(c *fiber.Ctx) error {
	// Check if the request body is an array or a single object
	contentType := c.Get("Content-Type")
	var bodyBytes []byte

	if contentType == "application/json" {
		bodyBytes = c.Body()
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Content-Type must be application/json",
		})
	}

	// If the first non-whitespace character is '[', it's an array of words
	for _, b := range bodyBytes {
		if b == ' ' || b == '\t' || b == '\n' || b == '\r' {
			continue // Skip whitespace
		}

		if b == '[' {
			// Process multiple words
			return h.createMultipleWords(c)
		} else {
			// Process single word
			return h.createSingleWord(c)
		}
	}

	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
		"error": "Invalid JSON format",
	})
}

// createSingleWord handles the creation of a single word
func (h *WordHandler) createSingleWord(c *fiber.Ctx) error {
	// First try parsing as a word with groups
	var wordWithGroups WordWithGroups
	if err := c.BodyParser(&wordWithGroups); err == nil && len(wordWithGroups.GroupIDs) > 0 {
		return h.createWordWithGroups(c, wordWithGroups)
	}

	// If not a word with groups, process as a standard word
	var word models.Word
	if err := c.BodyParser(&word); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
	}

	// Validate required fields
	if word.Japanese == "" || word.Romaji == "" || word.English == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Japanese, romaji, and English fields are required",
		})
	}

	// Set default level if not provided
	if word.Level == 0 {
		word.Level = 5
	}

	// Create the word in the database
	result := h.db.GetDB().Create(&word)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to create word",
			"details": result.Error.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(word)
}

// createWordWithGroups creates a single word with group associations
func (h *WordHandler) createWordWithGroups(c *fiber.Ctx, req WordWithGroups) error {
	// Validate required fields for the word
	if req.Word.Japanese == "" || req.Word.Romaji == "" || req.Word.English == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Japanese, romaji, and English fields are required",
		})
	}

	// Set default level if not provided
	if req.Word.Level == 0 {
		req.Word.Level = 5
	}

	// Begin transaction
	tx := h.db.GetDB().Begin()

	// Create the word
	if err := tx.Create(&req.Word).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to create word",
			"details": err.Error(),
		})
	}

	// Create word-group associations
	associations := []models.WordGroup{}
	for _, groupID := range req.GroupIDs {
		// Verify group exists
		var count int64
		if err := tx.Model(&models.Group{}).Where("id = ?", groupID).Count(&count).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Error verifying group",
				"details": err.Error(),
			})
		}

		if count == 0 {
			tx.Rollback()
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":    "Group not found",
				"group_id": groupID,
			})
		}

		// Create association
		association := models.WordGroup{
			WordID:  req.Word.ID,
			GroupID: groupID,
		}

		if err := tx.Create(&association).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Failed to create word-group association",
				"details": err.Error(),
			})
		}

		associations = append(associations, association)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to commit transaction",
			"details": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"word":               req.Word,
		"group_associations": associations,
	})
}

// createMultipleWords handles the creation of multiple words
func (h *WordHandler) createMultipleWords(c *fiber.Ctx) error {
	// First try parsing as words with groups
	var wordsWithGroups WordsWithGroupsBatch
	if err := c.BodyParser(&wordsWithGroups); err == nil && len(wordsWithGroups.Words) > 0 {
		return h.createMultipleWordsWithGroups(c, wordsWithGroups)
	}

	// If not words with groups, process as standard words
	var words []models.Word
	if err := c.BodyParser(&words); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
	}

	// Validate all words
	invalidWords := []int{}
	for i, word := range words {
		if word.Japanese == "" || word.Romaji == "" || word.English == "" {
			invalidWords = append(invalidWords, i)
		}
	}

	if len(invalidWords) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":          "Some words are missing required fields",
			"invalidIndices": invalidWords,
		})
	}

	// Create all words in the database
	tx := h.db.GetDB().Begin()

	for _, word := range words {
		if result := tx.Create(&word); result.Error != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Failed to create words",
				"details": result.Error.Error(),
			})
		}
	}

	if err := tx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to commit transaction",
			"details": err.Error(),
		})
	}

	// Reload words to get their assigned IDs
	var createdWords []models.Word
	if err := h.db.GetDB().Where("id IN ?", h.getLastInsertedIDs(len(words))).Find(&createdWords).Error; err != nil {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"success": true,
			"message": "Words created successfully, but couldn't fetch created words",
			"count":   len(words),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"count":   len(words),
		"words":   createdWords,
	})
}

// createMultipleWordsWithGroups creates multiple words with their group associations
func (h *WordHandler) createMultipleWordsWithGroups(c *fiber.Ctx, req WordsWithGroupsBatch) error {
	// Validate all words
	invalidWords := []int{}
	for i, wordReq := range req.Words {
		if wordReq.Word.Japanese == "" || wordReq.Word.Romaji == "" || wordReq.Word.English == "" {
			invalidWords = append(invalidWords, i)
		}
	}

	if len(invalidWords) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":          "Some words are missing required fields",
			"invalidIndices": invalidWords,
		})
	}

	// Begin transaction
	tx := h.db.GetDB().Begin()

	createdWords := []models.Word{}
	allAssociations := []map[string]interface{}{}

	// Create all words and their group associations
	for _, wordReq := range req.Words {
		// Create the word
		if err := tx.Create(&wordReq.Word).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Failed to create word",
				"details": err.Error(),
			})
		}

		createdWords = append(createdWords, wordReq.Word)

		// Create word-group associations if any
		for _, groupID := range wordReq.GroupIDs {
			// Verify group exists
			var count int64
			if err := tx.Model(&models.Group{}).Where("id = ?", groupID).Count(&count).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error":   "Error verifying group",
					"details": err.Error(),
				})
			}

			if count == 0 {
				tx.Rollback()
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error":    "Group not found",
					"group_id": groupID,
				})
			}

			// Create association
			association := models.WordGroup{
				WordID:  wordReq.Word.ID,
				GroupID: groupID,
			}

			if err := tx.Create(&association).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error":   "Failed to create word-group association",
					"details": err.Error(),
				})
			}

			allAssociations = append(allAssociations, map[string]interface{}{
				"word_id":  wordReq.Word.ID,
				"group_id": groupID,
			})
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to commit transaction",
			"details": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success":            true,
		"count":              len(createdWords),
		"words":              createdWords,
		"group_associations": allAssociations,
	})
}

// getLastInsertedIDs returns the IDs of the last n inserted records
func (h *WordHandler) getLastInsertedIDs(n int) []int64 {
	var maxID int64
	h.db.GetDB().Model(&models.Word{}).Select("MAX(id)").Scan(&maxID)

	ids := make([]int64, n)
	for i := 0; i < n; i++ {
		ids[i] = maxID - int64(n-i-1)
	}

	return ids
}

// GetRandomWord returns a random word from the database
func (h *WordHandler) GetRandomWord(c *fiber.Ctx) error {
	var word models.Word
	result := h.db.GetDB().Order("RANDOM()").First(&word)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get random word",
		})
	}
	return c.JSON(word)
}
