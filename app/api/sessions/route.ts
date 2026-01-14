import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: Request) {
  try {
    const { sessionId, userId, withMicroInteractions } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Check if exists first
    const [existing] = await db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
    
    if (!existing) {
      await db.insert(chatSessions).values({
        id: sessionId,
        userId,
        withMicroInteractions: withMicroInteractions ?? false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
