ALTER TABLE chat_sessions 
ALTER COLUMN topic TYPE varchar(255);

ALTER TABLE user_interactions 
ALTER COLUMN topic TYPE varchar(255);

ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS metadata JSONB;
