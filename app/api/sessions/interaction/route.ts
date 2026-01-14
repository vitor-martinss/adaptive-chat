import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions, userInteractions } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: Request) {
  try {
    const { sessionId, message, caseType, trigger } = await request.json();

    if (!sessionId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update topic
    await db.update(chatSessions)
      .set({ topic: caseType, caseType })
      .where(eq(chatSessions.id, sessionId));

    // Track interaction
    await db.insert(userInteractions).values({
      sessionId,
      interactionType: `feedback_trigger_${trigger}`,
      content: message,
      topic: caseType,
      metadata: { trigger, caseType }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session interaction error:", error);
    return NextResponse.json({ error: "Failed to process interaction" }, { status: 500 });
  }
}