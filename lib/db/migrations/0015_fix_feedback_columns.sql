-- Fix chat_feedback columns to be varchar instead of timestamp
ALTER TABLE chat_feedback 
  ALTER COLUMN satisfaction TYPE varchar(1) USING satisfaction::text,
  ALTER COLUMN confidence TYPE varchar(1) USING confidence::text;
