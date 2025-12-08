-- Remove foreign key constraint from chat_votes
ALTER TABLE "chat_votes" DROP CONSTRAINT IF EXISTS "chat_votes_message_id_chat_messages_id_fk";
