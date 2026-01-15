import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions, userInteractions } from "@/lib/db/schema";

export async function POST(request: Request) {
  let client;
  try {
    const body = await request.json();
    const { sessionId, interactionType, content, metadata, topic } = body;

    if (!sessionId || !interactionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);

    // Ensure session exists
    const existing = await db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
    if (existing.length === 0) {
      await db.insert(chatSessions).values({ id: sessionId });
    }

    await db.insert(userInteractions).values({
      sessionId,
      interactionType,
      content: content || null,
      metadata: metadata || null,
      topic: topic || null,
    });

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track interaction error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({ error: "Failed to track interaction", details: String(error) }, { status: 500 });
  }
}
