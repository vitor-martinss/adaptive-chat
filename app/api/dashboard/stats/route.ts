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

    // Messages - JOIN with chatSessions to respect date filters
    const [messagesResult] = await db.select({ count: count() })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(whereClause);

    // Feedback - JOIN with chatSessions to respect date filters
    const [feedbackResult] = await db.select({
      avgSatisfaction: avg(sql`${chatFeedback.satisfaction}::integer`),
      avgConfidence: avg(sql`${chatFeedback.confidence}::integer`),
      count: count(),
    })
    .from(chatFeedback)
    .innerJoin(chatSessions, eq(chatFeedback.sessionId, chatSessions.id))
    .where(whereClause);

    // Votes - JOIN with chatSessions to respect date filters
    const [votesResult] = await db.select({ count: count() })
      .from(chatVotes)
      .innerJoin(chatSessions, eq(chatVotes.chatId, chatSessions.id))
      .where(whereClause);
    
    const [upvotesResult] = await db.select({ count: count() })
      .from(chatVotes)
      .innerJoin(chatSessions, eq(chatVotes.chatId, chatSessions.id))
      .where(whereClause ? and(whereClause, eq(chatVotes.isUpvoted, true)) : eq(chatVotes.isUpvoted, true));

    // Interactions - JOIN with chatSessions to respect date filters
    const [suggestionResult] = await db.select({ count: count() })
      .from(userInteractions)
      .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
      .where(whereClause ? and(whereClause, eq(userInteractions.interactionType, "suggestion_click")) : eq(userInteractions.interactionType, "suggestion_click"));
    
    const [typedResult] = await db.select({ count: count() })
      .from(userInteractions)
      .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
      .where(whereClause ? and(whereClause, eq(userInteractions.interactionType, "typed_message")) : eq(userInteractions.interactionType, "typed_message"));

    // Interactions for redirected/skipped sessions - JOIN with chatSessions
    const [redirectedResult] = await db.select({ count: count() })
      .from(userInteractions)
      .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
      .where(whereClause ? and(whereClause, eq(userInteractions.interactionType, "post_feedback_redirect")) : eq(userInteractions.interactionType, "post_feedback_redirect"));
    
    const [skippedResult] = await db.select({ count: count() })
      .from(userInteractions)
      .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
      .where(whereClause ? and(whereClause, eq(userInteractions.interactionType, "feedback_skipped")) : eq(userInteractions.interactionType, "feedback_skipped"));

    // Resolved sessions
    const [resolvedResult] = await db.select({ count: count() }).from(chatSessions)
      .where(whereClause ? and(whereClause, eq(chatSessions.resolved, true)) : eq(chatSessions.resolved, true));

    // Unique users
    const [uniqueUsersResult] = await db.select({ count: sql<number>`COUNT(DISTINCT user_id)` }).from(chatSessions).where(whereClause);

    // Duration - only for completed sessions (with ended_at)
    const [durationResult] = await db.select({
      avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)`,
    }).from(chatSessions).where(
      whereClause 
        ? and(whereClause, sql`ended_at IS NOT NULL`)
        : sql`ended_at IS NOT NULL`
    );

    // Duration by micro-interactions (only completed)
    const [durationWithMicroResult] = await db.select({
      avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)`,
    }).from(chatSessions).where(
      whereClause 
        ? and(whereClause, eq(chatSessions.withMicroInteractions, true), sql`ended_at IS NOT NULL`)
        : and(eq(chatSessions.withMicroInteractions, true), sql`ended_at IS NOT NULL`)
    );

    const [durationWithoutMicroResult] = await db.select({
      avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)`,
    }).from(chatSessions).where(
      whereClause 
        ? and(whereClause, eq(chatSessions.withMicroInteractions, false), sql`ended_at IS NOT NULL`)
        : and(eq(chatSessions.withMicroInteractions, false), sql`ended_at IS NOT NULL`)
    );

    const [durationAbandonedResult] = await db.select({
      avgMs: sql<number>`AVG(EXTRACT(EPOCH FROM (ended_at - created_at)) * 1000)`,
    }).from(chatSessions).where(
      whereClause
        ? and(whereClause, eq(chatSessions.abandoned, true), sql`ended_at IS NOT NULL`)
        : and(eq(chatSessions.abandoned, true), sql`ended_at IS NOT NULL`)
    );

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

    // Calculate detailed daily breakdown
    const dailyBreakdown = await Promise.all(
      Array.from(dailyMap.entries()).map(async ([date, data]) => {
        const dateFilter = whereClause
          ? and(whereClause, sql`DATE(${chatSessions.createdAt}) = ${date}`)
          : sql`DATE(${chatSessions.createdAt}) = ${date}`;

        // Messages for this day
        const [dayMessages] = await db.select({ 
          count: count(),
          avgPerSession: sql<number>`CAST(COUNT(*) AS FLOAT) / NULLIF(COUNT(DISTINCT ${chatMessages.sessionId}), 0)`
        })
          .from(chatMessages)
          .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
          .where(dateFilter);

        // Duration for this day
        const [dayDuration] = await db.select({
          avgSec: sql<number>`AVG(EXTRACT(EPOCH FROM (${chatSessions.endedAt} - ${chatSessions.createdAt})))`
        })
          .from(chatSessions)
          .where(dateFilter ? and(dateFilter, sql`${chatSessions.endedAt} IS NOT NULL`) : sql`${chatSessions.endedAt} IS NOT NULL`);

        // Votes for this day
        const [dayVotes] = await db.select({ count: count() })
          .from(chatVotes)
          .innerJoin(chatSessions, eq(chatVotes.chatId, chatSessions.id))
          .where(dateFilter);

        const [dayUpvotes] = await db.select({ count: count() })
          .from(chatVotes)
          .innerJoin(chatSessions, eq(chatVotes.chatId, chatSessions.id))
          .where(dateFilter ? and(dateFilter, eq(chatVotes.isUpvoted, true)) : eq(chatVotes.isUpvoted, true));

        // Interactions for this day
        const [daySuggestions] = await db.select({ count: count() })
          .from(userInteractions)
          .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
          .where(dateFilter ? and(dateFilter, eq(userInteractions.interactionType, "suggestion_click")) : eq(userInteractions.interactionType, "suggestion_click"));

        const [dayTyped] = await db.select({ count: count() })
          .from(userInteractions)
          .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
          .where(dateFilter ? and(dateFilter, eq(userInteractions.interactionType, "typed_message")) : eq(userInteractions.interactionType, "typed_message"));

        // Feedback for this day
        const [dayFeedback] = await db.select({
          avgSatisfaction: avg(sql`${chatFeedback.satisfaction}::integer`)
        })
          .from(chatFeedback)
          .innerJoin(chatSessions, eq(chatFeedback.sessionId, chatSessions.id))
          .where(dateFilter);

        const totalVotes = dayVotes?.count || 0;
        const upvotes = dayUpvotes?.count || 0;
        const suggestions = daySuggestions?.count || 0;
        const typed = dayTyped?.count || 0;

        return {
          date,
          sessionsWith: data.sessionsWith,
          sessionsWithout: data.sessionsWithout,
          totalSessions: data.sessionsWith + data.sessionsWithout,
          totalMessages: dayMessages?.count || 0,
          avgMessagesPerSession: Number(dayMessages?.avgPerSession) || 0,
          avgSessionDurationSec: Number(dayDuration?.avgSec) || 0,
          upvoteRatio: totalVotes > 0 ? upvotes / totalVotes : 0,
          suggestionRatio: (suggestions + typed) > 0 ? suggestions / (suggestions + typed) : 0,
          avgSatisfaction: Number(dayFeedback?.avgSatisfaction) || 0,
          avgConfidence: 0,
        };
      })
    );

    // Topic stats with calculations
    const topicData = await db.select({
      topic: chatSessions.topic,
      caseType: chatSessions.caseType,
      count: count(),
      avgDurationMs: sql<number>`AVG(EXTRACT(EPOCH FROM (${chatSessions.endedAt} - ${chatSessions.createdAt})) * 1000)`,
    }).from(chatSessions).where(
      whereClause 
        ? and(whereClause, sql`${chatSessions.endedAt} IS NOT NULL`)
        : sql`${chatSessions.endedAt} IS NOT NULL`
    ).groupBy(chatSessions.topic, chatSessions.caseType);

    // Calculate detailed stats for each topic
    const topicStats = await Promise.all(topicData.map(async (row) => {
      const topicFilter = whereClause 
        ? and(whereClause, eq(chatSessions.topic, row.topic || ''))
        : eq(chatSessions.topic, row.topic || '');

      // Messages per topic
      const [topicMessages] = await db.select({ 
        count: count(),
        avgPerSession: sql<number>`CAST(COUNT(*) AS FLOAT) / NULLIF(COUNT(DISTINCT ${chatMessages.sessionId}), 0)`
      })
        .from(chatMessages)
        .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
        .where(topicFilter);

      // Satisfaction per topic
      const [topicFeedback] = await db.select({
        avgSatisfaction: avg(sql`${chatFeedback.satisfaction}::integer`)
      })
        .from(chatFeedback)
        .innerJoin(chatSessions, eq(chatFeedback.sessionId, chatSessions.id))
        .where(topicFilter);

      // Interactions per topic
      const [topicSuggestions] = await db.select({ count: count() })
        .from(userInteractions)
        .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
        .where(topicFilter ? and(topicFilter, eq(userInteractions.interactionType, "suggestion_click")) : eq(userInteractions.interactionType, "suggestion_click"));

      const [topicTyped] = await db.select({ count: count() })
        .from(userInteractions)
        .innerJoin(chatSessions, eq(userInteractions.sessionId, chatSessions.id))
        .where(topicFilter ? and(topicFilter, eq(userInteractions.interactionType, "typed_message")) : eq(userInteractions.interactionType, "typed_message"));

      const suggestionClicks = topicSuggestions?.count || 0;
      const typedMessages = topicTyped?.count || 0;

      return {
        topic: row.topic || 'não_classificado',
        caseType: row.caseType || 'geral',
        sessionCount: row.count,
        avgDurationSec: Math.floor((Number(row.avgDurationMs) || 0) / 1000),
        avgMessages: Number(topicMessages?.avgPerSession) || 0,
        avgSatisfaction: Number(topicFeedback?.avgSatisfaction) || 0,
        suggestionClicks,
        typedMessages,
        suggestionRatio: (suggestionClicks + typedMessages) > 0 
          ? (suggestionClicks / (suggestionClicks + typedMessages)) * 100 
          : 0,
      };
    }));

    // Calculate values
    const totalVotes = votesResult?.count || 0;
    const upvotes = upvotesResult?.count || 0;
    const suggestionClicks = suggestionResult?.count || 0;
    const typedMessages = typedResult?.count || 0;
    const completedSessions = feedbackResult?.count || 0;
    const redirectedSessions = redirectedResult?.count || 0;
    const skippedSessions = skippedResult?.count || 0;
    const resolvedSessions = resolvedResult?.count || 0;

    await client.end();

    return NextResponse.json({
      totalSessions,
      uniqueUsers: uniqueUsersResult?.count || 0,
      uniqueUsersWithFeedback: completedSessions,
      feedbackCompletionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      withMicroInteractions: withMicroResult?.count || 0,
      withoutMicroInteractions: withoutMicroResult?.count || 0,
      abandonmentRate: totalSessions > 0 ? ((abandonedResult?.count || 0) / totalSessions) * 100 : 0,
      resolvedSessions,
      resolutionRate: completedSessions > 0 ? (resolvedSessions / completedSessions) * 100 : 0,
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
        avgWithMicroMs: Number(durationWithMicroResult?.avgMs) || 0,
        avgWithoutMicroMs: Number(durationWithoutMicroResult?.avgMs) || 0,
        avgAbandonedMs: Number(durationAbandonedResult?.avgMs) || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({
      totalSessions: 0, uniqueUsers: 0, uniqueUsersWithFeedback: 0, feedbackCompletionRate: 0,
      withMicroInteractions: 0, withoutMicroInteractions: 0, abandonmentRate: 0,
      resolvedSessions: 0, resolutionRate: 0,
      totalMessages: 0, avgMessagesPerSession: 0, avgSatisfaction: 0, avgConfidence: 0,
      completedSessions: 0, redirectedSessions: 0, skippedSessions: 0, redirectRate: 0,
      totalVotes: 0, upvotes: 0, downvotes: 0, upvoteRatio: 0,
      suggestionClicks: 0, typedMessages: 0, suggestionRatio: 0,
      sessionsPerDay: [], dailyBreakdown: [], topicStats: [],
      sessionDuration: { avgMs: 0, medianMs: 0, avgWithMicroMs: 0, avgWithoutMicroMs: 0, avgAbandonedMs: 0 },
    }, { status: 200 });
  }
}