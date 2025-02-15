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

// GetWords returns all words with pagination
func (h *WordHandler) GetWords(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	itemsPerPage := 100

	words, total, err := h.db.GetWords(page, itemsPerPage)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get words",
		})
	}

	totalPages := (total + itemsPerPage - 1) / itemsPerPage

	return c.JSON(fiber.Map{
		"items": words,
		"pagination": fiber.Map{
			"current_page":   page,
			"total_pages":    totalPages,
			"total_items":    total,
			"items_per_page": itemsPerPage,
		},
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
