package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"lang-portal/internal/handlers"

	"github.com/gofiber/fiber/v2"
	_ "github.com/mattn/go-sqlite3"
	"github.com/stretchr/testify/assert"
)

func TestGetWordsByGroup(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Insert test data
	_, err := db.Exec(`
		INSERT INTO groups (id, name) VALUES (123, 'Basic Words');
		INSERT INTO words (id, japanese, romaji, english) VALUES 
		(1, 'こんにちは', 'konnichiwa', 'hello'),
		(2, 'さようなら', 'sayounara', 'goodbye');
		INSERT INTO words_groups (word_id, group_id) VALUES (1, 123), (2, 123);
	`)
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}

	app := fiber.New()
	handler := handlers.NewWordHandler(db)
	app.Get("/api/v1/groups/:id/words", handler.GetWordsByGroup)

	// Test successful retrieval
	req := httptest.NewRequest("GET", "/api/v1/groups/123/words", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result []map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)

	assert.Equal(t, 2, len(result))
	assert.Equal(t, "こんにちは", result[0]["japanese"])
	assert.Equal(t, "konnichiwa", result[0]["romaji"])
	assert.Equal(t, "hello", result[0]["english"])

	// Test non-existent group
	req = httptest.NewRequest("GET", "/api/v1/groups/999/words", nil)
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestCreateWord(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Insert test group
	_, err := db.Exec(`INSERT INTO groups (id, name) VALUES (123, 'Basic Words');`)
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}

	app := fiber.New()
	handler := handlers.NewWordHandler(db)
	app.Post("/api/v1/words", handler.CreateWord)

	// Test successful word creation
	wordData := map[string]interface{}{
		"japanese":  "ありがとう",
		"romaji":    "arigatou",
		"english":   "thank you",
		"group_ids": []int{123},
	}
	jsonData, _ := json.Marshal(wordData)

	req := httptest.NewRequest("POST", "/api/v1/words", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)

	assert.NotNil(t, result["id"])
	assert.Equal(t, "ありがとう", result["japanese"])
	assert.Equal(t, "arigatou", result["romaji"])
	assert.Equal(t, "thank you", result["english"])

	// Test invalid word creation (missing required field)
	wordData = map[string]interface{}{
		"japanese": "ありがとう",
		// missing romaji and english
		"group_ids": []int{123},
	}
	jsonData, _ = json.Marshal(wordData)

	req = httptest.NewRequest("POST", "/api/v1/words", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}
