/* ----------------------------------------------------------------------
   schema_v4.sql  —  Sorami Language Portal  (PostgreSQL ≥ 16)
   -------------------------------------------------------------------- */

/* 0. EXTENSIONS ------------------------------------------------------ */
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "vector";

/* 1. ENUMS ----------------------------------------------------------- */
CREATE TYPE role_enum AS ENUM ('admin','teacher','student');

CREATE TYPE pos_enum AS ENUM (
    'noun','verb','adjective','adverb',
    'particle','conjunction','interjection','auxiliary',
    'prefix','suffix','counter','expression'
);

CREATE TYPE activity_enum AS ENUM (          -- ❌ generic 'quiz' removed
    'flashcard',
    'grammar_quiz',   -- JLPT grammar MCQ
    'writing',        -- handwriting / drawing practice
    'speech_image',   -- speech-to-image study
    'shadow',         -- conversation / shadowing
    'stroke'          -- kanji stroke-order
);

CREATE TYPE relation_enum   AS ENUM (
    'USES_KANJI','APPEARS_IN','DEMONSTRATES','SIMILAR_TO','BELONGS_TO_UNIT'
);
CREATE TYPE unit_item_enum  AS ENUM ('word','kanji','grammar','sentence');
CREATE TYPE review_item_enum AS ENUM ('word','kanji','grammar','sentence');

/* 2. USERS, RBAC, BILLING ------------------------------------------- */
CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    clerk_id            UUID NOT NULL UNIQUE,
    email               TEXT NOT NULL,
    display_name        TEXT,
    stripe_customer_id  TEXT UNIQUE,        -- NEW
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name role_enum UNIQUE NOT NULL
);
INSERT INTO roles (role_name) VALUES ('admin'),('teacher'),('student');

CREATE TABLE user_roles (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT    REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE user_settings (                 -- UPDATED
    user_id              BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hide_english         BOOLEAN DEFAULT FALSE,
    srs_reset_at         TIMESTAMPTZ,
    ui_language          TEXT DEFAULT 'en',
    timezone             TEXT DEFAULT 'UTC',
    daily_review_target  INT  DEFAULT 20      -- # of reviews the user aims for
);

CREATE TABLE subscriptions (                 -- NEW
    id                     BIGSERIAL PRIMARY KEY,
    user_id                BIGINT REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    status                 TEXT,             -- active, past_due, canceled …
    current_period_end     TIMESTAMPTZ,
    created_at             TIMESTAMPTZ DEFAULT now()
);

/* 3. CORE CONTENT ---------------------------------------------------- */
CREATE TABLE kanji (
    id           SERIAL PRIMARY KEY,
    character    TEXT UNIQUE NOT NULL CHECK (char_length(character)=1),
    meaning_en   TEXT,
    onyomi       TEXT,
    kunyomi      TEXT,
    strokes_svg  TEXT,
    jlpt         INT
);

CREATE TABLE words (
    id              SERIAL PRIMARY KEY,
    kana            TEXT NOT NULL,
    kanji           TEXT,
    romaji          TEXT NOT NULL,
    english         TEXT NOT NULL,
    part_of_speech  pos_enum NOT NULL,
    jlpt            INT,
    level           INT DEFAULT 5,
    correct_count   INT DEFAULT 0,
    audio_path      TEXT,
    embedding       VECTOR(384)
);
CREATE INDEX idx_words_kana_gin   ON words USING gin (kana gin_trgm_ops);
CREATE INDEX idx_words_romaji_gin ON words USING gin (romaji gin_trgm_ops);

CREATE TABLE grammar_points (
    id          SERIAL PRIMARY KEY,
    pattern     TEXT UNIQUE NOT NULL,
    meaning_en  TEXT,
    jlpt        INT,
    explanation TEXT
);

CREATE TABLE sentences (
    id        SERIAL PRIMARY KEY,
    japanese  TEXT NOT NULL,
    english   TEXT,
    source    TEXT,
    embedding VECTOR(384)
);

/* 4. CONTENT GROUPS (words & kanji) --------------------------------- */
CREATE TABLE groups (                         -- NEW (global group catalogue)
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE word_groups (                    -- NEW
    word_id  INT REFERENCES words(id)  ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    PRIMARY KEY (word_id, group_id)
);

CREATE TABLE kanji_groups (                   -- NEW
    kanji_id INT REFERENCES kanji(id)  ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    PRIMARY KEY (kanji_id, group_id)
);

/* 5. GRAPH RELATIONS ------------------------------------------------- */
CREATE TABLE item_relations (
    id        BIGSERIAL PRIMARY KEY,
    from_type TEXT NOT NULL,
    from_id   INT  NOT NULL,
    rel_type  relation_enum NOT NULL,
    to_type   TEXT NOT NULL,
    to_id     INT  NOT NULL,
    position  INT,
    UNIQUE (from_type, from_id, rel_type, to_type, to_id)
);
CREATE INDEX idx_rel_from ON item_relations (from_type, from_id);
CREATE INDEX idx_rel_to   ON item_relations (to_type, to_id);

/* 6. COURSES, UNITS, TAGS, USER STUDY GROUPS ------------------------ */
CREATE TABLE courses (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE units (
    id          SERIAL PRIMARY KEY,
    course_id   INT REFERENCES courses(id) ON DELETE CASCADE,
    path        LTREE NOT NULL,
    title       TEXT NOT NULL,
    description TEXT
);
CREATE INDEX idx_units_path_gist ON units USING gist (path);

CREATE TABLE unit_items (
    unit_id   INT REFERENCES units(id) ON DELETE CASCADE,
    item_type unit_item_enum NOT NULL,
    item_id   INT NOT NULL,
    position  INT,
    PRIMARY KEY (unit_id, item_type, item_id)
);

CREATE TABLE study_groups (
    id          SERIAL PRIMARY KEY,
    owner_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    is_public   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE study_group_words (
    group_id INT REFERENCES study_groups(id) ON DELETE CASCADE,
    word_id  INT REFERENCES words(id) ON DELETE CASCADE,
    position INT,
    PRIMARY KEY (group_id, word_id)
);

CREATE TABLE word_tags (
    word_id INT REFERENCES words(id) ON DELETE CASCADE,
    tag     TEXT NOT NULL,
    PRIMARY KEY (word_id, tag)
);
CREATE INDEX idx_word_tags_tag ON word_tags(tag);

/* 7. STUDY FLOW & SPACED REPETITION --------------------------------- */
CREATE TABLE study_activities (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    activity_type activity_enum NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE study_sessions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    activity_id INT REFERENCES study_activities(id),
    unit_id     INT REFERENCES units(id),
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id);

CREATE TABLE review_items (
    session_id BIGINT REFERENCES study_sessions(id) ON DELETE CASCADE,
    item_type  review_item_enum NOT NULL,
    item_id    INT NOT NULL,
    correct    BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (session_id, item_type, item_id)
);
CREATE INDEX idx_review_items_item ON review_items(item_type, item_id);

/*  🔹  Enhanced analytics for SRS  🔹  */
CREATE TABLE progress (
    user_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
    item_type    review_item_enum NOT NULL,
    item_id      INT NOT NULL,
    seen_cnt     INT DEFAULT 0,         -- total attempts
    correct_cnt  INT DEFAULT 0,         -- total correct
    incorrect_cnt INT GENERATED ALWAYS AS (seen_cnt - correct_cnt) STORED,
    last_seen    TIMESTAMPTZ,
    next_due     TIMESTAMPTZ,
    PRIMARY KEY (user_id, item_type, item_id)
);
CREATE INDEX idx_progress_due ON progress(user_id, next_due);

/* 8. SHADOWING & STROKE-ORDER --------------------------------------- */
CREATE TABLE shadow_attempts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    sentence_id INT REFERENCES sentences(id),
    audio_path  TEXT,
    accuracy    NUMERIC(5,2),
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE kanji_traces (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    kanji_id    INT REFERENCES kanji(id),
    trace_svg   TEXT,
    accuracy    NUMERIC(5,2),
    created_at  TIMESTAMPTZ DEFAULT now()
);

/* 9. CHAT HISTORY ---------------------------------------------------- */
CREATE TABLE chat_sessions (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    context    TEXT
);

CREATE TABLE chat_messages (
    id         BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender     TEXT NOT NULL CHECK (sender IN ('user','assistant')),
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

/* ------------------------------------------------------------------ */
/*                           END OF SCHEMA                            */
/* ------------------------------------------------------------------ */