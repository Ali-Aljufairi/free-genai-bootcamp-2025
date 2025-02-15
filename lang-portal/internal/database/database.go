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

		// Split content into individual statements
		statements := strings.Split(string(content), ";")
		for _, stmt := range statements {
			if strings.TrimSpace(stmt) != "" {
				_, err = tx.Exec(stmt)
				if err != nil {
					tx.Rollback()
					return fmt.Errorf("error executing migration %s: %v", migration, err)
				}
			}
		}

		if err = tx.Commit(); err != nil {
			return fmt.Errorf("error committing migration %s: %v", migration, err)
		}
	}

	return nil
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
		// Insert word
		result, err := tx.Exec(
			"INSERT INTO words (japanese, romaji, english, parts) VALUES (?, ?, ?, ?)",
			word.Japanese, word.Romaji, word.English, word.Parts,
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
