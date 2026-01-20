ALTER TABLE chat_sessions 
ALTER COLUMN topic TYPE varchar(255);

ALTER TABLE user_interactions 
ALTER COLUMN topic TYPE varchar(255);
