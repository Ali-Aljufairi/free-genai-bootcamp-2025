package handlers

import (
	"github.com/free-genai-bootcamp-2025/lang-portal/internal/database"
)

// StudySessionHandler contains all study session related handlers
type StudySessionHandler struct {
	db *database.DB
}

// NewStudySessionHandler creates a new instance of StudySessionHandler
func NewStudySessionHandler(db *database.DB) *StudySessionHandler {
	return &StudySessionHandler{db: db}
}

// Here we'll move all study session related handlers from the server package
// You should move your existing handler implementations here
