package handlers

import (
	"lang-portal/internal/database"
	"time"

	"github.com/gofiber/fiber/v2"
)

type DashboardHandler struct {
	DB *database.DB
}

type LastStudySession struct {
	ID              int       `json:"id"`
	GroupID         int       `json:"group_id"`
	CreatedAt       time.Time `json:"created_at"`
	StudyActivityID int       `json:"study_activity_id"`
	GroupName       string    `json:"group_name"`
}

type StudyProgress struct {
	TotalWordsStudied   int64 `json:"total_words_studied"`
	TotalAvailableWords int64 `json:"total_available_words"`
}

type QuickStats struct {
	SuccessRate        float64 `json:"success_rate"`
	TotalStudySessions int64   `json:"total_study_sessions"`
	TotalActiveGroups  int64   `json:"total_active_groups"`
	StudyStreakDays    int     `json:"study_streak_days"`
}

func NewDashboardHandler(db *database.DB) *DashboardHandler {
	return &DashboardHandler{DB: db}
}

// GetLastStudySession returns information about the most recent study session
func (h *DashboardHandler) GetLastStudySession(c *fiber.Ctx) error {
	var session LastStudySession
	result := h.DB.GetDB().Table("study_sessions").Select(
		"study_sessions.id, study_sessions.group_id, study_sessions.created_at, study_sessions.study_activity_id, groups.name as group_name",
	).Joins(
		"JOIN groups ON study_sessions.group_id = groups.id",
	).Order("study_sessions.created_at DESC").Limit(1).Scan(&session)

	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(session)
}

// GetStudyProgress returns study progress statistics
func (h *DashboardHandler) GetStudyProgress(c *fiber.Ctx) error {
	var progress StudyProgress

	// Get total words studied (unique words that have been reviewed)
	h.DB.GetDB().Table("word_review_items").Select("COUNT(DISTINCT word_id)").Scan(&progress.TotalWordsStudied)

	// Get total available words
	h.DB.GetDB().Table("words").Count(&progress.TotalAvailableWords)

	return c.JSON(progress)
}

// GetQuickStats returns quick overview statistics
func (h *DashboardHandler) GetQuickStats(c *fiber.Ctx) error {
	var stats QuickStats

	// Calculate success rate
	var totalReviews, correctReviews int64
	h.DB.GetDB().Table("word_review_items").Count(&totalReviews)
	h.DB.GetDB().Table("word_review_items").Where("correct = ?", true).Count(&correctReviews)
	if totalReviews > 0 {
		stats.SuccessRate = float64(correctReviews) / float64(totalReviews) * 100
	}

	// Get total study sessions
	h.DB.GetDB().Table("study_sessions").Count(&stats.TotalStudySessions)

	// Get total active groups
	h.DB.GetDB().Table("study_sessions").Select("COUNT(DISTINCT group_id)").Scan(&stats.TotalActiveGroups)

	// Calculate study streak
	var dates []time.Time
	h.DB.GetDB().Table("study_sessions").Select("DATE(created_at) as study_date").Group("DATE(created_at)").Order("study_date desc").Scan(&dates)

	streak := 0
	if len(dates) > 0 {
		streak = 1
		for i := 0; i < len(dates)-1; i++ {
			if dates[i].Sub(dates[i+1]).Hours() <= 24 {
				streak++
			} else {
				break
			}
		}
	}
	stats.StudyStreakDays = streak

	return c.JSON(stats)
}
