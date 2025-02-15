-- Insert sample words
INSERT INTO words (japanese, romaji, english, parts)
VALUES
    ('こんにちは', 'konnichiwa', 'hello', '{"type": "greeting", "level": "basic"}'),
    ('ありがとう', 'arigatou', 'thank you', '{"type": "greeting", "level": "basic"}'),
    ('さようなら', 'sayounara', 'goodbye', '{"type": "greeting", "level": "basic"}'),
    ('おはよう', 'ohayou', 'good morning', '{"type": "greeting", "level": "basic"}'),
    ('すみません', 'sumimasen', 'excuse me', '{"type": "greeting", "level": "basic"}');

-- Create a study group
INSERT INTO groups (name)
VALUES ('Basic Greetings');

-- Create a study session with ID 1
INSERT INTO study_sessions (id, group_id, created_at)
VALUES (1, 1, DATETIME('now'));

-- Create study activity for the session
INSERT INTO study_activities (study_session_id, group_id, created_at)
VALUES (1, 1, DATETIME('now'));

-- Link words to the group
INSERT INTO words_groups (word_id, group_id)
SELECT id, 1 FROM words WHERE japanese IN ('こんにちは', 'ありがとう', 'さようなら', 'おはよう', 'すみません');

-- Create word review items for study session 1
INSERT INTO word_review_items (word_id, study_session_id, correct, created_at)
SELECT id, 1, (RANDOM() > 0.5), DATETIME('now')
FROM words
WHERE japanese IN ('こんにちは', 'ありがとう', 'さようなら', 'おはよう', 'すみません');