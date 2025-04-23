package database

import (
	"fmt"
	"lang-portal/internal/database/models"
	"os"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// DB represents our database connection
type DB struct {
	db *gorm.DB
}

// New creates a new database connection
func New(dbPath string) (*DB, error) {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}

	// Auto Migrate the schema
	db.AutoMigrate(
		&models.Group{},
		&models.Word{},
		&models.StudyActivity{},
		&models.StudySession{},
		&models.WordReviewItem{},
	)

	return &DB{db: db}, nil
}

// GetDB returns the underlying GORM database instance
func (db *DB) GetDB() *gorm.DB {
	return db.db
}

// Close closes the database connection
func (db *DB) Close() error {
	sqlDB, err := db.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// GetStudySessionWords retrieves words for a specific study session
func (db *DB) GetStudySessionWords(sessionID int64) ([]models.Word, error) {
	var words []models.Word
	err := db.db.Where("study_session_id = ?", sessionID).Find(&words).Error
	return words, err
}

// GetStudySessions retrieves all study sessions
func (db *DB) GetStudySessions() ([]models.StudySession, error) {
	var sessions []models.StudySession
	err := db.db.Find(&sessions).Error
	return sessions, err
}

// GetStudySession retrieves a specific study session
func (db *DB) GetStudySession(sessionID int64) (*models.StudySession, error) {
	var session models.StudySession
	err := db.db.First(&session, sessionID).Error
	return &session, err
}

// CreateWordReview creates a new word review entry
func (db *DB) CreateWordReview(sessionID, wordID int64, correct bool) error {
	review := models.WordReviewItem{
		WordID:         wordID,
		StudySessionID: sessionID,
		Correct:        correct,
		CreatedAt:      time.Now(),
	}
	return db.db.Create(&review).Error
}

// ResetStudyHistory resets all study history
func (db *DB) ResetStudyHistory() error {
	return db.db.Where("1 = 1").Delete(&models.WordReviewItem{}).Error
}

// FullReset performs a complete reset of the system
func (db *DB) FullReset() error {
	err := db.db.Where("1 = 1").Delete(&models.WordReviewItem{}).Error
	if err != nil {
		return err
	}
	err = db.db.Where("1 = 1").Delete(&models.StudySession{}).Error
	if err != nil {
		return err
	}
	return db.db.Where("1 = 1").Delete(&models.StudyActivity{}).Error
}

// Migrate runs database migrations from the specified directory
func (db *DB) Migrate(migrationsPath string) error {
	// For now, we're using GORM's auto-migration
	// In the future, we can implement proper migrations using the migrations path
	return nil
}

// SeedWords seeds the database with words from a JSON file
func (db *DB) SeedWords(seedFile string, groupName string) error {
	// Read and execute the SQL seed file
	seedSQL, err := os.ReadFile(seedFile)
	if err != nil {
		return fmt.Errorf("error reading seed file: %v", err)
	}

	// Execute the SQL statements
	return db.db.Exec(string(seedSQL)).Error
}

// SeedStudyActivities seeds the database with study activities from a JSON file
func (db *DB) SeedStudyActivities(seedFile string) error {
	// Implementation can be added later
	return nil
}

// SeedStudySessions seeds the database with study sessions from a JSON file
func (db *DB) SeedStudySessions(seedFile string) error {
	// Implementation can be added later
	return nil
}

// GetTotalWordsStudied returns the total number of words studied
func (db *DB) GetTotalWordsStudied() (int64, error) {
	var count int64
	err := db.db.Model(&models.WordReviewItem{}).Distinct("word_id").Count(&count).Error
	return count, err
}

// GetTotalAvailableWords returns the total number of available words
func (db *DB) GetTotalAvailableWords() (int64, error) {
	var count int64
	err := db.db.Model(&models.Word{}).Count(&count).Error
	return count, err
}

// SaveReviewAttempt saves a review attempt
func (db *DB) SaveReviewAttempt(sessionID, wordID int64, isCorrect bool, nextReview time.Time) error {
	review := models.WordReviewItem{
		WordID:         wordID,
		StudySessionID: sessionID,
		Correct:        isCorrect,
		CreatedAt:      time.Now(),
	}
	return db.db.Create(&review).Error
}

// GetWords retrieves words with pagination
func (db *DB) GetWords(page, pageSize int) ([]models.Word, int64, error) {
	var words []models.Word
	var total int64

	// Get total count
	if err := db.db.Model(&models.Word{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Calculate offset
	offset := (page - 1) * pageSize

	// Get paginated results
	err := db.db.Select("id, japanese, romaji, english, parts").Offset(offset).Limit(pageSize).Find(&words).Error
	if err != nil {
		return nil, 0, err
	}

	return words, total, nil
}

// Health checks if the database connection is healthy
func (db *DB) Health() error {
	sqlDB, err := db.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}
