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

// GetWords returns all words
func (h *WordHandler) GetWords(c *fiber.Ctx) error {
	words, err := h.db.GetWords()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get words",
		})
	}

	return c.JSON(fiber.Map{
		"items": words,
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
