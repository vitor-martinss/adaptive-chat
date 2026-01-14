import { NextResponse } from "next/server";
import { trackUserInteraction } from "@/lib/db/queries-tcc";

export async function POST(request: Request) {
  try {
    const { sessionId, interactionType, content, metadata, topic } = await request.json();

    if (!sessionId || !interactionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await trackUserInteraction({
      sessionId,
      interactionType,
      content,
      metadata: metadata || undefined,
      topic,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track interaction error:", error);
    return NextResponse.json(
      { error: "Failed to track interaction" },
      { status: 500 }
    );
  }
}
