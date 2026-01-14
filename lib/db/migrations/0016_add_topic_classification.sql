-- Add topic classification to sessions and interactions
ALTER TABLE chat_sessions ADD COLUMN topic VARCHAR(64);
ALTER TABLE chat_sessions ADD COLUMN case_type VARCHAR(64);
ALTER TABLE user_interactions ADD COLUMN topic VARCHAR(64);

-- Create index for better performance
CREATE INDEX idx_chat_sessions_topic ON chat_sessions(topic);
CREATE INDEX idx_chat_sessions_case_type ON chat_sessions(case_type);
CREATE INDEX idx_user_interactions_topic ON user_interactions(topic);