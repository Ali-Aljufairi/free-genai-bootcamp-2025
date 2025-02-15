package handlers_test

import (
	"testing"

	"lang-portal/internal/database"
	"lang-portal/internal/handlers"

	"github.com/stretchr/testify/assert"
)

func TestNewStudySessionHandler(t *testing.T) {
	// Arrange
	db := &database.DB{}

	// Act
	handler := handlers.NewStudySessionHandler(db)

	// Assert
	assert.NotNil(t, handler, "Handler should not be nil")
	assert.Equal(t, db, handler.DB(), "Handler should be initialized with correct database instance")
}
