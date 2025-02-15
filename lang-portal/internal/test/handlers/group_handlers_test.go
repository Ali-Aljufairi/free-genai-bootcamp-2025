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

func TestGetGroups(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	// Insert test data
	_, err := db.Exec(`
		INSERT INTO groups (id, name) VALUES 
		(1, 'Basic Greetings'),
		(2, 'Numbers'),
		(3, 'Colors');
	`)
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}

	app := fiber.New()
	handler := handlers.NewGroupHandler(db)
	app.Get("/api/v1/groups", handler.GetGroups)

	// Test successful retrieval
	req := httptest.NewRequest("GET", "/api/v1/groups", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result []map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)

	assert.Equal(t, 3, len(result))
	assert.Equal(t, "Basic Greetings", result[0]["name"])
	assert.Equal(t, "Numbers", result[1]["name"])
	assert.Equal(t, "Colors", result[2]["name"])
}

func TestCreateGroup(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	app := fiber.New()
	handler := handlers.NewGroupHandler(db)
	app.Post("/api/v1/groups", handler.CreateGroup)

	// Test successful group creation
	groupData := map[string]interface{}{
		"name": "Food and Drinks",
	}
	jsonData, _ := json.Marshal(groupData)

	req := httptest.NewRequest("POST", "/api/v1/groups", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(t, err)

	assert.NotNil(t, result["id"])
	assert.Equal(t, "Food and Drinks", result["name"])

	// Test invalid group creation (missing name)
	groupData = map[string]interface{}{}
	jsonData, _ = json.Marshal(groupData)

	req = httptest.NewRequest("POST", "/api/v1/groups", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}
