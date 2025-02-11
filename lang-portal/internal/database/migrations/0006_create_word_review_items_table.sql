-- Create word_review_items table
CREATE TABLE IF NOT EXISTS word_review_items (
    word_id INTEGER NOT NULL,
    study_session_id INTEGER NOT NULL,
    correct BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    FOREIGN KEY (study_session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
    PRIMARY KEY (word_id, study_session_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_word_review_items_word_id ON word_review_items(word_id);
CREATE INDEX IF NOT EXISTS idx_word_review_items_session_id ON word_review_items(study_session_id);