package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/mattn/go-sqlite3"
	"github.com/free-genai-bootcamp-2025/lang-portal/internal/database/models"
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

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/mattn/go-sqlite3"
)

// Service represents a service that interacts with a database.
type Service interface {
	// Health returns a map of health status information.
	// The keys and values in the map are service-specific.
	Health() map[string]string

	// Close terminates the database connection.
	// It returns an error if the connection cannot be closed.
	Close() error
}

type service struct {
	db *sql.DB
}

var (
	dburl      = os.Getenv("BLUEPRINT_DB_URL")
	dbInstance *service
)

func New() Service {
	// Reuse Connection
	if dbInstance != nil {
		return dbInstance
	}

	db, err := sql.Open("sqlite3", dburl)
	if err != nil {
		// This will not be a connection error, but a DSN parse error or
		// another initialization error.
		log.Fatal(err)
	}

	dbInstance = &service{
		db: db,
	}
	return dbInstance
}

// Health checks the health of the database connection by pinging the database.
// It returns a map with keys indicating various health statistics.
func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	// Ping the database
	err := s.db.PingContext(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		log.Fatalf("db down: %v", err) // Log the error and terminate the program
		return stats
	}

	// Database is up, add more statistics
	stats["status"] = "up"
	stats["message"] = "It's healthy"

	// Get database stats (like open connections, in use, idle, etc.)
	dbStats := s.db.Stats()
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)
	stats["wait_count"] = strconv.FormatInt(dbStats.WaitCount, 10)
	stats["wait_duration"] = dbStats.WaitDuration.String()
	stats["max_idle_closed"] = strconv.FormatInt(dbStats.MaxIdleClosed, 10)
	stats["max_lifetime_closed"] = strconv.FormatInt(dbStats.MaxLifetimeClosed, 10)

	// Evaluate stats to provide a health message
	if dbStats.OpenConnections > 40 { // Assuming 50 is the max for this example
		stats["message"] = "The database is experiencing heavy load."
	}

	if dbStats.WaitCount > 1000 {
		stats["message"] = "The database has a high number of wait events, indicating potential bottlenecks."
	}

	if dbStats.MaxIdleClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many idle connections are being closed, consider revising the connection pool settings."
	}

	if dbStats.MaxLifetimeClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many connections are being closed due to max lifetime, consider increasing max lifetime or revising the connection usage pattern."
	}

	return stats
}

// Close closes the database connection.
// It logs a message indicating the disconnection from the specific database.
// If the connection is successfully closed, it returns nil.
// If an error occurs while closing the connection, it returns the error.
func (s *service) Close() error {
	log.Printf("Disconnected from database: %s", dburl)
	return s.db.Close()
}
