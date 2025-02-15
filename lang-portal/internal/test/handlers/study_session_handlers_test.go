package handlers_test

import (
	"testing"

	"lang-portal/internal/database"
	"lang-portal/internal/handlers"
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
