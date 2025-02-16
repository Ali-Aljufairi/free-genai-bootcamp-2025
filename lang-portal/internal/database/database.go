package database

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"lang-portal/internal/database/models"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// DB represents our database connection
type DB struct {
	conn *sql.DB
}

// QueryRow executes a query that is expected to return at most one row
func (db *DB) QueryRow(query string, args ...interface{}) *sql.Row {
	return db.conn.QueryRow(query, args...)
}

// New creates a new database connection
func New(dbPath string) (*DB, error) {
	conn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}

	return &DB{conn: conn}, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.conn.Close()
}

// SaveReviewAttempt saves a review attempt to the database
func (db *DB) SaveReviewAttempt(sessionID, wordID int, isCorrect bool, nextReview time.Time) error {
	_, err := db.conn.Exec(
		"INSERT INTO word_review_items (word_id, study_session_id, correct, created_at, next_review_at) VALUES (?, ?, ?, ?, ?)",
		wordID, sessionID, isCorrect, time.Now(), nextReview,
	)
	return err
}

// Health returns the current health status of the database
func (db *DB) Health() map[string]string {
	stats := make(map[string]string)

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	// Ping the database
	err := db.conn.PingContext(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		return stats
	}

	// Database is up, add more statistics
	stats["status"] = "up"
	stats["message"] = "Database is healthy"

	// Get database stats
	dbStats := db.conn.Stats()
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)

	return stats
}

// Migrate runs all migration files in order
func (db *DB) Migrate(migrationsDir string) error {
	files, err := ioutil.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("error reading migrations directory: %v", err)
	}

	// Get only .sql files and sort them
	var migrations []string
	for _, f := range files {
		if strings.HasSuffix(f.Name(), ".sql") {
			migrations = append(migrations, f.Name())
		}
	}
	sort.Strings(migrations)

	// Run each migration in a transaction
	for _, migration := range migrations {
		tx, err := db.conn.Begin()
		if err != nil {
			return fmt.Errorf("error starting transaction: %v", err)
		}

		content, err := ioutil.ReadFile(filepath.Join(migrationsDir, migration))
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("error reading migration %s: %v", migration, err)
		}

		// Split the migration file into individual statements
		statements := strings.Split(string(content), ";")

		for _, stmt := range statements {
			// Skip empty statements
			if strings.TrimSpace(stmt) == "" {
				continue
			}

			// Execute the statement
			_, err = tx.Exec(stmt)
			if err != nil {
				tx.Rollback()
				return fmt.Errorf("error executing migration %s: %v", migration, err)
			}
		}

		// Commit the transaction
		if err = tx.Commit(); err != nil {
			return fmt.Errorf("error committing migration %s: %v", migration, err)
		}
	}

	return nil
}

// SeedStudyActivities imports study activities from a JSON file into the database
func (db *DB) SeedStudyActivities(seedFile string) error {
	content, err := ioutil.ReadFile(seedFile)
	if err != nil {
		return fmt.Errorf("error reading seed file: %v", err)
	}

	var activities []struct {
		ID          int    `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.Unmarshal(content, &activities); err != nil {
		return fmt.Errorf("error parsing seed file: %v", err)
	}

	// Start transaction
	tx, err := db.conn.Begin()
	if err != nil {
		return fmt.Errorf("error starting transaction: %v", err)
	}

	// Insert activities
	for _, activity := range activities {
		_, err = tx.Exec(
			"INSERT INTO study_activities (id, name, description) VALUES (?, ?, ?)",
			activity.ID, activity.Name, activity.Description,
		)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("error inserting study activity: %v", err)
		}
	}

	return tx.Commit()
}

// SeedWords imports words from a JSON file into the database
func (db *DB) SeedWords(seedFile string, groupName string) error {
	content, err := ioutil.ReadFile(seedFile)
	if err != nil {
		return fmt.Errorf("error reading seed file: %v", err)
	}

	var words []models.Word
	if err := json.Unmarshal(content, &words); err != nil {
		return fmt.Errorf("error parsing seed file: %v", err)
	}

	// Start transaction
	tx, err := db.conn.Begin()
	if err != nil {
		return fmt.Errorf("error starting transaction: %v", err)
	}

	// Create or get group
	var groupID int64
	row := tx.QueryRow("INSERT INTO groups (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name=name RETURNING id", groupName)
	if err := row.Scan(&groupID); err != nil {
		tx.Rollback()
		return fmt.Errorf("error creating/getting group: %v", err)
	}

	// Insert words and create word-group relationships
	for _, word := range words {
		// Convert WordPartsJSON to JSON string
		partsJSON, err := json.Marshal(word.Parts)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("error marshaling parts: %v", err)
		}

		// Insert word
		result, err := tx.Exec(
			"INSERT INTO words (japanese, romaji, english, parts) VALUES (?, ?, ?, ?)",
			word.Japanese, word.Romaji, word.English, string(partsJSON),
		)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("error inserting word: %v", err)
		}

		wordID, err := result.LastInsertId()
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("error getting word ID: %v", err)
		}

		// Create word-group relationship
		_, err = tx.Exec(
			"INSERT INTO words_groups (word_id, group_id) VALUES (?, ?)",
			wordID, groupID,
		)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("error creating word-group relationship: %v", err)
		}
	}

	return tx.Commit()
}

func (d *DB) GetTotalWordsStudied() (int, error) {
	var count int
	query := `SELECT COUNT(DISTINCT word_id) FROM word_review_items`
	err := d.conn.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (d *DB) GetTotalAvailableWords() (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM words`
	err := d.conn.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// SeedStudySessions imports study sessions from a JSON file into the database
func (db *DB) SeedStudySessions(seedFile string) error {
	content, err := ioutil.ReadFile(seedFile)
	if err != nil {
		return fmt.Errorf("error reading seed file: %v", err)
	}

	var sessions []struct {
		ID              int       `json:"id"`
		GroupID         int       `json:"group_id"`
		StudyActivityID int       `json:"study_activity_id"`
		CreatedAt       time.Time `json:"created_at"`
	}
	if err := json.Unmarshal(content, &sessions); err != nil {
		return fmt.Errorf("error parsing seed file: %v", err)
	}

	// Start transaction
	tx, err := db.conn.Begin()
	if err != nil {
		return fmt.Errorf("error starting transaction: %v", err)
	}

	// Insert sessions
	for _, session := range sessions {
		_, err = tx.Exec(
			"INSERT INTO study_sessions (id, group_id, study_activity_id, created_at) VALUES (?, ?, ?, ?)",
			session.ID, session.GroupID, session.StudyActivityID, session.CreatedAt,
		)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("error inserting study session: %v", err)
		}
	}

	return tx.Commit()
}
