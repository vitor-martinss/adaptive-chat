-- Fix chat_messages columns that may be timestamp instead of text/varchar
-- This ensures only created_at is timestamp, all others are text/varchar

-- First, check if columns exist as timestamp and convert them
DO $$
BEGIN
    -- Fix response_time_ms if it's timestamp
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'response_time_ms' 
        AND data_type LIKE '%timestamp%'
    ) THEN
        ALTER TABLE "chat_messages" ALTER COLUMN "response_time_ms" TYPE varchar(20);
    END IF;

    -- Fix token_count_prompt if it's timestamp
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'token_count_prompt' 
        AND data_type LIKE '%timestamp%'
    ) THEN
        ALTER TABLE "chat_messages" ALTER COLUMN "token_count_prompt" TYPE varchar(20);
    END IF;

    -- Fix token_count_completion if it's timestamp
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'token_count_completion' 
        AND data_type LIKE '%timestamp%'
    ) THEN
        ALTER TABLE "chat_messages" ALTER COLUMN "token_count_completion" TYPE varchar(20);
    END IF;

    -- Fix message_index if it's timestamp
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'message_index' 
        AND data_type LIKE '%timestamp%'
    ) THEN
        ALTER TABLE "chat_messages" ALTER COLUMN "message_index" TYPE text;
    END IF;
END $$;