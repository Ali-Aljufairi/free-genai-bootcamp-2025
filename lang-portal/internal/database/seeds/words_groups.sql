-- Link words to groups
INSERT INTO words_groups (word_id, group_id) 
SELECT w.id, g.id 
FROM words w, groups g 
WHERE 
    (w.japanese IN ('こんにちは', 'さようなら', 'おはよう') AND g.name = 'Basic Greetings')
    OR (w.japanese IN ('一', '二', '三') AND g.name = 'Numbers')
    OR (w.japanese IN ('赤', '青', '黄色') AND g.name = 'Colors')
    OR (w.japanese IN ('お父さん', 'お母さん', '兄') AND g.name = 'Family Members');