import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import { chatFeedback, chatSessions } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: NextRequest) {
  try {
    const { chatId, satisfaction, aspects, comment, trigger } = await request.json();

    if (!chatId || !satisfaction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if session exists, create if not
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, chatId));
    
    if (!session) {
      await db.execute(sql`
        INSERT INTO chat_sessions (id, created_at, updated_at, abandoned, with_micro_interactions)
        VALUES (${chatId}, NOW(), NOW(), false, false)
      `);
    }

    await db.execute(sql`
      INSERT INTO chat_feedback (id, session_id, created_at, satisfaction, confidence, comment)
      VALUES (gen_random_uuid(), ${chatId}, NOW(), ${satisfaction.toString()}, ${'5'}, ${comment || null})
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Detailed feedback error:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}