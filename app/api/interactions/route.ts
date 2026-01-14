import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions, userInteractions } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: Request) {
  try {
    const { sessionId, interactionType, content, metadata, topic } = await request.json();

    if (!sessionId || !interactionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure session exists
    const [existing] = await db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
    if (!existing) {
      await db.insert(chatSessions).values({ id: sessionId });
    }

    await db.insert(userInteractions).values({
      sessionId,
      interactionType,
      content,
      metadata,
      topic,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track interaction error:", error);
    return NextResponse.json({ error: "Failed to track interaction" }, { status: 500 });
  }
}
