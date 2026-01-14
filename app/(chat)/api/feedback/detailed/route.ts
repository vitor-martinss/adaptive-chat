import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatFeedback, chatSessions } from "@/lib/db/schema";
import { ensureSessionExists } from "@/lib/db/queries-tcc";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, sessionId, satisfaction, confidence, comment } = body;
    const id = sessionId || chatId;

    if (!id || !satisfaction) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await ensureSessionExists(id);

    await db.insert(chatFeedback).values({
      sessionId: id,
      satisfaction: satisfaction.toString(),
      confidence: confidence?.toString() || "5",
      comment: comment || null,
    });

    await db.update(chatSessions)
      .set({ endedAt: new Date(), abandoned: false, updatedAt: new Date() })
      .where(eq(chatSessions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}