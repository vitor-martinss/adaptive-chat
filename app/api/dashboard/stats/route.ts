import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { count, avg, eq } from "drizzle-orm";
import { chatSessions, chatMessages, chatFeedback, vote } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET() {
  try {
    // Total sessions
    const [totalSessionsResult] = await db
      .select({ count: count() })
      .from(chatSessions);

    // Sessions with/without micro-interactions
    const [withMicroResult] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(eq(chatSessions.withMicroInteractions, true));

    const [withoutMicroResult] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(eq(chatSessions.withMicroInteractions, false));

    // Abandoned sessions
    const [abandonedResult] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(eq(chatSessions.abandoned, true));

    // Average satisfaction from feedback
    const [avgSatisfactionResult] = await db
      .select({ avg: avg(chatFeedback.satisfaction) })
      .from(chatFeedback);

    // Average confidence from feedback
    const [avgConfidenceResult] = await db
      .select({ avg: avg(chatFeedback.confidence) })
      .from(chatFeedback);

    // Total messages
    const [totalMessagesResult] = await db
      .select({ count: count() })
      .from(chatMessages);

    // Vote statistics
    const [totalVotesResult] = await db
      .select({ count: count() })
      .from(vote);

    const [positiveVotesResult] = await db
      .select({ count: count() })
      .from(vote)
      .where(eq(vote.isUpvoted, true));

    const totalSessions = totalSessionsResult?.count || 0;
    const abandonedSessions = abandonedResult?.count || 0;
    const abandonmentRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0;

    return NextResponse.json({
      totalSessions,
      abandonmentRate,
      avgSatisfaction: parseFloat(avgSatisfactionResult?.avg || "0"),
      avgConfidence: parseFloat(avgConfidenceResult?.avg || "0"),
      withMicroInteractions: withMicroResult?.count || 0,
      withoutMicroInteractions: withoutMicroResult?.count || 0,
      totalMessages: totalMessagesResult?.count || 0,
      totalVotes: totalVotesResult?.count || 0,
      positiveVotes: positiveVotesResult?.count || 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}