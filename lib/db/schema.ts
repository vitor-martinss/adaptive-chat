import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: varchar("user_id", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  abandoned: boolean("abandoned").notNull().default(false),
  resolved: boolean("resolved").notNull().default(false),
  withMicroInteractions: boolean("with_micro_interactions").notNull().default(false),
  topic: varchar("topic", { length: 255 }),
  caseType: varchar("case_type", { length: 64 }),
  metadata: jsonb("metadata"),
});

export type ChatSession = InferSelectModel<typeof chatSessions>;

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
});

export type ChatMessage = InferSelectModel<typeof chatMessages>;

export const chatVotes = pgTable(
  "chat_votes",
  {
    chatId: uuid("chat_id").notNull(),
    messageId: uuid("message_id").notNull(),
    isUpvoted: boolean("is_upvoted").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type ChatVote = InferSelectModel<typeof chatVotes>;

export const chatFeedback = pgTable("chat_feedback", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  satisfaction: varchar("satisfaction", { length: 1 }).notNull(),
  confidence: varchar("confidence", { length: 1 }).notNull(),
  comment: text("comment"),
});

export type ChatFeedback = InferSelectModel<typeof chatFeedback>;

export const userInteractions = pgTable("user_interactions", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id),
  interactionType: varchar("interaction_type", { length: 64 }).notNull(),
  content: text("content"),
  topic: varchar("topic", { length: 64 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UserInteraction = InferSelectModel<typeof userInteractions>;


