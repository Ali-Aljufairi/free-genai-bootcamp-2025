package server

import (
	"lang-portal/internal/database"

	"github.com/gofiber/fiber/v2"
)

type DashboardResponse struct {
	TotalWordsStudied   int64 `json:"total_words_studied"`
	TotalAvailableWords int64 `json:"total_available_words"`
}

type DashboardHandler struct {
	db *database.DB
}

func NewDashboardHandler(db *database.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

// GetDashboardStats returns dashboard statistics
func (h *DashboardHandler) GetDashboardStats(c *fiber.Ctx) error {
	// Get total words studied
	totalWordsStudied, err := h.db.GetTotalWordsStudied()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get total words studied"})
	}

	// Get total available words
	totalAvailableWords, err := h.db.GetTotalAvailableWords()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get total available words"})
	}

	return c.JSON(DashboardResponse{
		TotalWordsStudied:   totalWordsStudied,
		TotalAvailableWords: totalAvailableWords,
	})
}
