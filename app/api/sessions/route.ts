import { NextResponse } from "next/server";
import { ensureSessionExists } from "@/lib/db/queries-tcc";

export async function POST(request: Request) {
  try {
    const { sessionId, userId, withMicroInteractions } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    await ensureSessionExists(sessionId, userId, withMicroInteractions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
