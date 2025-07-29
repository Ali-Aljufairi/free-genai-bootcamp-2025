# PostgreSQL Migration Design

## Overview

This design document outlines the migration from SQLite to PostgreSQL for the Sorami language learning platform. The design addresses the actual JSON data structure found in the 507MB dataset and ensures efficient import while preserving existing functionality.

## Architecture

### Database Architecture

```
PostgreSQL 16 with Extensions
├── Core Extensions
│   ├── pgcrypto (UUID generation, hashing)
│   ├── pg_trgm (fuzzy text search)
│   ├── ltree (hierarchical data)
│   └── vector (embeddings - future use)
├── Application Schema
│   ├── User Management (Clerk integration)
│   ├── Content Storage (words, kanji, grammar)
│   ├── JLPT Questions (type-specific tables)
│   ├── Learning Structure (courses, units)
│   └── Study Tracking (sessions, progress)
└── Import System
    ├── JSON Processing (jq + PostgreSQL COPY)
    ├── Batch Operations (streaming import)
    └── Data Validation (constraints, checks)
```

### Data Flow Architecture

```
JSON Files (507MB)
    ↓
jq Processing (streaming)
    ↓
PostgreSQL COPY (bulk import)
    ↓
Data Validation & Relationships
    ↓
Application Ready Database
```

## Components and Interfaces

### 1. Core Data Models

#### Words Table (Enhanced from SQLite)
```sql
CREATE TABLE words (
    id SERIAL PRIMARY KEY,
    kana TEXT NOT NULL,                    -- From javi_cleaned.json "phonetic"
    kanji TEXT,                           -- From javi_cleaned.json "word"  
    romaji TEXT NOT NULL,                 -- From javi_cleaned.json "phonetic"
    english TEXT NOT NULL,               -- From javi_cleaned.json "short_mean" (joined)
    part_of_speech pos_enum NOT NULL,    -- From javi_cleaned.json "part_of_speech"
    jlpt INT,                            -- From javi_cleaned.json "level" (mapped N1-N5 to 1-5)
    level INT DEFAULT 5,                 -- Preserved from SQLite
    correct_count INT DEFAULT 0,         -- Preserved from SQLite
    audio_path TEXT,                     -- Future use
    embedding VECTOR(384),               -- Future use
    raw_data JSONB                       -- Complete original JSON for complex fields
);
```

#### JLPT Questions (New - Based on Actual Structure)
```sql
-- Base questions table
CREATE TABLE jlpt_questions (
    id BIGSERIAL PRIMARY KEY,
    original_id INT NOT NULL UNIQUE,     -- From JSON "id"
    title TEXT NOT NULL,                 -- From JSON "title" 
    title_trans TEXT,                    -- From JSON "title_trans"
    level INT NOT NULL,                  -- From JSON "level"
    level_of_difficult INT,              -- From JSON "level_of_difficult"
    tag TEXT NOT NULL,                   -- From JSON "tag" (grammar/listen/read/word)
    score INT,                           -- From JSON "score"
    kind TEXT NOT NULL,                  -- From JSON "kind" (specific question type)
    correct_answers INT[],               -- From JSON "correct_answers"
    check_explain INT,                   -- From JSON "check_explain"
    time_limit NUMERIC,                  -- From JSON "Time"
    created_at TIMESTAMPTZ,              -- From JSON "created_at"
    updated_at TIMESTAMPTZ,              -- From JSON "updated_at"
    raw_data JSONB NOT NULL              -- Complete JSON for complex/multilingual data
);

-- Question content (handles variable structure)
CREATE TABLE jlpt_question_content (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT REFERENCES jlpt_questions(id) ON DELETE CASCADE,
    question_html TEXT NOT NULL,         -- From JSON "content[].question" (raw HTML)
    question_text TEXT,                  -- Stripped HTML version
    image_url TEXT,                      -- From JSON "content[].image"
    answers JSONB NOT NULL,              -- From JSON "content[].answers"
    correct_answer_index INT NOT NULL,   -- From JSON "content[].correctAnswer"
    explanation TEXT,                    -- From JSON "content[].explain"
    explanations JSONB,                  -- From JSON "content[].explainAll"
    content_index INT DEFAULT 0          -- For questions with multiple content items
);

-- Audio/media data (from general section)
CREATE TABLE jlpt_question_media (
    question_id BIGINT PRIMARY KEY REFERENCES jlpt_questions(id) ON DELETE CASCADE,
    audio_url TEXT,                      -- From JSON "general.audio"
    audio_duration NUMERIC(8,3),         -- From JSON "general.audios.audio_time"
    image_url TEXT,                      -- From JSON "general.image"
    reading_passage TEXT,                -- From JSON "general.txt_read"
    multilingual_data JSONB              -- All text_read_* fields for future use
);
```

#### Kanji with Strokes (Enhanced)
```sql
CREATE TABLE kanji (
    id SERIAL PRIMARY KEY,
    character TEXT UNIQUE NOT NULL,      -- From cleaned_kanji.json "character"
    heisig_en TEXT,                      -- From cleaned_kanji.json "heisig_en"
    meanings TEXT[],                     -- From cleaned_kanji.json "meanings"
    detail TEXT,                         -- From cleaned_kanji.json "detail"
    unicode TEXT UNIQUE NOT NULL,        -- From cleaned_kanji.json "unicode"
    onyomi TEXT,                         -- From cleaned_kanji.json "onyomi"
    kunyomi TEXT,                        -- From cleaned_kanji.json "kunyomi"
    jlpt INT,                           -- From cleaned_kanji.json "jlpt"
    frequency INT,                       -- From cleaned_kanji.json "frequency"
    components TEXT,                     -- From cleaned_kanji.json "components"
    stroke_count INT,                    -- From cleaned_kanji.json "stroke_count"
    strokes_svg TEXT                     -- From kanji_svg_strokes.json "strokes_svg"
);
```

### 2. Learning Structure Models

#### Courses and Units (From Book Sets)
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                  -- From book_set.json "name" + "level"
    description TEXT,                    -- Generated from book_set.json metadata
    level TEXT,                          -- From book_set.json "level"
    total_words INT,                     -- From book_set.json "total_word"
    version INT                          -- From book_set.json "version"
);

CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    path LTREE NOT NULL,                 -- Hierarchical path for unit organization
    title TEXT NOT NULL,                 -- From book_set_unit_all.json "name"
    description TEXT,                    -- Generated description
    total_words INT                      -- From book_set_unit_all.json "total_word"
);

CREATE TABLE unit_items (
    unit_id INT REFERENCES units(id) ON DELETE CASCADE,
    item_type unit_item_enum NOT NULL,   -- 'word', 'kanji', 'grammar'
    item_id INT NOT NULL,                -- References words.id, kanji.id, etc.
    position INT,                        -- From book_set_unit_detail.json for ordering
    PRIMARY KEY (unit_id, item_type, item_id)
);
```

### 3. Study Tracking (Preserved from SQLite)

```sql
-- Preserved existing structure with enhancements
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE words_groups (
    id SERIAL PRIMARY KEY,
    word_id INT REFERENCES words(id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE(word_id, group_id)
);

CREATE TABLE study_activities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    type activity_enum NOT NULL,         -- Enhanced with proper enum
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE study_sessions (
    id BIGSERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    study_activity_id INT REFERENCES study_activities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE word_review_items (
    word_id INT REFERENCES words(id) ON DELETE CASCADE,
    study_session_id BIGINT REFERENCES study_sessions(id) ON DELETE CASCADE,
    correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (word_id, study_session_id)
);
```

## Data Models

### JSON to PostgreSQL Mapping

#### JLPT Questions Mapping
```json
// Input JSON Structure
{
  "Questions": [{
    "id": 12111,
    "title": "１から３の　ながから、いちばん　いい　ものを　ひとつ　えらんでください。",
    "general": {
      "audio": "http://mytest.eupgroup.net/uploads/audios/N5_1/nghe_hieu_dien_dat/Vidu.mp3",
      "audios": {"audio_time": 54.754},
      "image": "",
      "txt_read": ""
    },
    "content": [{
      "question": "",
      "image": "http://mytest.eupgroup.net/uploads/images/N5/N5_7.png",
      "answers": ["1","2","3"],
      "correctAnswer": 1,
      "explain": "<p>れい　正答２</p>",
      "explainAll": {"cn": "...", "en": "...", "vn": "..."}
    }],
    "level": 5,
    "kind": "listening_expressions",
    "tag": "listen"
  }]
}
```

```sql
-- PostgreSQL Storage
INSERT INTO jlpt_questions (original_id, title, level, kind, tag, raw_data) 
VALUES (12111, '１から３の...', 5, 'listening_expressions', 'listen', $json);

INSERT INTO jlpt_question_content (question_id, question_html, image_url, answers, correct_answer_index)
VALUES (question_id, '', 'http://...N5_7.png', '["1","2","3"]'::jsonb, 1);

INSERT INTO jlpt_question_media (question_id, audio_url, audio_duration)
VALUES (question_id, 'http://...Vidu.mp3', 54.754);
```

### Performance Optimizations

#### Indexes
```sql
-- Text search indexes
CREATE INDEX idx_words_kana_gin ON words USING gin (kana gin_trgm_ops);
CREATE INDEX idx_words_english_gin ON words USING gin (english gin_trgm_ops);

-- JLPT question indexes
CREATE INDEX idx_jlpt_questions_level ON jlpt_questions (level);
CREATE INDEX idx_jlpt_questions_tag ON jlpt_questions (tag);
CREATE INDEX idx_jlpt_questions_kind ON jlpt_questions (kind);

-- Hierarchical indexes
CREATE INDEX idx_units_path_gist ON units USING gist (path);

-- Foreign key indexes
CREATE INDEX idx_unit_items_unit ON unit_items (unit_id);
CREATE INDEX idx_unit_items_item ON unit_items (item_type, item_id);
```

## Error Handling

### Import Error Handling
```sql
-- Validation functions for safe JSON processing
CREATE OR REPLACE FUNCTION safe_jsonb_extract_text(json_data JSONB, key TEXT)
RETURNS TEXT AS $$
BEGIN
    IF json_data IS NULL OR json_data = 'null'::jsonb OR NOT json_data ? key THEN
        RETURN NULL;
    END IF;
    RETURN json_data ->> key;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error extracting key % from JSON: %', key, SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### Data Integrity Constraints
```sql
-- Ensure valid JLPT levels
ALTER TABLE words ADD CONSTRAINT check_jlpt_level 
    CHECK (jlpt IS NULL OR jlpt BETWEEN 1 AND 5);

-- Ensure valid question structure
ALTER TABLE jlpt_questions ADD CONSTRAINT check_question_tag 
    CHECK (tag IN ('grammar', 'listen', 'read', 'word'));

-- Ensure audio URLs are valid
ALTER TABLE jlpt_question_media ADD CONSTRAINT check_audio_url 
    CHECK (audio_url IS NULL OR audio_url ~ '^https?://');
```

## Testing Strategy

### Unit Tests
1. **JSON Import Functions**: Test safe extraction functions with malformed JSON
2. **Data Validation**: Test constraint enforcement
3. **Query Performance**: Test index usage with EXPLAIN ANALYZE

### Integration Tests
1. **Full Import Process**: Test complete 507MB import
2. **Data Integrity**: Verify all relationships are preserved
3. **Performance Benchmarks**: Compare query times vs SQLite

### Data Validation Tests
1. **Record Counts**: Verify all JSON records are imported
2. **Relationship Integrity**: Verify foreign key relationships
3. **Content Preservation**: Verify HTML/URL content is preserved correctly

## Migration Process

### Phase 1: Schema Creation
1. Create PostgreSQL database with extensions
2. Create all tables, indexes, and constraints
3. Create import helper functions

### Phase 2: Data Import
1. Import core data (kanji, words, grammar)
2. Import learning structure (courses, units, relationships)
3. Import JLPT questions (largest dataset)
4. Verify data integrity

### Phase 3: Application Migration
1. Update Go dependencies (postgres driver)
2. Update connection configuration
3. Test all existing endpoints
4. Deploy and monitor

### Phase 4: Optimization
1. Analyze query performance
2. Add additional indexes if needed
3. Optimize import scripts based on performance data