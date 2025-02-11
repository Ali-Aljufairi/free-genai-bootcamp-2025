-- Insert word review items
INSERT INTO word_review_items (word_id, study_session_id, correct)
SELECT w.id, s.id, (ABS(RANDOM()) % 2) = 1
FROM words w
CROSS JOIN study_sessions s
WHERE w.japanese IN ('こんにちは', 'さようなら', '一', '二')
LIMIT 8;