import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { chatSessions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET() {
  try {
    const result = await db.execute(sql`
      UPDATE chat_sessions 
      SET ended_at = created_at + INTERVAL '2 minutes',
          updated_at = NOW()
      WHERE ended_at IS NULL
      RETURNING id, created_at, ended_at
    `);

    return NextResponse.json({ 
      success: true, 
      updated: result.length,
      sessions: result 
    });
  } catch (error) {
    console.error("Test end error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
