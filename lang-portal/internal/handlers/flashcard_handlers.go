package handlers

import (
	"lang-portal/internal/database"
	"lang-portal/internal/database/models"
	"math"
	"math/rand"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type FlashcardHandler struct {
	db *database.DB
}

func NewFlashcardHandler(db *database.DB) *FlashcardHandler {
	return &FlashcardHandler{db: db}
}

// CreateFlashcardQuiz generates a flashcard quiz with random word selection
func (h *FlashcardHandler) GetQuizWords(c *fiber.Ctx) error {
	// Parse limit parameter - if not specified or invalid, get all words
	var limit int
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Parse level parameter
	level, err := strconv.Atoi(c.Query("level", "5"))
	if err != nil || level < 1 || level > 5 {
		level = 5
	}

	// Get words for this level, ordered by least practiced first
	var targetWords []models.Word
	query := h.db.GetDB().
		Where("level = ?", level).
		Order("correct_count ASC, RANDOM()")

	if limit > 0 {
		query = query.Limit(limit)
	}

	result := query.Find(&targetWords)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve words for quiz",
		})
	}

	if len(targetWords) == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No words found for selected level",
		})
	}

	// Get a pool of words for wrong answers within the same level, excluding target words
	var wordPool []models.Word
	wordIDs := make([]int64, len(targetWords))
	for i, word := range targetWords {
		wordIDs[i] = word.ID
	}

	// Get a larger pool of words to ensure enough variety
	result = h.db.GetDB().
		Where("level = ? AND id NOT IN (?)", level, wordIDs).
		Order("RANDOM()").
		Limit(limit * 10). // Get 10x more words than needed to ensure variety
		Find(&wordPool)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve word pool",
		})
	}

	// Create flashcards
	flashcards := make([]map[string]interface{}, 0, limit)
	usedWords := make(map[int64]bool) // Track used words across all flashcards

	for _, targetWord := range targetWords {
		// Mark target word as used
		usedWords[targetWord.ID] = true

		// Get 3 distinct wrong options
		wrongOptions := make([]map[string]interface{}, 0, 3)
		wrongWords := make(map[int64]bool) // Track wrong options for this flashcard

		// Try to select words with similar correct_count first
		targetCount := targetWord.CorrectCount
		similarWords := make([]models.Word, 0)
		for _, word := range wordPool {
			if !usedWords[word.ID] &&
				word.ID != targetWord.ID &&
				math.Abs(float64(word.CorrectCount-targetCount)) <= 2 {
				similarWords = append(similarWords, word)
			}
		}

		// If we don't have enough similar words, use any unused words
		remainingNeeded := 3 - len(similarWords)
		if remainingNeeded > 0 {
			for _, word := range wordPool {
				if len(wrongOptions) >= 3 {
					break
				}
				if !usedWords[word.ID] && !wrongWords[word.ID] && word.ID != targetWord.ID {
					wrongOptions = append(wrongOptions, map[string]interface{}{
						"id":       word.ID,
						"japanese": word.Japanese,
						"romaji":   word.Romaji,
						"english":  word.English,
						"correct":  false,
					})
					wrongWords[word.ID] = true
					usedWords[word.ID] = true
				}
			}
		}

		// Add similar words first
		for _, word := range similarWords {
			if len(wrongOptions) >= 3 {
				break
			}
			wrongOptions = append(wrongOptions, map[string]interface{}{
				"id":       word.ID,
				"japanese": word.Japanese,
				"romaji":   word.Romaji,
				"english":  word.English,
				"correct":  false,
			})
			wrongWords[word.ID] = true
			usedWords[word.ID] = true
		}

		// If we still don't have enough options, skip this word
		if len(wrongOptions) < 3 {
			continue
		}

		// Create correct option
		correctOption := map[string]interface{}{
			"id":       targetWord.ID,
			"japanese": targetWord.Japanese,
			"romaji":   targetWord.Romaji,
			"english":  targetWord.English,
			"correct":  true,
		}

		// Combine and shuffle options
		allOptions := append(wrongOptions, correctOption)
		rand.Shuffle(len(allOptions), func(i, j int) {
			allOptions[i], allOptions[j] = allOptions[j], allOptions[i]
		})

		flashcard := map[string]interface{}{
			"word": map[string]interface{}{
				"id":       targetWord.ID,
				"japanese": targetWord.Japanese,
				"romaji":   targetWord.Romaji,
				"english":  targetWord.English,
			},
			"options": allOptions,
		}

		flashcards = append(flashcards, flashcard)
	}

	// If we couldn't generate any valid flashcards
	if len(flashcards) == 0 {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not generate valid flashcards with the available words",
		})
	}

	return c.JSON(fiber.Map{
		"flashcards": flashcards,
		"count":      len(flashcards),
	})
}

// SubmitAnswer handles a submitted answer for a flashcard quiz
func (h *FlashcardHandler) SubmitAnswer(c *fiber.Ctx) error {
	// Parse request
	var req struct {
		WordID  int64 `json:"word_id"`
		Correct bool  `json:"correct"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Begin transaction
	tx := h.db.GetDB().Begin()

	// Get current word to check correct_count
	var word models.Word
	if err := tx.First(&word, req.WordID).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve word",
		})
	}

	// Update word's correct_count
	if err := tx.Model(&models.Word{}).
		Where("id = ?", req.WordID).
		Update("correct_count", word.CorrectCount+1).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update word stats",
		})
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save answer",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"learned": word.CorrectCount+1 >= 5,
	})
}

// BatchAnswer represents a single answer in a quiz submission
type BatchAnswer struct {
	WordID  int64 `json:"wordId"`
	Correct bool  `json:"correct"`
}

// BatchAnswerRequest represents the request body for submitting multiple answers
type BatchAnswerRequest struct {
	Answers []BatchAnswer `json:"answers"`
}

// SubmitQuizAnswers handles batch submission of quiz answers
func (h *FlashcardHandler) SubmitQuizAnswers(c *fiber.Ctx) error {
	var req BatchAnswerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Begin transaction
	tx := h.db.GetDB().Begin()

	// Process all answers
	for _, answer := range req.Answers {
		if answer.Correct {
			// Get current correct_count
			var word models.Word
			if err := tx.First(&word, answer.WordID).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to retrieve word",
				})
			}

			// Update word's correct_count
			if err := tx.Model(&models.Word{}).
				Where("id = ?", answer.WordID).
				Update("correct_count", word.CorrectCount+1).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to update word stats",
				})
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save answers",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
	})
}

// GetLearnedWords returns all words that have been learned (correct_count >= 5)
func (h *FlashcardHandler) GetLearnedWords(c *fiber.Ctx) error {
	var words []models.Word
	if err := h.db.GetDB().Where("correct_count >= ?", 5).Find(&words).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get learned words",
		})
	}

	return c.JSON(fiber.Map{
		"words": words,
		"count": len(words),
	})
}

// ResetProgress resets the correct_count for specified words or all words
func (h *FlashcardHandler) ResetProgress(c *fiber.Ctx) error {
	var req struct {
		WordIDs []int64 `json:"word_ids"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	query := h.db.GetDB().Model(&models.Word{})
	if len(req.WordIDs) > 0 {
		query = query.Where("id IN ?", req.WordIDs)
	}

	if err := query.Update("correct_count", 0).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to reset progress",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
	})
}
