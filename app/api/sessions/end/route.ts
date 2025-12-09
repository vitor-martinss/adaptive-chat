import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { chatSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(request: Request) {
  try {
    const { sessionId, abandoned } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    const result = await db
      .update(chatSessions)
      .set({
        endedAt: new Date(),
        abandoned: abandoned ?? false,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, sessionId))
      .returning();

    console.log(`Session ${sessionId} ended. Abandoned: ${abandoned}. Updated: ${result.length}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
