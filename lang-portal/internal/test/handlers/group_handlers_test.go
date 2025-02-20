package handlers_test

import (
	"encoding/json"
	"lang-portal/internal/database"
	"lang-portal/internal/database/models"
	"lang-portal/internal/handlers"
	"net/http"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func setupGroupTestDB(t *testing.T) *database.DB {
	// Create a temporary database file
	db, err := database.New(":memory:")
	assert.NoError(t, err)

	// Create all necessary tables with correct relationships
	db.GetDB().Exec(`
		CREATE TABLE IF NOT EXISTS groups (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE
		);

		CREATE TABLE IF NOT EXISTS words (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			japanese TEXT NOT NULL,
			romaji TEXT NOT NULL,
			english TEXT NOT NULL,
			parts TEXT
		);

		CREATE TABLE IF NOT EXISTS words_groups (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			word_id INTEGER NOT NULL,
			group_id INTEGER NOT NULL,
			FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS study_activities (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			description TEXT,
			study_session_id INTEGER,
			group_id INTEGER,
			created_at DATETIME
		);

		CREATE TABLE IF NOT EXISTS study_sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			group_id INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			study_activity_id INTEGER NOT NULL,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (study_activity_id) REFERENCES study_activities(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS word_review_items (
			word_id INTEGER NOT NULL,
			study_session_id INTEGER NOT NULL,
			correct BOOLEAN NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
			FOREIGN KEY (study_session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
			PRIMARY KEY (word_id, study_session_id)
		);
	`)

	return db
}

func TestGetGroups(t *testing.T) {
	db := setupGroupTestDB(t)
	handler := handlers.NewGroupHandler(db)
	app := fiber.New()

	// Create test groups
	testGroups := []models.Group{
		{Name: "Group 1"},
		{Name: "Group 2"},
	}
	for _, group := range testGroups {
		result := db.GetDB().Create(&group)
		assert.NoError(t, result.Error)
	}

	// Test successful case
	app.Get("/groups", handler.GetGroups)
	req, _ := http.NewRequest("GET", "/groups?page=1&per_page=10", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	items, ok := response["items"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, items, 2)

	pagination, ok := response["pagination"].(map[string]interface{})
	assert.True(t, ok)
	assert.Equal(t, float64(1), pagination["current_page"])
	assert.Equal(t, float64(1), pagination["total_pages"])
	assert.Equal(t, float64(2), pagination["total_items"])
}

func TestGetGroup(t *testing.T) {
	db := setupGroupTestDB(t)
	handler := handlers.NewGroupHandler(db)
	app := fiber.New()

	// Create a test group
	testGroup := models.Group{Name: "Test Group"}
	result := db.GetDB().Create(&testGroup)
	assert.NoError(t, result.Error)

	// Test successful case
	app.Get("/groups/:id", handler.GetGroup)
	req, _ := http.NewRequest("GET", "/groups/1", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var group models.Group
	err = json.NewDecoder(resp.Body).Decode(&group)
	assert.NoError(t, err)
	assert.Equal(t, "Test Group", group.Name)

	// Test not found case
	req, _ = http.NewRequest("GET", "/groups/999", nil)
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 404, resp.StatusCode)

	// Test invalid ID case
	req, _ = http.NewRequest("GET", "/groups/invalid", nil)
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}

func TestGetGroupWords(t *testing.T) {
	db := setupGroupTestDB(t)
	handler := handlers.NewGroupHandler(db)
	app := fiber.New()

	// Create a test group and words
	testGroup := models.Group{Name: "Test Group"}
	result := db.GetDB().Create(&testGroup)
	assert.NoError(t, result.Error)

	testWords := []models.Word{
		{Japanese: "Word1", English: "Translation1", Romaji: "Word1"},
		{Japanese: "Word2", English: "Translation2", Romaji: "Word2"},
	}
	for _, word := range testWords {
		result := db.GetDB().Create(&word)
		assert.NoError(t, result.Error)
	}

	// Test successful case
	app.Get("/groups/:id/words", handler.GetGroupWords)
	req, _ := http.NewRequest("GET", "/groups/1/words?page=1&per_page=10", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	items, ok := response["items"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, items, 2)

	// Test invalid group ID
	req, _ = http.NewRequest("GET", "/groups/invalid/words", nil)
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}