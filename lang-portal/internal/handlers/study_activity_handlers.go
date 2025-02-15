package handlers

import (
	"lang-portal/internal/database"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type StudyActivityHandler struct {
	db *database.DB
}

func NewStudyActivityHandler(db *database.DB) *StudyActivityHandler {
	return &StudyActivityHandler{db: db}
}

// GetStudyActivity returns a specific study activity by ID
func (h *StudyActivityHandler) GetStudyActivity(c *fiber.Ctx) error {
	activityID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid activity ID",
		})
	}

	activity, err := h.db.GetStudyActivity(activityID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study activity",
		})
	}

	return c.JSON(activity)
}

// GetStudyActivitySessions returns all study sessions for a specific activity
func (h *StudyActivityHandler) GetStudyActivitySessions(c *fiber.Ctx) error {
	activityID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid activity ID",
		})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	itemsPerPage := 100

	sessions, total, err := h.db.GetStudyActivitySessions(activityID, page, itemsPerPage)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study activity sessions",
		})
	}

	totalPages := (total + itemsPerPage - 1) / itemsPerPage

	return c.JSON(fiber.Map{
		"items": sessions,
		"pagination": fiber.Map{
			"current_page":   page,
			"total_pages":    totalPages,
			"total_items":    total,
			"items_per_page": itemsPerPage,
		},
	})
}

// CreateStudyActivity creates a new study activity
func (h *StudyActivityHandler) CreateStudyActivity(c *fiber.Ctx) error {
	type CreateActivityRequest struct {
		GroupID         int `json:"group_id"`
		StudyActivityID int `json:"study_activity_id"`
	}

	var req CreateActivityRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	activityID, err := h.db.CreateStudyActivity(req.GroupID, req.StudyActivityID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create study activity",
		})
	}

	return c.JSON(fiber.Map{
		"id":       activityID,
		"group_id": req.GroupID,
	})
}
