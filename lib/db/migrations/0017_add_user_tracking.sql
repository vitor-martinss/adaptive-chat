-- Add userId column to track unique users
ALTER TABLE chat_sessions ADD COLUMN user_id VARCHAR(64);

-- Create index for performance
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);