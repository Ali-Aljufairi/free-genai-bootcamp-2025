-- Insert study activities
INSERT INTO study_activities (id, name, thumbnail_url, description, group_id, created_at) VALUES
    (1, 'Basic Vocabulary', 'https://example.com/basic-vocab.jpg', 'Learn fundamental vocabulary words', (SELECT id FROM groups WHERE name = 'Basic Greetings'), CURRENT_TIMESTAMP),
    (12222221, 'Vocabulary Quiz', 'https://example.com/vocab-quiz.jpg', 'Practice your vocabulary with flashcards', (SELECT id FROM groups WHERE name = 'Basic Greetings'), CURRENT_TIMESTAMP),
    (53333, 'Writing Practice', 'https://example.com/writing.jpg', 'Practice writing Japanese characters', (SELECT id FROM groups WHERE name = 'Basic Greetings'), CURRENT_TIMESTAMP),
    (44433, 'Listening Exercise', 'https://example.com/listening.jpg', 'Improve your listening comprehension', (SELECT id FROM groups WHERE name = 'Numbers'), CURRENT_TIMESTAMP);