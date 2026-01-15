import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatFeedback, chatSessions } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  let client;
  try {
    const body = await request.json();
    const { chatId, sessionId, satisfaction, confidence, comment } = body;
    const id = sessionId || chatId;

    if (!id || !satisfaction) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);

    // Ensure session exists
    const existing = await db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
    if (existing.length === 0) {
      await db.insert(chatSessions).values({ id });
    }

    await db.insert(chatFeedback).values({
      sessionId: id,
      satisfaction: satisfaction.toString(),
      confidence: confidence?.toString() || "5",
      comment: comment || null,
    });

    await db.update(chatSessions)
      .set({ endedAt: new Date(), abandoned: false, updatedAt: new Date() })
      .where(eq(chatSessions.id, id));

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}