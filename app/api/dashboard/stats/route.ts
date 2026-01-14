import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/db/queries-tcc";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const withMicro = searchParams.get("withMicroInteractions");

    const filters: any = {};
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (withMicro !== null) filters.withMicroInteractions = withMicro === "true";

    const stats = await getDashboardStats(filters);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      {
        totalSessions: 0,
        uniqueUsers: 0,
        uniqueUsersWithFeedback: 0,
        feedbackCompletionRate: 0,
        withMicroInteractions: 0,
        withoutMicroInteractions: 0,
        abandonmentRate: 0,
        totalMessages: 0,
        avgMessagesPerSession: 0,
        avgSatisfaction: 0,
        avgConfidence: 0,
        completedSessions: 0,
        redirectedSessions: 0,
        skippedSessions: 0,
        redirectRate: 0,
        totalVotes: 0,
        upvotes: 0,
        downvotes: 0,
        upvoteRatio: 0,
        suggestionClicks: 0,
        typedMessages: 0,
        suggestionRatio: 0,
        sessionsPerDay: [],
        dailyBreakdown: [],
        topicStats: [],
        sessionDuration: {
          avgMs: 0,
          medianMs: 0,
          avgWithMicroMs: 0,
          avgWithoutMicroMs: 0,
          avgAbandonedMs: 0,
        },
      },
      { status: 200 }
    );
  }
}