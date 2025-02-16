package database

import (
	"database/sql"
	"lang-portal/internal/database/models"
)

// Group represents a word group in the database
type Group struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// GetGroups retrieves a paginated list of groups
func (db *DB) GetGroups(page, itemsPerPage int) ([]Group, int, error) {
	offset := (page - 1) * itemsPerPage

	// Get total count
	var total int
	row := db.QueryRow("SELECT COUNT(*) FROM groups")
	if err := row.Scan(&total); err != nil {
		return nil, 0, err
	}

	// Get groups for current page
	rows, err := db.conn.Query(
		"SELECT id, name FROM groups ORDER BY id LIMIT ? OFFSET ?",
		itemsPerPage, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var groups []Group
	for rows.Next() {
		var g Group
		if err := rows.Scan(&g.ID, &g.Name); err != nil {
			return nil, 0, err
		}
		groups = append(groups, g)
	}

	return groups, total, nil
}

// GetGroup retrieves a specific group by ID
func (db *DB) GetGroup(id int) (*Group, error) {
	row := db.QueryRow("SELECT id, name FROM groups WHERE id = ?", id)

	var group Group
	err := row.Scan(&group.ID, &group.Name)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &group, nil
}

// GetGroupWords retrieves a paginated list of words for a specific group
func (db *DB) GetGroupWords(groupID, page, itemsPerPage int) ([]models.Word, int, error) {
	offset := (page - 1) * itemsPerPage

	// Get total count
	var total int
	row := db.QueryRow("SELECT COUNT(*) FROM words WHERE group_id = ?", groupID)
	if err := row.Scan(&total); err != nil {
		return nil, 0, err
	}

	// Get words for current page
	rows, err := db.conn.Query(
		"SELECT id, japanese, romaji, english FROM words WHERE group_id = ? ORDER BY id LIMIT ? OFFSET ?",
		groupID, itemsPerPage, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var words []models.Word
	for rows.Next() {
		var w models.Word
		if err := rows.Scan(&w.ID, &w.Japanese, &w.Romaji, &w.English); err != nil {
			return nil, 0, err
		}
		words = append(words, w)
	}

	return words, total, nil
}

// GetGroupStudySessions retrieves a paginated list of study sessions for a specific group
func (db *DB) GetGroupStudySessions(groupID, page, itemsPerPage int) ([]models.StudySession, int, error) {
	offset := (page - 1) * itemsPerPage

	// Get total count
	var total int
	row := db.QueryRow("SELECT COUNT(*) FROM study_sessions WHERE group_id = ?", groupID)
	if err := row.Scan(&total); err != nil {
		return nil, 0, err
	}

	// Get study sessions for current page
	rows, err := db.conn.Query(
		"SELECT id, group_id, created_at, study_activity_id FROM study_sessions WHERE group_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
		groupID, itemsPerPage, offset,
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
