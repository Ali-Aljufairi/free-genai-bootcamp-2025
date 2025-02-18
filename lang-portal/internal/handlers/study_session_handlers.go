package handlers

import (
	"lang-portal/internal/database"
	"lang-portal/internal/database/models"
	"strconv"
	"time"

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

// CreateStudySession creates a new study session
func (h *StudySessionHandler) CreateStudySession(c *fiber.Ctx) error {
	var input struct {
		GroupID         int64 `json:"group_id"`
		StudyActivityID int64 `json:"study_activity_id"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	session := models.StudySession{
		GroupID:         input.GroupID,
		StudyActivityID: input.StudyActivityID,
		CreatedAt:       time.Now(),
	}

	result := h.db.GetDB().Create(&session)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create study session"})
	}

	return c.JSON(session)
}

// GetStudySessionWords handles retrieving words for a specific study session
func (h *StudySessionHandler) GetStudySessionWords(c *fiber.Ctx) error {
	sessionID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	words, err := h.db.GetStudySessionWords(sessionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study session words",
		})
	}

	return c.JSON(fiber.Map{
		"items": words,
	})
}

// GetStudySessions handles retrieving all study sessions
func (h *StudySessionHandler) GetStudySessions(c *fiber.Ctx) error {
	sessions, err := h.db.GetStudySessions()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study sessions",
		})
	}

	return c.JSON(fiber.Map{
		"items": sessions,
	})
}

// GetStudySession handles retrieving a specific study session
func (h *StudySessionHandler) GetStudySession(c *fiber.Ctx) error {
	sessionID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	session, err := h.db.GetStudySession(sessionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study session",
		})
	}

	return c.JSON(session)
}

// ReviewWord handles recording a word review in a study session
func (h *StudySessionHandler) ReviewWord(c *fiber.Ctx) error {
	sessionID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	wordID, err := strconv.ParseInt(c.Params("word_id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid word ID",
		})
	}

	type ReviewRequest struct {
		Correct bool `json:"correct"`
	}

	var req ReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err = h.db.CreateWordReview(sessionID, wordID, req.Correct)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create word review",
		})
	}

	return c.JSON(fiber.Map{
		"success":          true,
		"word_id":          wordID,
		"study_session_id": sessionID,
		"correct":          req.Correct,
		"created_at":       time.Now(),
	})
}

// ResetHistory handles resetting study history
func (h *StudySessionHandler) ResetHistory(c *fiber.Ctx) error {
	err := h.db.ResetStudyHistory()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to reset study history",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Study history has been reset",
	})
}

// FullReset handles resetting the entire system
func (h *StudySessionHandler) FullReset(c *fiber.Ctx) error {
	err := h.db.FullReset()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to perform full reset",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "System has been fully reset",
	})
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

	return c.JSON(fiber.Map{
		"total_words_studied":   totalWordsStudied,
		"total_available_words": totalAvailableWords,
	})
}
