# Database Schema

Our database will be a single sqlite database called `words.db`

## Tables

### words
Stored vocabulary words
- id integer
- japanese string
- romaji string
- english string
- parts json

### words_groups
Join table for words and groups many-to-many
- id integer
- word_id integer
- group_id integer

### groups
Thematic groups of words
- id integer
- name string

### study_sessions
Records of study sessions grouping word_review_items
- id integer
- group_id integer
- created_at datetime
- study_activity_id integer

### study_activities
A specific study activity, linking a study session to group
- id integer
- study_session_id integer
- group_id integer
- created_at datetime

### word_review_items
A record of word practice, determining if the word was correct or not
- word_id integer
- study_session_id integer
- correct boolean
- created_at datetime