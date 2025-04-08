package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// ActivityType represents the type of study activity
type ActivityType string

const (
	ActivityTypeFlashcards ActivityType = "flashcards"
	ActivityTypeQuiz       ActivityType = "quiz"
	ActivityTypeChat       ActivityType = "chat"
	ActivityTypeDrawing    ActivityType = "drawing"
	ActivityTypeAgent      ActivityType = "agent"
	ActivityTypeSpeech     ActivityType = "speech"
)

// Word represents a vocabulary word in the system
type Word struct {
	ID       int64         `json:"id" gorm:"primaryKey"`
	Japanese string        `json:"japanese" gorm:"not null"`
	Romaji   string        `json:"romaji" gorm:"not null"`
	English  string        `json:"english" gorm:"not null"`
	Parts    WordPartsJSON `json:"parts" gorm:"type:text"`
}

type WordPartsJSON struct {
	Type      string `json:"type"`
	Formality string `json:"formality,omitempty"`
	Category  string `json:"category,omitempty"`
}

// Value implements the driver.Valuer interface
func (w WordPartsJSON) Value() (driver.Value, error) {
	return json.Marshal(w)
}

// Scan implements the sql.Scanner interface
func (w *WordPartsJSON) Scan(value interface{}) error {
    if value == nil {
        return nil
    }

    var data []byte
    switch v := value.(type) {
    case []byte:
        data = v
    case string:
        data = []byte(v)
    default:
        return errors.New("type assertion to []byte or string failed")
    }

    if len(data) == 0 {
        return nil
    }

    return json.Unmarshal(data, &w)
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
	ID             int64       `json:"id"`
	Type           ActivityType `json:"type"`
	Name           string      `json:"name"`
	Description    string      `json:"description"`
	StudySessionID int64       `json:"study_session_id"`
	GroupID        int64       `json:"group_id"`
	CreatedAt      time.Time   `json:"created_at"`
}

// WordReviewItem represents a practice record for a word
type WordReviewItem struct {
	WordID         int64     `json:"word_id"`
	StudySessionID int64     `json:"study_session_id"`
	Correct        bool      `json:"correct"`
	CreatedAt      time.Time `json:"created_at"`
}
