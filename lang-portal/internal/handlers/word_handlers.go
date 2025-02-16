package handlers

import (
	"lang-portal/internal/database"
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

// GetWord returns a specific word by ID with its stats and groups
func (h *WordHandler) GetWord(c *fiber.Ctx) error {
	wordID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid word ID",
		})
	}

	word, err := h.db.GetWord(wordID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get word",
		})
	}

	return c.JSON(word)
}
