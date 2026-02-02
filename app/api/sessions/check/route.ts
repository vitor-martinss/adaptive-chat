import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions } from "@/lib/db/schema";

export async function GET(request: Request) {
  let client;
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    await client.end();

    if (!session) {
      return NextResponse.json({ expired: false, exists: false });
    }

    // Check if session is older than 24 hours
    const sessionAge = Date.now() - session.createdAt.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const expired = sessionAge > twentyFourHours;

    return NextResponse.json({ expired, exists: true, createdAt: session.createdAt });
  } catch (error) {
    console.error("Check session error:", error);
    if (client) await client.end().catch(() => {});
    return NextResponse.json({ error: "Failed to check session" }, { status: 500 });
  }
}
