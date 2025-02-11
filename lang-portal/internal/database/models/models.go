package models

import "time"

// Word represents a vocabulary word in the system
type Word struct {
	ID       int64  `json:"id"`
	Japanese string `json:"japanese"`
	Romaji   string `json:"romaji"`
	English  string `json:"english"`
	Parts    string `json:"parts"` // JSON string
}

// Group represents a thematic group of words
type Group struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

// WordGroup represents the many-to-many relationship between words and groups
type WordGroup struct {
	ID      int64 `json:"id"`
	WordID  int64 `json:"word_id"`
	GroupID int64 `json:"group_id"`
}

// StudySession represents a learning session
type StudySession struct {
	ID              int64     `json:"id"`
	GroupID         int64     `json:"group_id"`
	CreatedAt       time.Time `json:"created_at"`
	StudyActivityID int64     `json:"study_activity_id"`
}

// StudyActivity represents a specific learning activity
type StudyActivity struct {
	ID              int64     `json:"id"`
	StudySessionID  int64     `json:"study_session_id"`
	GroupID         int64     `json:"group_id"`
	CreatedAt       time.Time `json:"created_at"`
}

// WordReviewItem represents a practice record for a word
type WordReviewItem struct {
	WordID         int64     `json:"word_id"`
	StudySessionID int64     `json:"study_session_id"`
	Correct        bool      `json:"correct"`
	CreatedAt      time.Time `json:"created_at"`
}