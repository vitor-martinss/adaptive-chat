-- Clear all collected data for fresh start
TRUNCATE TABLE user_interactions CASCADE;
TRUNCATE TABLE chat_feedback CASCADE;
TRUNCATE TABLE chat_votes CASCADE;
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE chat_sessions CASCADE;

-- Reset sequences if needed
ALTER SEQUENCE IF EXISTS chat_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS chat_messages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS chat_feedback_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_interactions_id_seq RESTART WITH 1;