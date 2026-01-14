import { NextResponse } from "next/server";
import { trackUserInteraction, updateSessionTopic } from "@/lib/db/queries-tcc";

export async function POST(request: Request) {
  try {
    const { sessionId, message, caseType, trigger } = await request.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Single transaction for all updates
    await Promise.all([
      updateSessionTopic(sessionId, caseType, caseType),
      trackUserInteraction({
        sessionId,
        interactionType: `feedback_trigger_${trigger}`,
        content: message,
        topic: caseType,
        metadata: { trigger, caseType }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session interaction error:", error);
    return NextResponse.json(
      { error: "Failed to process interaction" },
      { status: 500 }
    );
  }
}