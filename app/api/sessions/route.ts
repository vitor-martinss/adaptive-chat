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

    // Upsert to avoid race conditions
    await db.insert(chatSessions).values({
      id: sessionId,
      userId: userId || null,
      withMicroInteractions: withMicroInteractions ?? false,
    }).onConflictDoNothing();

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create session error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({ error: "Failed to create session", details: String(error) }, { status: 500 });
  }
}
