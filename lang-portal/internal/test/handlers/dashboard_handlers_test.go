package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"lang-portal/internal/handlers"

	"github.com/gofiber/fiber/v2"
	_ "github.com/mattn/go-sqlite3"
	"github.com/stretchr/testify/assert"
)

func setupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Create tables
	_, err = db.Exec(`
		CREATE TABLE groups (id INTEGER PRIMARY KEY, name TEXT);
		CREATE TABLE study_sessions (
			id INTEGER PRIMARY KEY,
			group_id INTEGER,
			created_at DATETIME,
			study_activity_id INTEGER
		);
		CREATE TABLE words (id INTEGER PRIMARY KEY);
		CREATE TABLE word_review_items (
			word_id INTEGER,
			study_session_id INTEGER,
			correct BOOLEAN,
			created_at DATETIME
		);
	`)
	if err != nil {
		t.Fatalf("Failed to create test tables: %v", err)
	}

	return db
}

func TestGetLastStudySession(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Insert test data
	_, err := db.Exec(`
		INSERT INTO groups (id, name) VALUES (456, 'Basic Greetings');
		INSERT INTO study_sessions (id, group_id, created_at, study_activity_id)
		VALUES (123, 456, '2025-02-08 17:20:23', 789);
	`)
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}

	app := fiber.New()
	handler := handlers.NewDashboardHandler(db)
	app.Get("/api/v1/dashboard/last_study_session", handler.GetLastStudySession)

	req := httptest.NewRequest("GET", "/api/v1/dashboard/last_study_session", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result handlers.LastStudySession
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)

	expectedTime, _ := time.Parse("2006-01-02 15:04:05", "2025-02-08 17:20:23")
	assert.Equal(t, 123, result.ID)
	assert.Equal(t, 456, result.GroupID)
	assert.Equal(t, expectedTime, result.CreatedAt)
	assert.Equal(t, 789, result.StudyActivityID)
	assert.Equal(t, "Basic Greetings", result.GroupName)
}

func TestGetStudyProgress(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Insert test data
	_, err := db.Exec(`
		INSERT INTO words (id) VALUES (1), (2), (3), (4);
		INSERT INTO word_review_items (word_id, study_session_id) VALUES
		(1, 1), (2, 1), (3, 1);
	`)
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}

	app := fiber.New()
	handler := handlers.NewDashboardHandler(db)
	app.Get("/api/v1/dashboard/study_progress", handler.GetStudyProgress)

	req := httptest.NewRequest("GET", "/api/v1/dashboard/study_progress", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result handlers.StudyProgress
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)

	assert.Equal(t, 3, result.TotalWordsStudied)
	assert.Equal(t, 4, result.TotalAvailableWords)
}

func TestGetQuickStats(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Insert test data
	currentTime := time.Now()
	yesterday := currentTime.AddDate(0, 0, -1)
	_, err := db.Exec(`
		INSERT INTO study_sessions (id, group_id, created_at) VALUES
		(1, 1, ?), (2, 1, ?), (3, 2, ?), (4, 3, ?);
		INSERT INTO word_review_items (word_id, study_session_id, correct) VALUES
		(1, 1, true), (2, 1, true), (3, 1, true), (4, 1, true), (5, 1, false);
	`, currentTime, currentTime, currentTime, yesterday)
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}

	app := fiber.New()
	handler := handlers.NewDashboardHandler(db)
	app.Get("/api/v1/dashboard/quick-stats", handler.GetQuickStats)

	req := httptest.NewRequest("GET", "/api/v1/dashboard/quick-stats", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result handlers.QuickStats
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)

	assert.Equal(t, 80.0, result.SuccessRate)
	assert.Equal(t, 4, result.TotalStudySessions)
	assert.Equal(t, 3, result.TotalActiveGroups)
	assert.Equal(t, 2, result.StudyStreakDays)
}
