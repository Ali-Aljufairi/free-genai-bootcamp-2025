package handlers_test

import (
	"bytes"
	"encoding/json"
	"lang-portal/internal/database"
	"lang-portal/internal/database/models"
	"lang-portal/internal/handlers"
	"net/http"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func setupStudyActivityTestDB(t *testing.T) *database.DB {
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

func TestGetStudyActivity(t *testing.T) {
	db := setupStudyActivityTestDB(t)
	handler := handlers.NewStudyActivityHandler(db)
	app := fiber.New()

	// Create test group and activity
	group := models.Group{Name: "Test Group"}
	db.GetDB().Create(&group)

	activity := models.StudyActivity{GroupID: group.ID}
	db.GetDB().Create(&activity)

	// Test successful case
	app.Get("/study-activities/:id", handler.GetStudyActivity)
	req, _ := http.NewRequest("GET", "/study-activities/1", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var response models.StudyActivity
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)
	assert.Equal(t, group.ID, response.GroupID)

	// Test not found case
	req, _ = http.NewRequest("GET", "/study-activities/999", nil)
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 404, resp.StatusCode)

	// Test invalid ID case
	req, _ = http.NewRequest("GET", "/study-activities/invalid", nil)
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}

func TestGetStudyActivitySessions(t *testing.T) {
	db := setupStudyActivityTestDB(t)
	handler := handlers.NewStudyActivityHandler(db)
	app := fiber.New()

	// Create test group, activity and sessions
	group := models.Group{Name: "Test Group"}
	db.GetDB().Create(&group)

	activity := models.StudyActivity{GroupID: group.ID}
	db.GetDB().Create(&activity)

	sessions := []models.StudySession{
		{GroupID: group.ID, StudyActivityID: activity.ID},
		{GroupID: group.ID, StudyActivityID: activity.ID},
	}
	for _, session := range sessions {
		db.GetDB().Create(&session)
	}

	// Test successful case
	app.Get("/study-activities/:id/sessions", handler.GetStudyActivitySessions)
	req, _ := http.NewRequest("GET", "/study-activities/1/sessions?page=1&per_page=10", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	items, ok := response["items"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, items, 2)

	// Test invalid activity ID
	req, _ = http.NewRequest("GET", "/study-activities/invalid/sessions", nil)
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}

func TestCreateStudyActivity(t *testing.T) {
	db := setupStudyActivityTestDB(t)
	handler := handlers.NewStudyActivityHandler(db)
	app := fiber.New()

	// Create test group
	group := models.Group{Name: "Test Group"}
	db.GetDB().Create(&group)

	// Test successful case
	app.Post("/study-activities", handler.CreateStudyActivity)

	input := map[string]interface{}{
		"group_id": group.ID,
	}
	body, _ := json.Marshal(input)

	req, _ := http.NewRequest("POST", "/study-activities", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 201, resp.StatusCode)

	var response models.StudyActivity
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)
	assert.Equal(t, group.ID, response.GroupID)

	// Test invalid request body
	req, _ = http.NewRequest("POST", "/study-activities", bytes.NewBufferString("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	// Test invalid group ID
	input = map[string]interface{}{
		"group_id": 0,
	}
	body, _ = json.Marshal(input)

	req, _ = http.NewRequest("POST", "/study-activities", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}