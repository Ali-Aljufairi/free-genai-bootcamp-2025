package database

import (
	"database/sql"
	"lang-portal/internal/database/models"
)

// GetWord retrieves a specific word by ID
func (db *DB) GetWord(id int) (*models.Word, error) {
	row := db.conn.QueryRow(
		"SELECT id, japanese, romaji, english FROM words WHERE id = ?",
		id,
	)

	var word models.Word
	err := row.Scan(&word.ID, &word.Japanese, &word.Romaji, &word.English)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &word, nil
}

// GetWords retrieves all words from the database
func (db *DB) GetWords() ([]models.Word, error) {
	rows, err := db.conn.Query(
		"SELECT id, japanese, romaji, english FROM words ORDER BY id ASC",
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
