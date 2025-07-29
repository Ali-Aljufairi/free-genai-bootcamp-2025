# PostgreSQL Migration Requirements

## Introduction

This spec covers the migration from SQLite to PostgreSQL for the Sorami language learning platform. The migration must handle 507MB of JSON data efficiently while preserving existing functionality and properly supporting the actual data structure found in the JSON files.

## Requirements

### Requirement 1: Database Schema Migration

**User Story:** As a developer, I want to migrate from SQLite to PostgreSQL so that the application can handle larger datasets and provide better performance.

#### Acceptance Criteria

1. WHEN the migration is complete THEN the PostgreSQL schema SHALL support all existing SQLite functionality
2. WHEN importing JSON data THEN the schema SHALL properly store all fields found in the actual JSON structure
3. WHEN querying data THEN PostgreSQL SHALL provide better performance than the current SQLite implementation
4. WHEN the application starts THEN it SHALL connect to PostgreSQL instead of SQLite without breaking existing features

### Requirement 2: JLPT Questions Data Structure

**User Story:** As a language learner, I want JLPT questions to be properly stored with all their metadata so that I can practice with complete question information including audio and images.

#### Acceptance Criteria

1. WHEN storing JLPT questions THEN the system SHALL preserve audio URLs from `general.audio` field
2. WHEN storing listening questions THEN the system SHALL store audio timing from `general.audios.audio_time`
3. WHEN storing questions THEN the system SHALL store raw HTML content in question fields
4. WHEN storing questions THEN the system SHALL store image URLs from both `general.image` and `content[].image`
5. WHEN storing questions THEN the system SHALL support variable answer counts (3-4 answers)
6. WHEN storing questions THEN the system SHALL preserve all question types: grammar_choice, passage_grammar, sentence_composition, listening_comprehensive, listening_expressions, quick_response, short_passage, long_passage, information_search, expression_change, kanji_reading, word_formation

### Requirement 3: Existing MVP Data Preservation

**User Story:** As a user of the current system, I want my existing study progress and word groups to be preserved during the migration.

#### Acceptance Criteria

1. WHEN migrating THEN the system SHALL preserve all existing words with japanese, romaji, english, parts, level, correct_count
2. WHEN migrating THEN the system SHALL preserve all study groups and their word associations
3. WHEN migrating THEN the system SHALL preserve all study sessions and review history
4. WHEN migrating THEN the system SHALL preserve all study activities and their metadata

### Requirement 4: JSON Data Import Performance

**User Story:** As a system administrator, I want the 507MB JSON import to complete efficiently without memory issues or timeouts.

#### Acceptance Criteria

1. WHEN importing JSON data THEN the system SHALL use PostgreSQL native functions instead of Python for performance
2. WHEN importing large files THEN the system SHALL use streaming/batch processing to avoid memory issues
3. WHEN importing JLPT questions THEN the system SHALL process all 19,287 files efficiently
4. WHEN import completes THEN the system SHALL provide statistics on imported records

### Requirement 5: Book Set and Unit Relationships

**User Story:** As a language learner, I want to access organized learning content through book sets and units so that I can follow structured learning paths.

#### Acceptance Criteria

1. WHEN storing book sets THEN the system SHALL create proper course structures from book_set.json
2. WHEN storing units THEN the system SHALL create hierarchical unit organization from book_set_unit_all.json
3. WHEN storing unit details THEN the system SHALL map words to units from book_set_unit_detail.json
4. WHEN querying units THEN the system SHALL support hierarchical queries for learning paths

### Requirement 6: Kanji and Stroke Data

**User Story:** As a language learner, I want to practice kanji with stroke order information so that I can learn proper writing technique.

#### Acceptance Criteria

1. WHEN storing kanji THEN the system SHALL import all kanji data from cleaned_kanji.json
2. WHEN storing stroke data THEN the system SHALL link SVG stroke information to kanji records
3. WHEN storing kanji THEN the system SHALL preserve meanings, readings, JLPT levels, and frequency data
4. WHEN querying kanji THEN the system SHALL provide efficient access to stroke SVG data

### Requirement 7: Grammar Points and Examples

**User Story:** As a language learner, I want to study grammar points with examples and explanations so that I can understand Japanese grammar patterns.

#### Acceptance Criteria

1. WHEN storing grammar THEN the system SHALL import all grammar points from cleaned_grammar.json
2. WHEN storing grammar THEN the system SHALL preserve furigana information for proper pronunciation
3. WHEN storing grammar THEN the system SHALL link examples and synonyms to grammar points
4. WHEN storing grammar THEN the system SHALL preserve all metadata including level, notes, cautions, and fun facts

### Requirement 8: Backend Code Migration

**User Story:** As a developer, I want the Go backend to work seamlessly with PostgreSQL so that the application continues to function without breaking changes.

#### Acceptance Criteria

1. WHEN updating dependencies THEN the system SHALL use gorm.io/driver/postgres instead of SQLite
2. WHEN connecting to database THEN the system SHALL use PostgreSQL connection strings
3. WHEN running queries THEN the system SHALL work with existing GORM models
4. WHEN the application starts THEN all existing API endpoints SHALL continue to work

### Requirement 9: Future Multilingual Support

**User Story:** As a platform administrator, I want the database schema to support future multilingual features without requiring major schema changes.

#### Acceptance Criteria

1. WHEN designing schema THEN the system SHALL include placeholder structures for multilingual content
2. WHEN storing questions THEN the system SHALL preserve multilingual data in JSONB for future use
3. WHEN querying content THEN the system SHALL allow for future language-specific queries
4. WHEN adding languages THEN the system SHALL not require major schema migrations

### Requirement 10: Development and Deployment

**User Story:** As a developer, I want easy setup and deployment of the PostgreSQL system so that I can develop and deploy efficiently.

#### Acceptance Criteria

1. WHEN setting up development THEN the system SHALL provide Docker Compose configuration
2. WHEN importing data THEN the system SHALL provide automated import scripts
3. WHEN deploying THEN the system SHALL include proper health checks and monitoring
4. WHEN troubleshooting THEN the system SHALL provide clear error messages and logging