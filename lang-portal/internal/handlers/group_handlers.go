package handlers

import (
	"strconv"
	"lang-portal/internal/database"
	"github.com/gofiber/fiber/v2"
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
	itemsPerPage := 100

	groups, total, err := h.db.GetGroups(page, itemsPerPage)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get groups",
		})
	}

	totalPages := (total + itemsPerPage - 1) / itemsPerPage

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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid group ID",
		})
	}

	group, err := h.db.GetGroup(groupID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get group",
		})
	}

	return c.JSON(group)
}

// GetGroupWords returns all words in a specific group
func (h *GroupHandler) GetGroupWords(c *fiber.Ctx) error {
	groupID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid group ID",
		})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	itemsPerPage := 100

	words, total, err := h.db.GetGroupWords(groupID, page, itemsPerPage)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get group words",
		})
	}

	totalPages := (total + itemsPerPage - 1) / itemsPerPage

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

	sessions, total, err := h.db.GetGroupStudySessions(groupID, page, itemsPerPage)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get group study sessions",
		})
	}

	totalPages := (total + itemsPerPage - 1) / itemsPerPage

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