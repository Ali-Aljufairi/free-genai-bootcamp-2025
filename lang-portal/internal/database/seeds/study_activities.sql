-- Insert study activities
INSERT INTO study_activities (group_id, created_at) VALUES
    ((SELECT id FROM groups WHERE name = 'Basic Greetings'), CURRENT_TIMESTAMP),
    ((SELECT id FROM groups WHERE name = 'Numbers'), CURRENT_TIMESTAMP);