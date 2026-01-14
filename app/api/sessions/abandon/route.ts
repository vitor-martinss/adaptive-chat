import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db/transaction";
import { chatSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    await withTransaction(async (tx) => {
      await tx.update(chatSessions)
        .set({ 
          abandoned: true, 
          endedAt: new Date() 
        })
        .where(eq(chatSessions.id, sessionId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Abandon session error:", error);
    return NextResponse.json({ error: "Failed to mark as abandoned" }, { status: 500 });
  }
}