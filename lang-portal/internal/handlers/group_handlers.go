package handlers

import (
	"strconv"
	"lang-portal/internal/database"
	"lang-portal/internal/database/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type GroupHandler struct {
	db *database.DB
}

func NewGroupHandler(db *database.DB) *GroupHandler {
	return &GroupHandler{db: db}
}

// GetGroups returns all groups with pagination
func (h *GroupHandler) GetGroups(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	itemsPerPage, _ := strconv.Atoi(c.Query("per_page", "10"))

	var groups []models.Group
	var total int64

	offset := (page - 1) * itemsPerPage

	result := h.db.GetDB().Model(&models.Group{}).Count(&total)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get groups count"})
	}

	result = h.db.GetDB().Model(&models.Group{}).Offset(offset).Limit(itemsPerPage).Find(&groups)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get groups"})
	}

	totalPages := (total + int64(itemsPerPage) - 1) / int64(itemsPerPage)

	return c.JSON(fiber.Map{
		"items": groups,
		"pagination": fiber.Map{
			"current_page": page,
			"total_pages": totalPages,
			"total_items": total,
			"items_per_page": itemsPerPage,
		},
	})
}

// GetGroup returns a specific group by ID
func (h *GroupHandler) GetGroup(c *fiber.Ctx) error {
	groupID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid group ID"})
	}

	var group models.Group
	result := h.db.GetDB().First(&group, groupID)

	if result.Error == gorm.ErrRecordNotFound {
		return c.Status(404).JSON(fiber.Map{"error": "Group not found"})
	}
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get group"})
	}

	return c.JSON(group)
}

// GetGroupWords returns all words in a specific group
func (h *GroupHandler) GetGroupWords(c *fiber.Ctx) error {
	groupID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid group ID"})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	itemsPerPage, _ := strconv.Atoi(c.Query("per_page", "10"))

	var words []models.Word
	var total int64

	offset := (page - 1) * itemsPerPage

	result := h.db.GetDB().Model(&models.Word{}).Where("group_id = ?", groupID).Count(&total)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get words count"})
	}

	result = h.db.GetDB().Model(&models.Word{}).Where("group_id = ?", groupID).Offset(offset).Limit(itemsPerPage).Find(&words)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get words"})
	}

	totalPages := (total + int64(itemsPerPage) - 1) / int64(itemsPerPage)

	return c.JSON(fiber.Map{
		"items": words,
		"pagination": fiber.Map{
			"current_page": page,
			"total_pages": totalPages,
			"total_items": total,
			"items_per_page": itemsPerPage,
		},
	})
}

// GetGroupStudySessions returns all study sessions for a specific group
func (h *GroupHandler) GetGroupStudySessions(c *fiber.Ctx) error {
	groupID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid group ID",
		})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	itemsPerPage := 100

	var sessions []models.StudySession
	var total int64

	offset := (page - 1) * itemsPerPage

	result := h.db.GetDB().Model(&models.StudySession{}).Where("group_id = ?", groupID).Count(&total)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study sessions count",
		})
	}

	result = h.db.GetDB().Model(&models.StudySession{}).Where("group_id = ?", groupID).Offset(offset).Limit(itemsPerPage).Find(&sessions)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get study sessions",
		})
	}

	totalPages := (total + int64(itemsPerPage) - 1) / int64(itemsPerPage)

	return c.JSON(fiber.Map{
		"items": sessions,
		"pagination": fiber.Map{
			"current_page": page,
			"total_pages": totalPages,
			"total_items": total,
			"items_per_page": itemsPerPage,
		},
	})
}