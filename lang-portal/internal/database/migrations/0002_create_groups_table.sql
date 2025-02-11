-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);