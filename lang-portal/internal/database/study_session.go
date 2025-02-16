package database

import (
	"database/sql"
	"lang-portal/internal/database/models"
	"time"
)

// GetStudySessionWords retrieves words for a specific study session
func (db *DB) GetStudySessionWords(sessionID int) ([]models.Word, error) {
	rows, err := db.conn.Query(`
		SELECT w.id, w.japanese, w.romaji, w.english
		FROM words w
		JOIN study_session_words ssw ON w.id = ssw.word_id
		WHERE ssw.study_session_id = ?
		ORDER BY w.id`,
		sessionID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var words []models.Word
	for rows.Next() {
		var w models.Word
		if err := rows.Scan(&w.ID, &w.Japanese, &w.Romaji, &w.English); err != nil {
			return nil, err
		}
		words = append(words, w)
	}

	return words, nil
}

// GetStudySessions retrieves all study sessions
func (db *DB) GetStudySessions() ([]models.StudySession, error) {
	rows, err := db.conn.Query(
		"SELECT id, group_id, created_at, study_activity_id FROM study_sessions ORDER BY created_at DESC",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.StudySession
	for rows.Next() {
		var s models.StudySession
		if err := rows.Scan(&s.ID, &s.GroupID, &s.CreatedAt, &s.StudyActivityID); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}

	return sessions, nil
}

// GetStudySession retrieves a specific study session by ID
func (db *DB) GetStudySession(id int) (*models.StudySession, error) {
	row := db.conn.QueryRow(
		"SELECT id, group_id, created_at, study_activity_id FROM study_sessions WHERE id = ?",
		id,
	)

	var session models.StudySession
	err := row.Scan(&session.ID, &session.GroupID, &session.CreatedAt, &session.StudyActivityID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &session, nil
}

// CreateWordReview creates a new word review record
func (db *DB) CreateWordReview(sessionID, wordID int, correct bool) error {
	_, err := db.conn.Exec(
		"INSERT INTO word_review_items (word_id, study_session_id, correct, created_at) VALUES (?, ?, ?, ?)",
		wordID, sessionID, correct, time.Now(),
	)
	return err
}

// ResetStudyHistory resets all study history
func (db *DB) ResetStudyHistory() error {
	_, err := db.conn.Exec("DELETE FROM word_review_items")
	return err
}

// FullReset performs a complete reset of the system
func (db *DB) FullReset() error {
	_, err := db.conn.Exec(`
		DELETE FROM word_review_items;
		DELETE FROM study_sessions;
		DELETE FROM study_activities;
	`)
	return err
}

// CreateStudySession creates a new study session
func (db *DB) CreateStudySession(groupID, studyActivityID int) (int64, error) {
	result, err := db.conn.Exec(
		"INSERT INTO study_sessions (group_id, study_activity_id, created_at) VALUES (?, ?, ?)",
		groupID, studyActivityID, time.Now(),
	)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}
