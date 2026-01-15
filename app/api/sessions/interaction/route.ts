import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions, userInteractions } from "@/lib/db/schema";

export async function POST(request: Request) {
  let client;
  try {
    const { sessionId, message, caseType, trigger } = await request.json();

    if (!sessionId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);

    // Update topic
    await db.update(chatSessions)
      .set({ topic: caseType || null, caseType: caseType || null })
      .where(eq(chatSessions.id, sessionId));

    // Track interaction
    await db.insert(userInteractions).values({
      sessionId,
      interactionType: `feedback_trigger_${trigger}`,
      content: message,
      topic: caseType || null,
      metadata: { trigger, caseType }
    });

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session interaction error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({ error: "Failed to process interaction" }, { status: 500 });
  }
}