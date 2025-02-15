package handlers

import (
	"strconv"

	"lang-portal/internal/database"

	"github.com/gofiber/fiber/v2"
)

// StudySessionHandler contains all study session related handlers
type StudySessionHandler struct {
	db *database.DB
}

// DB returns the database instance
func (h *StudySessionHandler) DB() *database.DB {
	return h.db
}

// NewStudySessionHandler creates a new instance of StudySessionHandler
func NewStudySessionHandler(db *database.DB) *StudySessionHandler {
	return &StudySessionHandler{db: db}
}

// GetStudySessionWords handles retrieving words for a specific study session
func (h *StudySessionHandler) GetStudySessionWords(c *fiber.Ctx) error {
	// Parse session ID from URL parameter
	sessionID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	// Get words for the study session from database
	words, err := h.db.GetStudySessionWords(sessionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study session words",
		})
	}

	return c.JSON(words)
}

// GetStudySessions handles retrieving all study sessions
func (h *StudySessionHandler) GetStudySessions(c *fiber.Ctx) error {
	// Get all study sessions from database
	sessions, err := h.db.GetStudySessions()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study sessions",
		})
	}

	return c.JSON(sessions)
}

// StudyProgress handles retrieving study progress statistics
func (h *StudySessionHandler) StudyProgress(c *fiber.Ctx) error {
	// Get total words studied from word_review_items
	totalWordsStudied, err := h.db.GetTotalWordsStudied()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get total words studied",
		})
	}

	// Get total available words from words table
	totalAvailableWords, err := h.db.GetTotalAvailableWords()
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

// WordResponse represents the response structure for word data
type WordResponse struct {
	ID       int    `json:"id"`
	Word     string `json:"word"`
	Meaning  string `json:"meaning"`
	Example  string `json:"example"`
	Category string `json:"category"`
}

// StudyProgressResponse represents the response structure for study progress
type StudyProgressResponse struct {
	TotalWordsStudied   int `json:"total_words_studied"`
	TotalAvailableWords int `json:"total_available_words"`
}
