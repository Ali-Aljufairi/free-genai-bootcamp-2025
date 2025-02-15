package server

import (
	"github.com/gofiber/fiber/v2"
)

type StudyProgressResponse struct {
	TotalWordsStudied   int `json:"total_words_studied"`
	TotalAvailableWords int `json:"total_available_words"`
}

func (s *FiberServer) studyProgressHandler(c *fiber.Ctx) error {
	// Get total words studied from word_review_items
	totalWordsStudied, err := s.db.GetTotalWordsStudied()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get total words studied",
		})
	}

	// Get total available words from words table
	totalAvailableWords, err := s.db.GetTotalAvailableWords()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get total available words",
		})
	}

	resp := StudyProgressResponse{
		TotalWordsStudied:   totalWordsStudied,
		TotalAvailableWords: totalAvailableWords,
	}

	return c.JSON(resp)
}
