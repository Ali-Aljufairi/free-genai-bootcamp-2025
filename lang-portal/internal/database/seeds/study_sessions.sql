-- Create study sessions
INSERT INTO study_sessions (group_id, study_activity_id) 
SELECT g.id, sa.id
FROM groups g
JOIN study_activities sa ON sa.group_id = g.id
WHERE g.name IN ('Basic Greetings', 'Numbers')
LIMIT 2;