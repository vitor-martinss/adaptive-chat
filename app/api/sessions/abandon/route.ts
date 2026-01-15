import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions } from "@/lib/db/schema";

export async function POST(request: Request) {
  let client;
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);

    await db.update(chatSessions)
      .set({ abandoned: true, endedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Abandon session error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({ error: "Failed to mark as abandoned" }, { status: 500 });
  }
}