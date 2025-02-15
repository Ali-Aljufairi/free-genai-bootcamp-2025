package handlers_test

import (
	"testing"

	"github.com/free-genai-bootcamp-2025/lang-portal/internal/database"
	"github.com/free-genai-bootcamp-2025/lang-portal/internal/handlers"
)

func TestNewStudySessionHandler(t *testing.T) {
	db := &database.DB{}
	handler := handlers.NewStudySessionHandler(db)

	if handler == nil {
		t.Error("Expected non-nil handler")
	}

	if handler.DB() != db {
		t.Error("Handler not initialized with correct database instance")
	}
}
