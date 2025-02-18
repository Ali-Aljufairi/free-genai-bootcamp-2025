package handlers

import (
	"lang-portal/internal/database"
	"lang-portal/internal/database/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

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
		"items": words,
		"total": total,
		"page": page,
		"pageSize": pageSize,
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
