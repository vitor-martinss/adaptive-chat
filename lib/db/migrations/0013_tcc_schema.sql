-- TCC Schema: Clean implementation (drop legacy, create TCC tables)

-- Drop legacy tables
DROP TABLE IF EXISTS "Stream" CASCADE;
DROP TABLE IF EXISTS "Suggestion" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Vote_v2" CASCADE;
DROP TABLE IF EXISTS "Vote" CASCADE;
DROP TABLE IF EXISTS "Message_v2" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Chat" CASCADE;

-- Create TCC tables
CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "ended_at" timestamp,
  "abandoned" boolean DEFAULT false NOT NULL,
  "with_micro_interactions" boolean DEFAULT false NOT NULL,
  "metadata" jsonb
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "role" varchar NOT NULL,
  "content" text NOT NULL,
  CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "chat_votes" (
  "chat_id" uuid NOT NULL,
  "message_id" uuid NOT NULL,
  "is_upvoted" boolean NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "chat_votes_chat_id_message_id_pk" PRIMARY KEY("chat_id","message_id")
);

CREATE TABLE IF NOT EXISTS "chat_feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "satisfaction" varchar(1) NOT NULL,
  "confidence" varchar(1) NOT NULL,
  "comment" text,
  CONSTRAINT "chat_feedback_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "user_interactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "interaction_type" varchar(64) NOT NULL,
  "content" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_interactions_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "chat_messages_session_idx" ON "chat_messages" ("session_id");
CREATE INDEX IF NOT EXISTS "chat_messages_created_idx" ON "chat_messages" ("created_at");
CREATE INDEX IF NOT EXISTS "chat_feedback_session_idx" ON "chat_feedback" ("session_id");
CREATE INDEX IF NOT EXISTS "user_interactions_session_idx" ON "user_interactions" ("session_id");
CREATE INDEX IF NOT EXISTS "user_interactions_type_idx" ON "user_interactions" ("interaction_type");
CREATE INDEX IF NOT EXISTS "chat_sessions_created_idx" ON "chat_sessions" ("created_at");
CREATE INDEX IF NOT EXISTS "chat_sessions_micro_idx" ON "chat_sessions" ("with_micro_interactions");
