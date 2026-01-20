import { NextResponse } from "next/server";
import { and, count, eq, gte, lte, sql, avg } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  chatSessions,
  chatMessages,
  chatVotes,
  chatFeedback,
  userInteractions,
} from "@/lib/db/schema";

export async function GET(request: Request) {
  let client;
  try {
    client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const withMicro = searchParams.get("withMicroInteractions");

    // Build conditions
    const conditions = [];
    if (dateFrom) conditions.push(gte(chatSessions.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(chatSessions.createdAt, new Date(dateTo)));
    if (withMicro !== null && withMicro !== "") {
      conditions.push(eq(chatSessions.withMicroInteractions, withMicro === "true"));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total sessions
    const [totalResult] = await db.select({ count: count() }).from(chatSessions).where(whereClause);
    const totalSessions = totalResult?.count || 0;

    // Sessions with/without micro
    const [withMicroResult] = await db.select({ count: count() }).from(chatSessions)
      .where(whereClause ? and(whereClause, eq(chatSessions.withMicroInteractions, true)) : eq(chatSessions.withMicroInteractions, true));
    const [withoutMicroResult] = await db.select({ count: count() }).from(chatSessions)
      .where(whereClause ? and(whereClause, eq(chatSessions.withMicroInteractions, false)) : eq(chatSessions.withMicroInteractions, false));

    // Abandoned
    const [abandonedResult] = await db.select({ count: count() }).from(chatSessions)
      .where(whereClause ? and(whereClause, eq(chatSessions.abandoned, true)) : eq(chatSessions.abandoned, true));

    // Messages
    const [messagesResult] = await db.select({ count: count() }).from(chatMessages);

    // Feedback
    const [feedbackResult] = await db.select({
      avgSatisfaction: avg(sql`${chatFeedback.satisfaction}::integer`),
      avgConfidence: avg(sql`${chatFeedback.confidence}::integer`),
      count: count(),
    }).from(chatFeedback);

    // Votes
    const [votesResult] = await db.select({ count: count() }).from(chatVotes);
    const [upvotesResult] = await db.select({ count: count() }).from(chatVotes).where(eq(chatVotes.isUpvoted, true));

    // Interactions
    const [suggestionResult] = await db.select({ count: count() }).from(userInteractions).where(eq(userInteractions.interactionType, "suggestion_click"));
    const [typedResult] = await db.select({ count: count() }).from(userInteractions).where(eq(userInteractions.interactionType, "typed_message"));

    // Interactions for redirected/skipped sessions
    const [redirectedResult] = await db.select({ count: count() })
      .from(userInteractions)
      .where(eq(userInteractions.interactionType, "post_feedback_redirect"));
    
    const [skippedResult] = await db.select({ count: count() })
      .from(userInteractions)
      .where(eq(userInteractions.interactionType, "feedback_skipped"));

    // Unique users
    const [uniqueUsersResult] = await db.select({ count: sql<number>`COUNT(DISTINCT user_id)` }).from(chatSessions).where(whereClause);

    // Duration
    const [durationResult] = await db.select({
      avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)`,
    }).from(chatSessions).where(sql`ended_at IS NOT NULL`);

    // Daily breakdown
    const dailyData = await db.select({
      date: sql<string>`TO_CHAR(DATE(created_at), 'YYYY-MM-DD')`,
      count: count(),
      withMicro: chatSessions.withMicroInteractions,
    }).from(chatSessions).where(whereClause)
      .groupBy(sql`DATE(created_at)`, chatSessions.withMicroInteractions)
      .orderBy(sql`DATE(created_at)`);

    const dailyMap = new Map<string, { sessionsWith: number; sessionsWithout: number }>();
    for (const row of dailyData) {
      const existing = dailyMap.get(row.date) || { sessionsWith: 0, sessionsWithout: 0 };
      if (row.withMicro) existing.sessionsWith = row.count;
      else existing.sessionsWithout = row.count;
      dailyMap.set(row.date, existing);
    }

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      sessionsWith: data.sessionsWith,
      sessionsWithout: data.sessionsWithout,
      totalSessions: data.sessionsWith + data.sessionsWithout,
      totalMessages: 0, avgMessagesPerSession: 0, avgSessionDurationSec: 0,
      upvoteRatio: 0, suggestionRatio: 0, avgSatisfaction: 0, avgConfidence: 0,
    }));

    // Topic stats
    const topicData = await db.select({
      topic: chatSessions.topic,
      caseType: chatSessions.caseType,
      count: count(),
    }).from(chatSessions).where(whereClause).groupBy(chatSessions.topic, chatSessions.caseType);

    const topicStats = topicData.map((row) => ({
      topic: row.topic || 'não_classificado',
      caseType: row.caseType || 'geral',
      sessionCount: row.count,
      avgDurationSec: 0, avgMessages: 0, avgSatisfaction: 0,
      suggestionClicks: 0, typedMessages: 0, suggestionRatio: 0,
    }));

    // Calculate values
    const totalVotes = votesResult?.count || 0;
    const upvotes = upvotesResult?.count || 0;
    const suggestionClicks = suggestionResult?.count || 0;
    const typedMessages = typedResult?.count || 0;
    const completedSessions = feedbackResult?.count || 0;
    const redirectedSessions = redirectedResult?.count || 0;
    const skippedSessions = skippedResult?.count || 0;

    await client.end();

    return NextResponse.json({
      totalSessions,
      uniqueUsers: uniqueUsersResult?.count || 0,
      uniqueUsersWithFeedback: completedSessions,
      feedbackCompletionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      withMicroInteractions: withMicroResult?.count || 0,
      withoutMicroInteractions: withoutMicroResult?.count || 0,
      abandonmentRate: totalSessions > 0 ? ((abandonedResult?.count || 0) / totalSessions) * 100 : 0,
      totalMessages: messagesResult?.count || 0,
      avgMessagesPerSession: totalSessions > 0 ? (messagesResult?.count || 0) / totalSessions : 0,
      avgSatisfaction: Number(feedbackResult?.avgSatisfaction) || 0,
      avgConfidence: Number(feedbackResult?.avgConfidence) || 0,
      completedSessions,
      redirectedSessions,
      skippedSessions,
      redirectRate: completedSessions > 0 ? (redirectedSessions / completedSessions) * 100 : 0,
      totalVotes,
      upvotes,
      downvotes: totalVotes - upvotes,
      upvoteRatio: totalVotes > 0 ? (upvotes / totalVotes) * 100 : 0,
      suggestionClicks,
      typedMessages,
      suggestionRatio: (suggestionClicks + typedMessages) > 0 ? (suggestionClicks / (suggestionClicks + typedMessages)) * 100 : 0,
      sessionsPerDay: dailyData,
      dailyBreakdown,
      topicStats,
      sessionDuration: {
        avgMs: Number(durationResult?.avgMs) || 0,
        medianMs: 0,
        avgWithMicroMs: 0,
        avgWithoutMicroMs: 0,
        avgAbandonedMs: 0,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({
      totalSessions: 0, uniqueUsers: 0, uniqueUsersWithFeedback: 0, feedbackCompletionRate: 0,
      withMicroInteractions: 0, withoutMicroInteractions: 0, abandonmentRate: 0,
      totalMessages: 0, avgMessagesPerSession: 0, avgSatisfaction: 0, avgConfidence: 0,
      completedSessions: 0, redirectedSessions: 0, skippedSessions: 0, redirectRate: 0,
      totalVotes: 0, upvotes: 0, downvotes: 0, upvoteRatio: 0,
      suggestionClicks: 0, typedMessages: 0, suggestionRatio: 0,
      sessionsPerDay: [], dailyBreakdown: [], topicStats: [],
      sessionDuration: { avgMs: 0, medianMs: 0, avgWithMicroMs: 0, avgWithoutMicroMs: 0, avgAbandonedMs: 0 },
    }, { status: 200 });
  }
}