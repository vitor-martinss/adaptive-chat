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
import { withTransaction } from "./transaction";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function updateSessionTopic(sessionId: string, topic: string, caseType: string) {
  return withTransaction(async (tx) => {
    await tx.update(chatSessions)
      .set({ topic, caseType })
      .where(eq(chatSessions.id, sessionId));
  });
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

    // Abandoned sessions (only count those explicitly marked)
    const abandonedConditions = whereClause ? [whereClause, eq(chatSessions.abandoned, true)] : [eq(chatSessions.abandoned, true)];
    const [abandoned] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(and(...abandonedConditions));

    // Sessions without proper ending (also considered abandoned)
    const unfinishedConditions = whereClause ? 
      [whereClause, sql`ended_at IS NULL AND created_at < NOW() - INTERVAL '1 hour'`] : 
      [sql`ended_at IS NULL AND created_at < NOW() - INTERVAL '1 hour'`];
    const [unfinished] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(and(...unfinishedConditions));

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
    let feedbackStats = { avgSat: 0, avgConf: 0, completedSessions: 0, redirectedSessions: 0, skippedSessions: 0 };
    try {
      const feedbackConditions = [];
      if (filters?.dateFrom) feedbackConditions.push(`cs.created_at >= '${filters.dateFrom.toISOString()}'`);
      if (filters?.dateTo) feedbackConditions.push(`cs.created_at <= '${filters.dateTo.toISOString()}'`);
      if (filters?.withMicroInteractions !== undefined) feedbackConditions.push(`cs.with_micro_interactions = ${filters.withMicroInteractions}`);
      
      const feedbackWhere = feedbackConditions.length > 0 ? 'WHERE ' + feedbackConditions.join(' AND ') : '';
      
      const result = await client.unsafe(`
        SELECT 
          AVG(cf.satisfaction::INTEGER) as "avgSat",
          AVG(cf.confidence::INTEGER) as "avgConf",
          COUNT(DISTINCT cf.session_id) as "completedSessions"
        FROM chat_sessions cs
        LEFT JOIN chat_feedback cf ON cf.session_id = cs.id
        ${feedbackWhere}
      `);
      
      const redirectResult = await client.unsafe(`
        SELECT 
          COUNT(DISTINCT ui.session_id) as "redirectedSessions"
        FROM chat_sessions cs
        INNER JOIN user_interactions ui ON ui.session_id = cs.id AND ui.interaction_type = 'post_feedback_redirect'
        ${feedbackWhere}
      `);
      
      const skipResult = await client.unsafe(`
        SELECT 
          COUNT(DISTINCT ui.session_id) as "skippedSessions"
        FROM chat_sessions cs
        INNER JOIN user_interactions ui ON ui.session_id = cs.id AND ui.interaction_type = 'feedback_skipped'
        ${feedbackWhere}
      `);
      
      if (result[0]) {
        feedbackStats = { 
          avgSat: Number(result[0].avgSat) || 0, 
          avgConf: Number(result[0].avgConf) || 0,
          completedSessions: Number(result[0].completedSessions) || 0,
          redirectedSessions: Number(redirectResult[0]?.redirectedSessions) || 0,
          skippedSessions: Number(skipResult[0]?.skippedSessions) || 0
        };
      }
    } catch (e) {
      console.error('Feedback query error:', e);
    }

    // Vote metrics - FIXED: apply session filters via join
    const voteConditions = whereClause ? [whereClause] : [];
    const [totalVotes] = await db
      .select({ count: count() })
      .from(chatVotes)
      .innerJoin(chatSessions, eq(chatVotes.chatId, chatSessions.id))
      .where(voteConditions.length > 0 ? and(...voteConditions) : undefined);
    
    const [upvotes] = await db
      .select({ count: count() })
      .from(chatVotes)
      .innerJoin(chatSessions, eq(chatVotes.chatId, chatSessions.id))
      .where(voteConditions.length > 0 ? and(...voteConditions, eq(chatVotes.isUpvoted, true)) : eq(chatVotes.isUpvoted, true));

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

    // Daily breakdown with all metrics - FIXED: use subqueries to avoid JOIN inflation
    let dailyQuery = `
      SELECT 
        TO_CHAR(DATE(cs.created_at), 'YYYY-MM-DD') as date,
        COUNT(CASE WHEN cs.with_micro_interactions = true THEN 1 END) as sessions_with,
        COUNT(CASE WHEN cs.with_micro_interactions = false THEN 1 END) as sessions_without,
        COUNT(*) as total_sessions,
        COALESCE(SUM((SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id)), 0) as total_messages,
        COALESCE(AVG(EXTRACT(EPOCH FROM (cs.ended_at - cs.created_at))), 0) as avg_duration_sec,
        COALESCE(AVG((SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id)), 0) as avg_messages,
        COALESCE(
          SUM((SELECT COUNT(*) FROM chat_votes WHERE chat_id = cs.id AND is_upvoted = true))::float / 
          NULLIF(SUM((SELECT COUNT(*) FROM chat_votes WHERE chat_id = cs.id)), 0), 
          0
        ) as upvote_ratio,
        COALESCE(
          SUM((SELECT COUNT(*) FROM user_interactions WHERE session_id = cs.id AND interaction_type = 'suggestion_click'))::float / 
          NULLIF(SUM((SELECT COUNT(*) FROM user_interactions WHERE session_id = cs.id AND interaction_type IN ('suggestion_click', 'typed_message'))), 0), 
          0
        ) as suggestion_ratio,
        COALESCE(AVG((SELECT AVG(satisfaction::INTEGER) FROM chat_feedback WHERE session_id = cs.id)), 0) as avg_satisfaction,
        COALESCE(AVG((SELECT AVG(confidence::INTEGER) FROM chat_feedback WHERE session_id = cs.id)), 0) as avg_confidence
      FROM chat_sessions cs
    `;
    
    const whereParts = [];
    if (filters?.dateFrom) whereParts.push(`cs.created_at >= '${filters.dateFrom.toISOString()}'`);
    if (filters?.dateTo) whereParts.push(`cs.created_at <= '${filters.dateTo.toISOString()}'`);
    if (filters?.withMicroInteractions !== undefined) whereParts.push(`cs.with_micro_interactions = ${filters.withMicroInteractions}`);
    
    if (whereParts.length > 0) {
      dailyQuery += ' WHERE ' + whereParts.join(' AND ');
    }
    
    dailyQuery += ' GROUP BY DATE(cs.created_at) ORDER BY DATE(cs.created_at)';
    
    const dailyBreakdownRaw = await client.unsafe(dailyQuery);

    const dailyBreakdown = dailyBreakdownRaw.map((row: any) => ({
      date: row.date,
      sessionsWith: Number(row.sessions_with) || 0,
      sessionsWithout: Number(row.sessions_without) || 0,
      totalSessions: Number(row.total_sessions) || 0,
      totalMessages: Number(row.total_messages) || 0,
      avgMessagesPerSession: Number(row.avg_messages) || 0,
      avgSessionDurationSec: Number(row.avg_duration_sec) || 0,
      upvoteRatio: Number(row.upvote_ratio) || 0,
      suggestionRatio: Number(row.suggestion_ratio) || 0,
      avgSatisfaction: Number(row.avg_satisfaction) || 0,
      avgConfidence: Number(row.avg_confidence) || 0,
    }));

    // Session duration metrics
    const endedConditions = [];
    if (whereClause) endedConditions.push(whereClause);
    endedConditions.push(sql`ended_at IS NOT NULL`);
    
    const durationQuery = await db
      .select({
        avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)`,
        medianMs: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)`,
      })
      .from(chatSessions)
      .where(and(...endedConditions));

    const [durationWithMicro] = await db
      .select({ avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)` })
      .from(chatSessions)
      .where(and(...endedConditions, eq(chatSessions.withMicroInteractions, true)));

    const [durationWithoutMicro] = await db
      .select({ avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)` })
      .from(chatSessions)
      .where(and(...endedConditions, eq(chatSessions.withMicroInteractions, false)));

    const [durationAbandoned] = await db
      .select({ avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)` })
      .from(chatSessions)
      .where(and(...endedConditions, eq(chatSessions.abandoned, true)));

    const total = totalSessions?.count || 0;
    const abandonedCount = (abandoned?.count || 0) + (unfinished?.count || 0);
    const totalVotesCount = totalVotes?.count || 0;
    const upvotesCount = upvotes?.count || 0;
    const suggestionCount = suggestionClicks?.count || 0;
    const typedCount = typedMessages?.count || 0;

    // Topic-based metrics
    const topicStatsQuery = `
      SELECT 
        cs.topic,
        cs.case_type,
        COUNT(*) as session_count,
        AVG(EXTRACT(EPOCH FROM (cs.ended_at - cs.created_at))) as avg_duration_sec,
        AVG((SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id)) as avg_messages,
        COALESCE(AVG(cf.satisfaction::INTEGER), 0) as avg_satisfaction,
        COUNT(CASE WHEN ui.interaction_type = 'suggestion_click' THEN 1 END) as suggestion_clicks,
        COUNT(CASE WHEN ui.interaction_type = 'typed_message' THEN 1 END) as typed_messages
      FROM chat_sessions cs
      LEFT JOIN chat_feedback cf ON cf.session_id = cs.id
      LEFT JOIN user_interactions ui ON ui.session_id = cs.id
      ${whereParts.length > 0 ? 'WHERE ' + whereParts.join(' AND ') : ''}
      GROUP BY cs.topic, cs.case_type
      ORDER BY session_count DESC
    `;
    
    const topicStatsRaw = await client.unsafe(topicStatsQuery);
    const topicStats = topicStatsRaw.map((row: any) => ({
      topic: row.topic || 'não_classificado',
      caseType: row.case_type || 'geral',
      sessionCount: Number(row.session_count) || 0,
      avgDurationSec: Number(row.avg_duration_sec) || 0,
      avgMessages: Number(row.avg_messages) || 0,
      avgSatisfaction: Number(row.avg_satisfaction) || 0,
      suggestionClicks: Number(row.suggestion_clicks) || 0,
      typedMessages: Number(row.typed_messages) || 0,
      suggestionRatio: (Number(row.suggestion_clicks) + Number(row.typed_messages)) > 0 
        ? (Number(row.suggestion_clicks) / (Number(row.suggestion_clicks) + Number(row.typed_messages))) * 100 
        : 0
    }));

    // Unique users metrics - FIXED: exclude NULL user_ids
    const [uniqueUsers] = await db
      .select({ count: sql<number>`COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id END)` })
      .from(chatSessions)
      .where(whereClause);

    const [uniqueUsersWithFeedback] = await db
      .select({ count: sql<number>`COUNT(DISTINCT CASE WHEN chat_sessions.user_id IS NOT NULL THEN chat_sessions.user_id END)` })
      .from(chatSessions)
      .innerJoin(chatFeedback, eq(chatFeedback.sessionId, chatSessions.id))
      .where(whereClause);

    return {
      totalSessions: total,
      uniqueUsers: uniqueUsers?.count || 0,
      uniqueUsersWithFeedback: uniqueUsersWithFeedback?.count || 0,
      feedbackCompletionRate: (uniqueUsers?.count || 0) > 0 ? ((uniqueUsersWithFeedback?.count || 0) / (uniqueUsers?.count || 0)) * 100 : 0,
      withMicroInteractions: withMicro?.count || 0,
      withoutMicroInteractions: withoutMicro?.count || 0,
      abandonmentRate: total > 0 ? (abandonedCount / total) * 100 : 0,
      totalMessages: totalMessages?.count || 0,
      avgMessagesPerSession: parseFloat(avgMessages?.avg || "0"),
      avgSatisfaction: Number(feedbackStats.avgSat) || 0,
      avgConfidence: Number(feedbackStats.avgConf) || 0,
      completedSessions: feedbackStats.completedSessions,
      redirectedSessions: feedbackStats.redirectedSessions,
      skippedSessions: feedbackStats.skippedSessions,
      redirectRate: feedbackStats.completedSessions > 0 ? (feedbackStats.redirectedSessions / feedbackStats.completedSessions) * 100 : 0,
      totalVotes: totalVotesCount,
      upvotes: upvotesCount,
      downvotes: totalVotesCount - upvotesCount,
      upvoteRatio: totalVotesCount > 0 ? (upvotesCount / totalVotesCount) * 100 : 0,
      suggestionClicks: suggestionCount,
      typedMessages: typedCount,
      suggestionRatio: suggestionCount + typedCount > 0 ? (suggestionCount / (suggestionCount + typedCount)) * 100 : 0,
      sessionsPerDay,
      dailyBreakdown,
      topicStats,
      sessionDuration: {
        avgMs: Number(durationQuery[0]?.avgMs) || 0,
        medianMs: Number(durationQuery[0]?.medianMs) || 0,
        avgWithMicroMs: Number(durationWithMicro?.avgMs) || 0,
        avgWithoutMicroMs: Number(durationWithoutMicro?.avgMs) || 0,
        avgAbandonedMs: Number(durationAbandoned?.avgMs) || 0,
      },
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    throw error;
  }
}
