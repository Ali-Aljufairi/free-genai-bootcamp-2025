package database

import (
	"database/sql"
	"lang-portal/internal/database/models"
	"time"
)

// GetStudyActivity retrieves a specific study activity by ID
func (db *DB) GetStudyActivity(id int) (*models.StudyActivity, error) {
	row := db.conn.QueryRow(
		"SELECT id, study_session_id, group_id, created_at FROM study_activities WHERE id = ?",
		id,
	)

	var activity models.StudyActivity
	err := row.Scan(&activity.ID, &activity.StudySessionID, &activity.GroupID, &activity.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &activity, nil
}

// GetStudyActivitySessions retrieves a paginated list of study sessions for a specific activity
func (db *DB) GetStudyActivitySessions(activityID, page, itemsPerPage int) ([]models.StudySession, int, error) {
	offset := (page - 1) * itemsPerPage

	// Get total count
	var total int
	row := db.QueryRow("SELECT COUNT(*) FROM study_sessions WHERE study_activity_id = ?", activityID)
	if err := row.Scan(&total); err != nil {
		return nil, 0, err
	}

	// Get study sessions for current page
	rows, err := db.conn.Query(
		"SELECT id, group_id, created_at, study_activity_id FROM study_sessions WHERE study_activity_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
		activityID, itemsPerPage, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var sessions []models.StudySession
	for rows.Next() {
		var s models.StudySession
		if err := rows.Scan(&s.ID, &s.GroupID, &s.CreatedAt, &s.StudyActivityID); err != nil {
			return nil, 0, err
		}
		sessions = append(sessions, s)
	}

	return sessions, total, nil
}

// CreateStudyActivity creates a new study activity and returns its ID
func (db *DB) CreateStudyActivity(groupID, studyActivityID int) (int64, error) {
	result, err := db.conn.Exec(
		"INSERT INTO study_activities (group_id, study_activity_id, created_at) VALUES (?, ?, ?)",
		groupID, studyActivityID, time.Now(),
	)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}
