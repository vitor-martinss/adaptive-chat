import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions } from "@/lib/db/schema";

export async function POST(request: Request) {
  let client;
  try {
    const body = await request.json();
    const { sessionId, userId, withMicroInteractions } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);

    // Check if exists first
    const existing = await db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
    
    if (existing.length === 0) {
      await db.insert(chatSessions).values({
        id: sessionId,
        userId: userId || null,
        withMicroInteractions: withMicroInteractions ?? false,
      });
    }

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create session error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({ error: "Failed to create session", details: String(error) }, { status: 500 });
  }
}
