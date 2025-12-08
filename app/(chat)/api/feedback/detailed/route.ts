import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatFeedback, chatSessions } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, sessionId, satisfaction, confidence, comment } = body;
    const id = sessionId || chatId;

    if (!id || !satisfaction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure session exists
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
    if (!session) {
      await db.insert(chatSessions).values({ id });
    }

    await db.insert(chatFeedback).values({
      sessionId: id,
      satisfaction: satisfaction.toString(),
      confidence: confidence?.toString() || "5",
      comment: comment || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}