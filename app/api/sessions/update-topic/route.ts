import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions } from "@/lib/db/schema";

export async function POST(request: Request) {
  let client;
  try {
    const { sessionId, topic, caseType } = await request.json();

    if (!sessionId || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);

    await db.update(chatSessions)
      .set({ topic, caseType: caseType || topic })
      .where(eq(chatSessions.id, sessionId));

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update session topic error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({ error: "Failed to update session topic" }, { status: 500 });
  }
}