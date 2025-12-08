import "server-only";
import { and, avg, count, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  chatSessions,
  chatMessages,
  chatVotes,
  chatFeedback,
  userInteractions,
} from "./schema";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function trackUserInteraction({
  sessionId,
  interactionType,
  content,
  metadata,
}: {
  sessionId: string;
  interactionType: string;
  content?: string;
  metadata?: Record<string, any>;
}) {
  try {
    // Ensure session exists first
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
    if (!session) {
      await db.insert(chatSessions).values({ id: sessionId });
    }
    
    await db.insert(userInteractions).values({
      sessionId,
      interactionType,
      content,
      metadata,
    });
  } catch (error) {
    console.error("Failed to track interaction:", error);
  }
}

export async function getDashboardStats(filters?: {
  dateFrom?: Date;
  dateTo?: Date;
  withMicroInteractions?: boolean;
}) {
  try {
    const conditions = [];
    
    if (filters?.dateFrom) {
      conditions.push(gte(chatSessions.createdAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(chatSessions.createdAt, filters.dateTo));
    }
    if (filters?.withMicroInteractions !== undefined) {
      conditions.push(eq(chatSessions.withMicroInteractions, filters.withMicroInteractions));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total sessions
    const [totalSessions] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(whereClause);

    // Sessions with/without micro
    const withMicroConditions = whereClause ? [whereClause, eq(chatSessions.withMicroInteractions, true)] : [eq(chatSessions.withMicroInteractions, true)];
    const [withMicro] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(and(...withMicroConditions));

    const withoutMicroConditions = whereClause ? [whereClause, eq(chatSessions.withMicroInteractions, false)] : [eq(chatSessions.withMicroInteractions, false)];
    const [withoutMicro] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(and(...withoutMicroConditions));

    // Abandoned sessions
    const abandonedConditions = whereClause ? [whereClause, eq(chatSessions.abandoned, true)] : [eq(chatSessions.abandoned, true)];
    const [abandoned] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(and(...abandonedConditions));

    // Total messages
    const [totalMessages] = await db
      .select({ count: count() })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(whereClause);

    // Avg messages per session
    const [avgMessages] = await db
      .select({ avg: avg(sql`(SELECT COUNT(*) FROM chat_messages WHERE session_id = chat_sessions.id)`) })
      .from(chatSessions)
      .where(whereClause);

    // Feedback metrics
    let feedbackStats = { avgSat: 0, avgConf: 0 };
    try {
      const result = await client.unsafe(`
        SELECT 
          AVG(satisfaction::INTEGER) as "avgSat",
          AVG(confidence::INTEGER) as "avgConf"
        FROM chat_feedback
      `);
      if (result[0]) feedbackStats = result[0];
    } catch (e) {
      console.error('Feedback query error:', e);
    }

    // Vote metrics
    const [totalVotes] = await db.select({ count: count() }).from(chatVotes);
    const [upvotes] = await db
      .select({ count: count() })
      .from(chatVotes)
      .where(eq(chatVotes.isUpvoted, true));

    // Interaction metrics
    const suggestionConditions = whereClause ? [whereClause, eq(userInteractions.interactionType, "suggestion_click")] : [eq(userInteractions.interactionType, "suggestion_click")];
    const [suggestionClicks] = await db
      .select({ count: count() })
      .from(userInteractions)
      .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
      .where(and(...suggestionConditions));

    const typedConditions = whereClause ? [whereClause, eq(userInteractions.interactionType, "typed_message")] : [eq(userInteractions.interactionType, "typed_message")];
    const [typedMessages] = await db
      .select({ count: count() })
      .from(userInteractions)
      .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
      .where(and(...typedConditions));

    // Time series data
    const sessionsPerDay = await db
      .select({
        date: sql<string>`DATE(chat_sessions.created_at)`,
        withMicro: chatSessions.withMicroInteractions,
        count: count(),
      })
      .from(chatSessions)
      .where(whereClause)
      .groupBy(sql`DATE(chat_sessions.created_at)`, chatSessions.withMicroInteractions)
      .orderBy(sql`DATE(chat_sessions.created_at)`);

    const total = totalSessions?.count || 0;
    const abandonedCount = abandoned?.count || 0;
    const totalVotesCount = totalVotes?.count || 0;
    const upvotesCount = upvotes?.count || 0;
    const suggestionCount = suggestionClicks?.count || 0;
    const typedCount = typedMessages?.count || 0;

    return {
      totalSessions: total,
      withMicroInteractions: withMicro?.count || 0,
      withoutMicroInteractions: withoutMicro?.count || 0,
      abandonmentRate: total > 0 ? (abandonedCount / total) * 100 : 0,
      totalMessages: totalMessages?.count || 0,
      avgMessagesPerSession: parseFloat(avgMessages?.avg || "0"),
      avgSatisfaction: feedbackStats?.avgSat || 0,
      avgConfidence: feedbackStats?.avgConf || 0,
      totalVotes: totalVotesCount,
      upvotes: upvotesCount,
      downvotes: totalVotesCount - upvotesCount,
      upvoteRatio: totalVotesCount > 0 ? (upvotesCount / totalVotesCount) * 100 : 0,
      suggestionClicks: suggestionCount,
      typedMessages: typedCount,
      suggestionRatio: suggestionCount + typedCount > 0 ? (suggestionCount / (suggestionCount + typedCount)) * 100 : 0,
      sessionsPerDay,
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    throw error;
  }
}
