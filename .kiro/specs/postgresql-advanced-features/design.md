# Design Document

## Overview

This design document outlines the architecture for implementing advanced database features in the Sorami language learning platform. The system will migrate from SQLite to PostgreSQL and implement comprehensive features including user management, content management, JLPT exam system, spaced repetition, course curriculum, graph relationships, analytics, study activities, notifications, and data import/export.

## Architecture

### Database Architecture

The system uses PostgreSQL as the primary database with the following architectural patterns:

- **Hierarchical Data**: Using ltree extension for course/unit hierarchies
- **Graph Relationships**: Flexible relationship system for content connections
- **JSONB Storage**: For complex data structures and flexible schemas
- **Full-Text Search**: PostgreSQL's built-in search capabilities
- **Stored Procedures**: Complex business logic implemented in PL/pgSQL
- **Materialized Views**: For performance optimization of complex queries

### Application Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Go/Fiber)    │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  External APIs  │
                       │  (Notifications,│
                       │   Analytics)    │
                       └─────────────────┘
```

## Components and Interfaces

### 1. User Management Component

**Database Tables:**
- `users` - Core user information
- `roles` - System roles (admin, teacher, student)
- `user_roles` - Many-to-many user-role relationships
- `user_settings` - User preferences and study settings
- `subscriptions` - Stripe subscription management
- `user_jlpt_level_history` - JLPT level progression tracking

**Key Interfaces:**
```go
type User struct {
    ID          int64     `json:"id"`
    ClerkID     string    `json:"clerk_id"`
    Email       string    `json:"email"`
    DisplayName string    `json:"display_name"`
    CreatedAt   time.Time `json:"created_at"`
}

type UserSettings struct {
    UserID              int64  `json:"user_id"`
    HideEnglish         bool   `json:"hide_english"`
    DailyReviewTarget   int    `json:"daily_review_target"`
    UILanguage          string `json:"ui_language"`
    Timezone            string `json:"timezone"`
    CurrentJLPTLevel    int    `json:"current_jlpt_level"`
    JLPTLevelAssessedAt time.Time `json:"jlpt_level_assessed_at"`
}
```

### 2. Content Management Component

**Database Tables:**
- `kanji` - Japanese characters with stroke data
- `words` - Vocabulary with readings and meanings
- `grammar_points` - Grammar patterns and structures
- `grammar_readings` - Furigana readings for grammar
- `grammar_examples` - Example sentences for grammar
- `grammar_details` - Detailed explanations
- `sentences` - Example sentences for study

**Key Interfaces:**
```go
type Kanji struct {
    ID          int      `json:"id"`
    Character   string   `json:"character"`
    Meanings    []string `json:"meanings"`
    Onyomi      string   `json:"onyomi"`
    Kunyomi     string   `json:"kunyomi"`
    JLPT        int      `json:"jlpt"`
    StrokeCount int      `json:"stroke_count"`
    StrokesSVG  string   `json:"strokes_svg"`
    Frequency   int      `json:"frequency"`
}

type Word struct {
    ID           int    `json:"id"`
    Kanji        string `json:"kanji"`
    Kana         string `json:"kana"`
    English      string `json:"english"`
    JLPT         int    `json:"jlpt"`
    PartOfSpeech string `json:"part_of_speech"`
    Frequency    int    `json:"frequency"`
}
```

### 3. JLPT Exam System Component

**Database Tables:**
- `jlpt_questions` - Base table for all JLPT questions
- `jlpt_grammar_questions` - Grammar-specific questions
- `jlpt_listening_questions` - Audio-based questions
- `jlpt_reading_questions` - Text-based questions
- `jlpt_word_questions` - Vocabulary-based questions
- `jlpt_question_texts` - Multilingual text content
- `user_question_attempts` - User answer tracking

**Key Interfaces:**
```go
type JLPTQuestion struct {
    ID               int    `json:"id"`
    Level            int    `json:"level"`
    Tag              string `json:"tag"`
    Kind             string `json:"kind"`
    LevelOfDifficult int    `json:"level_of_difficult"`
}

type UserQuestionAttempt struct {
    UserID     int64     `json:"user_id"`
    QuestionID int       `json:"question_id"`
    Correct    bool      `json:"correct"`
    StartedAt  time.Time `json:"started_at"`
    AnsweredAt time.Time `json:"answered_at"`
}
```

### 4. Spaced Repetition System Component

**Database Tables:**
- `progress` - Main SRS progress tracking
- `study_sessions` - User study sessions
- `review_items` - Individual review attempts
- `study_activities` - Available study activity types

**Key Interfaces:**
```go
type Progress struct {
    UserID      int64     `json:"user_id"`
    ItemType    string    `json:"item_type"`
    ItemID      int       `json:"item_id"`
    SeenCount   int       `json:"seen_count"`
    CorrectCount int      `json:"correct_count"`
    LastSeen    time.Time `json:"last_seen"`
    NextDue     time.Time `json:"next_due"`
}

type StudySession struct {
    ID              int64     `json:"id"`
    UserID          int64     `json:"user_id"`
    ActivityID      int       `json:"activity_id"`
    UnitID          *int      `json:"unit_id"`
    DurationMinutes int       `json:"duration_minutes"`
    CreatedAt       time.Time `json:"created_at"`
}
```

### 5. Course Curriculum Component

**Database Tables:**
- `courses` - Main course definitions
- `units` - Course units with hierarchical paths (using ltree)
- `lessons` - Individual lesson content
- `unit_items` - Items (words, kanji, grammar) in units
- `user_course_progress` - User progress through courses

**Key Interfaces:**
```go
type Course struct {
    ID             int    `json:"id"`
    Title          string `json:"title"`
    Description    string `json:"description"`
    Level          int    `json:"level"`
    TotalUnits     int    `json:"total_units"`
    EstimatedHours int    `json:"estimated_hours"`
    IsActive       bool   `json:"is_active"`
}

type Unit struct {
    ID       int    `json:"id"`
    CourseID int    `json:"course_id"`
    Title    string `json:"title"`
    Path     string `json:"path"` // ltree path
}
```

### 6. Graph Relationship Component

**Database Tables:**
- `item_relations` - Flexible relationships between any content items
- `grammar_relations` - Specific grammar pattern relationships
- `kanji_components` - Kanji component relationships
- `word_families` - Word family groupings

**Key Interfaces:**
```go
type ItemRelation struct {
    FromID   int    `json:"from_id"`
    FromType string `json:"from_type"`
    ToID     int    `json:"to_id"`
    ToType   string `json:"to_type"`
    RelType  string `json:"rel_type"`
    Strength float64 `json:"strength"`
}
```

### 7. Analytics Component

**Database Tables:**
- `user_activities` - User behavior tracking
- `analytics_events` - Custom analytics events
- Materialized views for aggregated analytics data

**Key Interfaces:**
```go
type AnalyticsOverview struct {
    ItemType      string  `json:"item_type"`
    TotalItems    int     `json:"total_items"`
    StudiedItems  int     `json:"studied_items"`
    MasteredItems int     `json:"mastered_items"`
    AvgAccuracy   float64 `json:"avg_accuracy"`
    StudyCoverage float64 `json:"study_coverage"`
}
```

### 8. Notification Component

**Database Tables:**
- `notifications` - User notifications
- `notification_templates` - Notification message templates
- `notification_preferences` - User notification settings
- `notification_channels` - Available notification channels
- `notification_events` - System events that trigger notifications

**Key Interfaces:**
```go
type Notification struct {
    ID               int64     `json:"id"`
    UserID           int64     `json:"user_id"`
    Title            string    `json:"title"`
    Message          string    `json:"message"`
    NotificationType string    `json:"notification_type"`
    IsRead           bool      `json:"is_read"`
    Channel          string    `json:"channel"`
    PriorityLevel    string    `json:"priority_level"`
    CreatedAt        time.Time `json:"created_at"`
}
```

### 9. Data Import/Export Component

**Database Tables:**
- `import_jobs` - Import job tracking
- `export_jobs` - Export job tracking
- `data_migrations` - Migration history
- `external_integrations` - Third-party integrations
- `backup_schedules` - Automated backup configuration

**Key Interfaces:**
```go
type ImportJob struct {
    ID               int64     `json:"id"`
    JobType          string    `json:"job_type"`
    SourceFile       string    `json:"source_file"`
    Status           string    `json:"status"`
    ProcessedRecords int       `json:"processed_records"`
    TotalRecords     int       `json:"total_records"`
    CreatedAt        time.Time `json:"created_at"`
    CompletedAt      *time.Time `json:"completed_at"`
}
```

## Data Models

### Core Enums
```sql
-- Review item types
CREATE TYPE review_item_enum AS ENUM ('word', 'kanji', 'grammar', 'sentence');

-- Notification channels
CREATE TYPE notification_channel_enum AS ENUM ('in_app', 'email', 'push', 'sms');

-- User roles
CREATE TYPE user_role_enum AS ENUM ('admin', 'teacher', 'student');

-- Import/Export job status
CREATE TYPE job_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
```

### Key Relationships
- Users have many Progress records (one per item)
- Users have many StudySessions
- StudySessions have many ReviewItems
- Courses have many Units (hierarchical via ltree)
- Units have many UnitItems
- Content items have many ItemRelations (graph structure)
- Users have many Notifications
- Users have one UserSettings record

## Error Handling

### Database Error Handling
- **Constraint Violations**: Proper error messages for foreign key and check constraints
- **Duplicate Data**: Unique constraint handling with meaningful error responses
- **Transaction Rollback**: Automatic rollback on errors with proper cleanup
- **Connection Errors**: Retry logic and connection pooling

### Application Error Handling
```go
type DatabaseError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details string `json:"details"`
}

// Error codes
const (
    ErrCodeDuplicateEntry = "DUPLICATE_ENTRY"
    ErrCodeForeignKey     = "FOREIGN_KEY_VIOLATION"
    ErrCodeNotFound       = "NOT_FOUND"
    ErrCodeInvalidData    = "INVALID_DATA"
)
```

### Data Validation
- **Input Validation**: Validate all inputs before database operations
- **Business Rule Validation**: Enforce business logic constraints
- **Data Integrity**: Ensure referential integrity across all operations
- **Type Safety**: Use proper data types and constraints

## Testing Strategy

### Database Testing
- **Unit Tests**: Test individual stored procedures and functions
- **Integration Tests**: Test complete workflows across multiple tables
- **Performance Tests**: Test query performance with realistic data volumes
- **Migration Tests**: Test schema migrations and data transformations

### API Testing
- **Endpoint Tests**: Test all CRUD operations for each component
- **Authentication Tests**: Test role-based access control
- **Error Handling Tests**: Test error scenarios and edge cases
- **Load Tests**: Test system performance under load

### Test Data Management
- **Fixtures**: Standardized test data for consistent testing
- **Factories**: Generate test data programmatically
- **Cleanup**: Proper test data cleanup between tests
- **Isolation**: Ensure tests don't interfere with each other

### Testing Tools
- **Go Testing**: Standard Go testing framework
- **Testify**: Assertion library for Go tests
- **PostgreSQL Testing**: Database testing with test containers
- **Mock Services**: Mock external dependencies

## Performance Considerations

### Database Optimization
- **Indexes**: Strategic indexing for frequently queried columns
- **Partitioning**: Table partitioning for large datasets
- **Materialized Views**: Pre-computed aggregations for analytics
- **Connection Pooling**: Efficient database connection management

### Query Optimization
- **Query Planning**: Analyze and optimize slow queries
- **Batch Operations**: Bulk operations for data import/export
- **Caching**: Redis caching for frequently accessed data
- **Pagination**: Efficient pagination for large result sets

### Monitoring and Metrics
- **Query Performance**: Monitor slow queries and execution times
- **Resource Usage**: Track CPU, memory, and disk usage
- **Error Rates**: Monitor error rates and types
- **User Metrics**: Track user engagement and system usage