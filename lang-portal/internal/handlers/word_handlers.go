package handlers

import (
	"fmt"
	"lang-portal/internal/database"

	"github.com/gofiber/fiber/v2"
)

type WordHandler struct {
	db *database.DB
}

func NewWordHandler(db *database.DB) *WordHandler {
	return &WordHandler{db: db}
}

func (h *WordHandler) GetWords(c *fiber.Ctx) error {
	words, err := h.db.GetWords()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("error getting words: %v", err),
		})
	}

	return c.JSON(words)
}
