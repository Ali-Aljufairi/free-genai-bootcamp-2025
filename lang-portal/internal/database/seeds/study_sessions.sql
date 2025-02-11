-- Create study sessions
INSERT INTO study_sessions (group_id, study_activity_id) 
SELECT g.id, sa.id
FROM groups g
CROSS JOIN study_activities sa
WHERE g.name IN ('Basic Greetings', 'Numbers')
LIMIT 2;