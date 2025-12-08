import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import { chatVotes, chatMessages } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function PATCH(request: NextRequest) {
  try {
    const { chatId, messageId, type } = await request.json();

    if (!chatId || !messageId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [existingVote] = await db
      .select()
      .from(chatVotes)
      .where(and(eq(chatVotes.messageId, messageId), eq(chatVotes.chatId, chatId)));

    if (existingVote) {
      await db
        .update(chatVotes)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(chatVotes.messageId, messageId), eq(chatVotes.chatId, chatId)));
    } else {
      await db.insert(chatVotes).values({
        chatId,
        messageId,
        isUpvoted: type === "up",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to save vote" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Missing chatId" },
        { status: 400 }
      );
    }

    const votes = await db.select().from(chatVotes).where(eq(chatVotes.chatId, chatId));
    return NextResponse.json(Array.isArray(votes) ? votes : []);
  } catch (error) {
    console.error("Get votes error:", error);
    return NextResponse.json(
      { error: "Failed to get votes" },
      { status: 500 }
    );
  }
}