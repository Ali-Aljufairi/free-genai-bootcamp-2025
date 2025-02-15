package server

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type WordResponse struct {
	ID       int    `json:"id"`
	Word     string `json:"word"`
	Meaning  string `json:"meaning"`
	Example  string `json:"example"`
	Category string `json:"category"`
}

func (s *FiberServer) getStudySessionWordsHandler(c *fiber.Ctx) error {
	// Parse session ID from URL parameter
	sessionID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	// Get words for the study session from database
	words, err := s.db.GetStudySessionWords(sessionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study session words",
		})
	}

	return c.JSON(words)
}
