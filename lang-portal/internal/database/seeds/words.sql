-- Insert some basic Japanese words
INSERT INTO words (japanese, romaji, english, parts) VALUES
    ('こんにちは', 'konnichiwa', 'hello', '{"type": "greeting", "formality": "neutral"}'),
    ('さようなら', 'sayounara', 'goodbye', '{"type": "greeting", "formality": "formal"}'),
    ('おはよう', 'ohayou', 'good morning', '{"type": "greeting", "formality": "informal"}'),
    ('一', 'ichi', 'one', '{"type": "number", "category": "cardinal"}'),
    ('二', 'ni', 'two', '{"type": "number", "category": "cardinal"}'),
    ('三', 'san', 'three', '{"type": "number", "category": "cardinal"}'),
    ('赤', 'aka', 'red', '{"type": "color", "category": "basic"}'),
    ('青', 'ao', 'blue', '{"type": "color", "category": "basic"}'),
    ('黄色', 'kiiro', 'yellow', '{"type": "color", "category": "basic"}'),
    ('お父さん', 'otousan', 'father', '{"type": "family", "formality": "polite"}'),
    ('お母さん', 'okaasan', 'mother', '{"type": "family", "formality": "polite"}'),
    ('兄', 'ani', 'older brother', '{"type": "family", "formality": "plain"}');