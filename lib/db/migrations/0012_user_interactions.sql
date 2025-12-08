-- Create user interaction tracking tables
CREATE TABLE IF NOT EXISTS "user_interactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chatId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "interactionType" varchar(50) NOT NULL,
  "content" text,
  "metadata" jsonb,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_interactions_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade,
  CONSTRAINT "user_interactions_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "user_interactions_chatId_idx" ON "user_interactions" ("chatId");
CREATE INDEX IF NOT EXISTS "user_interactions_userId_idx" ON "user_interactions" ("userId");
CREATE INDEX IF NOT EXISTS "user_interactions_type_idx" ON "user_interactions" ("interactionType");
CREATE INDEX IF NOT EXISTS "user_interactions_createdAt_idx" ON "user_interactions" ("createdAt");
