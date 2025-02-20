package handlers_test

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"lang-portal/internal/database"
	"lang-portal/internal/handlers"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func setupTestDB(t *testing.T) *database.DB {
	db, err := database.New(":memory:")
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}

	return db
}

func TestGetWords(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	app := fiber.New()
	handler := handlers.NewWordHandler(db)

	// Create test words
	db.GetDB().Exec(`
		CREATE TABLE IF NOT EXISTS words (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			japanese TEXT NOT NULL,
			romaji TEXT NOT NULL,
			english TEXT NOT NULL,
			parts TEXT
		)
	`)
	db.GetDB().Exec(`
		INSERT INTO words (japanese, romaji, english) VALUES
		('こんにちは', 'konnichiwa', 'hello'),
		('さようなら', 'sayounara', 'goodbye')
	`)

	// Register route
	app.Get("/api/v1/words", handler.GetWords)

	// Test cases
	tests := []struct {
		description  string
		query        string
		expectedCode int
		expectedLen  int
	}{
		{
			description:  "get first page of words",
			query:        "?page=1&pageSize=10",
			expectedCode: 200,
			expectedLen:  2,
		},
		{
			description:  "get empty page",
			query:        "?page=2&pageSize=10",
			expectedCode: 200,
			expectedLen:  0,
		},
	}

	for _, test := range tests {
		t.Run(test.description, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/words"+test.query, nil)
			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, test.expectedCode, resp.StatusCode)

			body, err := io.ReadAll(resp.Body)
			assert.NoError(t, err)

			var result map[string]interface{}
			err = json.Unmarshal(body, &result)
			assert.NoError(t, err)

			items, ok := result["items"].([]interface{})
			assert.True(t, ok)
			assert.Equal(t, test.expectedLen, len(items))
		})
	}
}

func TestGetWord(t *testing.T) {
	// Setup
	db := setupTestDB(t)
	app := fiber.New()
	handler := handlers.NewWordHandler(db)

	// Create test word
	db.GetDB().Exec(`
		CREATE TABLE IF NOT EXISTS words (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			japanese TEXT NOT NULL,
			romaji TEXT NOT NULL,
			english TEXT NOT NULL,
			parts TEXT
		)
	`)
	db.GetDB().Exec(`
		INSERT INTO words (japanese, romaji, english) VALUES
		('こんにちは', 'konnichiwa', 'hello')
	`)

	// Register route
	app.Get("/api/v1/words/:id", handler.GetWord)

	// Test cases
	tests := []struct {
		description  string
		id          string
		expectedCode int
	}{
		{
			description:  "get existing word",
			id:          "1",
			expectedCode: 200,
		},
		{
			description:  "get non-existing word",
			id:          "999",
			expectedCode: 404,
		},
		{
			description:  "get word with invalid id",
			id:          "invalid",
			expectedCode: 400,
		},
	}

	for _, test := range tests {
		t.Run(test.description, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/words/"+test.id, nil)
			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, test.expectedCode, resp.StatusCode)
		})
	}
}