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
	TotalWordsStudied   int `json:"total_words_studied"`
	TotalAvailableWords int `json:"total_available_words"`
}

type QuickStats struct {
	SuccessRate        float64 `json:"success_rate"`
	TotalStudySessions int     `json:"total_study_sessions"`
	TotalActiveGroups  int     `json:"total_active_groups"`
	StudyStreakDays    int     `json:"study_streak_days"`
}

func NewDashboardHandler(db *database.DB) *DashboardHandler {
	return &DashboardHandler{DB: db}
}

// GetLastStudySession returns information about the most recent study session
func (h *DashboardHandler) GetLastStudySession(c *fiber.Ctx) error {
	query := `
		SELECT 
			ss.id,
			ss.group_id,
			ss.created_at,
			ss.study_activity_id,
			g.name as group_name
		FROM study_sessions ss
		JOIN groups g ON ss.group_id = g.id
		ORDER BY ss.created_at DESC
		LIMIT 1
	`

	var session LastStudySession
	row := h.DB.QueryRow(query)
	err := row.Scan(
		&session.ID,
		&session.GroupID,
		&session.CreatedAt,
		&session.StudyActivityID,
		&session.GroupName,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(session)
}

// GetStudyProgress returns study progress statistics
func (h *DashboardHandler) GetStudyProgress(c *fiber.Ctx) error {
	// Get total words studied (unique words that have been reviewed)
	totalStudiedQuery := `
		SELECT COUNT(DISTINCT word_id)
		FROM word_review_items
	`

	// Get total available words
	totalWordsQuery := `
		SELECT COUNT(*)
		FROM words
	`

	var progress StudyProgress

	row := h.DB.QueryRow(totalStudiedQuery)
	err := row.Scan(&progress.TotalWordsStudied)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	row = h.DB.QueryRow(totalWordsQuery)
	err = row.Scan(&progress.TotalAvailableWords)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(progress)
}

// GetQuickStats returns quick overview statistics
func (h *DashboardHandler) GetQuickStats(c *fiber.Ctx) error {
	// Calculate success rate
	successRateQuery := `
		SELECT 
			CASE 
				WHEN COUNT(*) > 0 
				THEN ROUND(CAST(SUM(CASE WHEN correct THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 1)
				ELSE 0
			END
		FROM word_review_items
	`

	// Get total study sessions
	totalSessionsQuery := `
		SELECT COUNT(*)
		FROM study_sessions
	`

	// Get total active groups (groups with at least one study session)
	activeGroupsQuery := `
		SELECT COUNT(DISTINCT group_id)
		FROM study_sessions
	`

	// Calculate study streak (consecutive days with study sessions)
	streakQuery := `
		WITH RECURSIVE dates AS (
			SELECT date(created_at) as study_date
			FROM study_sessions
			GROUP BY date(created_at)
			ORDER BY study_date DESC
		),
		streak AS (
			SELECT study_date, 1 as days
			FROM dates
			WHERE study_date = (SELECT MAX(study_date) FROM dates)
			UNION ALL
			SELECT d.study_date, s.days + 1
			FROM dates d
			JOIN streak s ON date(d.study_date) = date(s.study_date, '-1 day')
		)
		SELECT COALESCE(MAX(days), 0)
		FROM streak
	`

	var stats QuickStats

	row := h.DB.QueryRow(successRateQuery)
	err := row.Scan(&stats.SuccessRate)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	row = h.DB.QueryRow(totalSessionsQuery)
	err = row.Scan(&stats.TotalStudySessions)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	row = h.DB.QueryRow(activeGroupsQuery)
	err = row.Scan(&stats.TotalActiveGroups)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	row = h.DB.QueryRow(streakQuery)
	err = row.Scan(&stats.StudyStreakDays)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.JSON(stats)
}
