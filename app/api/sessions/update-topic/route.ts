import { NextResponse } from "next/server";
import { updateSessionTopic } from "@/lib/db/queries-tcc";

export async function POST(request: Request) {
  try {
    const { sessionId, topic, caseType } = await request.json();

    if (!sessionId || !topic) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await updateSessionTopic(sessionId, topic, caseType || topic);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update session topic error:", error);
    return NextResponse.json(
      { error: "Failed to update session topic" },
      { status: 500 }
    );
  }
}