package handlers

import (
	"lang-portal/internal/database"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type ReviewHandler struct {
	db *database.DB
}

func NewReviewHandler(db *database.DB) *ReviewHandler {
	return &ReviewHandler{db: db}
}

func (h *ReviewHandler) SaveReviewAttempt(c *fiber.Ctx) error {
	type ReviewAttempt struct {
		SessionID int64 `json:"session_id"`
		WordID    int64 `json:"word_id"`
		Correct   bool  `json:"correct"`
	}

	var attempt ReviewAttempt
	if err := c.BodyParser(&attempt); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Calculate next review time (for example, 24 hours from now)
	nextReview := time.Now().Add(24 * time.Hour)

	// Save the review attempt
	err := h.db.SaveReviewAttempt(attempt.SessionID, attempt.WordID, attempt.Correct, nextReview)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save review attempt",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Review attempt saved successfully",
	})
}

type ReviewAttempt struct {
	WordID    int64     `json:"word_id"`
	IsCorrect bool      `json:"is_correct"`
	Timestamp time.Time `json:"timestamp"`
}

type ReviewResponse struct {
	Success      bool      `json:"success"`
	ReviewedAt   time.Time `json:"reviewed_at"`
	NextReviewAt time.Time `json:"next_review_at"`
}

// SubmitReview handles the submission of a word review attempt
func (h *ReviewHandler) SubmitReview(c *fiber.Ctx) error {
	sessionID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid session ID",
		})
	}

	var attempt ReviewAttempt
	if err := c.BodyParser(&attempt); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Calculate next review time based on spaced repetition algorithm
	nextReview := calculateNextReview(attempt.IsCorrect)

	// Save review attempt to database
	err = h.db.SaveReviewAttempt(sessionID, attempt.WordID, attempt.IsCorrect, nextReview)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save review attempt",
		})
	}

	return c.JSON(ReviewResponse{
		Success:      true,
		ReviewedAt:   time.Now(),
		NextReviewAt: nextReview,
	})
}

// calculateNextReview implements a simple spaced repetition algorithm
func calculateNextReview(isCorrect bool) time.Time {
	now := time.Now()
	if isCorrect {
		// If correct, schedule next review in 24 hours
		return now.Add(24 * time.Hour)
	}
	// If incorrect, schedule review in 4 hours
	return now.Add(4 * time.Hour)
}
