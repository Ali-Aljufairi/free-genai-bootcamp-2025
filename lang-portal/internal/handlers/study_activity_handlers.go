package handlers

import (
	"errors"
	"lang-portal/internal/database"
	"lang-portal/internal/database/models"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type StudyActivityHandler struct {
	db *database.DB
}

func NewStudyActivityHandler(db *database.DB) *StudyActivityHandler {
	return &StudyActivityHandler{db: db}
}

// GetStudyActivity returns a specific study activity by ID
func (h *StudyActivityHandler) GetStudyActivity(c *fiber.Ctx) error {
	// Parse the activity ID from URL parameters
	activityID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid activity ID"})
	}

	var activity models.StudyActivity
	result := h.db.GetDB().First(&activity, activityID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Study activity not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get study activity"})
	}

	return c.JSON(activity)
}

// GetStudyActivitySessions returns all study sessions for a specific activity
func (h *StudyActivityHandler) GetStudyActivitySessions(c *fiber.Ctx) error {
	// Parse the activity ID from URL parameters
	activityID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid activity ID"})
	}

	// Parse pagination parameters with defaults and basic validation
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	itemsPerPage, err := strconv.Atoi(c.Query("per_page", "10"))
	if err != nil || itemsPerPage < 1 {
		itemsPerPage = 10
	}
	offset := (page - 1) * itemsPerPage

	var sessions []models.StudySession
	var total int64

	// Count the total sessions for this activity
	countResult := h.db.GetDB().
		Model(&models.StudySession{}).
		Where("study_activity_id = ?", activityID).
		Count(&total)
	if countResult.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get sessions count"})
	}

	// Retrieve the paginated sessions
	result := h.db.GetDB().
		Model(&models.StudySession{}).
		Where("study_activity_id = ?", activityID).
		Offset(offset).
		Limit(itemsPerPage).
		Find(&sessions)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get sessions"})
	}

	return c.JSON(fiber.Map{
		"items": sessions,
		"total": total,
		"page":  page,
	})
}

// CreateStudyActivity creates a new study activity
func (h *StudyActivityHandler) CreateStudyActivity(c *fiber.Ctx) error {
	var input struct {
		GroupID     int64  `json:"group_id"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Validate the input
	if input.GroupID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid group_id"})
	}
	if input.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Name is required"})
	}

	activity := models.StudyActivity{
		GroupID:     input.GroupID,
		Name:        input.Name,
		Description: input.Description,
		CreatedAt:   time.Now(),
	}

	result := h.db.GetDB().Create(&activity)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create study activity"})
	}

	return c.Status(fiber.StatusCreated).JSON(activity)
}