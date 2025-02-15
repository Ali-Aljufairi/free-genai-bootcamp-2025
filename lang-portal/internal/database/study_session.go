package database

import (
	"encoding/json"
	"fmt"
	"lang-portal/internal/database/models"
	"time"
)

// GetStudySessionWords retrieves all words associated with a study session
func (db *DB) GetStudySessionWords(sessionID int) ([]models.Word, error) {
	query := `
		SELECT DISTINCT w.id, w.japanese, w.romaji, w.english, w.parts
		FROM words w
		JOIN word_review_items wri ON w.id = wri.word_id
		WHERE wri.study_session_id = ?
	`

	rows, err := db.conn.Query(query, sessionID)
	if err != nil {
		return nil, fmt.Errorf("error querying study session words: %v", err)
	}
	defer rows.Close()

	var words []models.Word
	for rows.Next() {
		var word models.Word
		var partsJSON []byte

		err := rows.Scan(&word.ID, &word.Japanese, &word.Romaji, &word.English, &partsJSON)
		if err != nil {
			return nil, fmt.Errorf("error scanning word row: %v", err)
		}

		if partsJSON != nil {
			if err := json.Unmarshal(partsJSON, &word.Parts); err != nil {
				return nil, fmt.Errorf("error unmarshaling word parts: %v", err)
			}
		}

		words = append(words, word)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating word rows: %v", err)
	}

	return words, nil
}

// GetStudySessions retrieves all study sessions
func (db *DB) GetStudySessions() ([]models.StudySession, error) {
	query := `
		SELECT id, group_id, created_at, study_activity_id
		FROM study_sessions
		ORDER BY created_at DESC
	`

	rows, err := db.conn.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying study sessions: %v", err)
	}
	defer rows.Close()

	var sessions []models.StudySession
	for rows.Next() {
		var session models.StudySession
		var createdAt time.Time

		err := rows.Scan(&session.ID, &session.GroupID, &createdAt, &session.StudyActivityID)
		if err != nil {
			return nil, fmt.Errorf("error scanning study session row: %v", err)
		}

		session.CreatedAt = createdAt
		sessions = append(sessions, session)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating study session rows: %v", err)
	}

	return sessions, nil
}
