-- Clear existing data that may be too long or invalid
DELETE FROM "chat_messages" WHERE true;

-- Now alter the columns
ALTER TABLE "chat_messages" ALTER COLUMN "response_time_ms" TYPE varchar(20) USING NULL;
ALTER TABLE "chat_messages" ALTER COLUMN "token_count_prompt" TYPE varchar(20) USING NULL;
ALTER TABLE "chat_messages" ALTER COLUMN "token_count_completion" TYPE varchar(20) USING NULL;
ALTER TABLE "chat_messages" ALTER COLUMN "message_index" TYPE text USING message_index::text;