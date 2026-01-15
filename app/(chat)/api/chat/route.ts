import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
} from "ai";
import { myProvider } from "@/lib/ai/providers";
import { systemPrompt } from "@/lib/ai/prompts";
import { generateUUID } from "@/lib/utils";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import { ChatSDKError } from "@/lib/errors";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatMessages, chatSessions } from "@/lib/db/schema";

export const maxDuration = 60;

type ChatSessionRequest = {
  sessionId?: string;
  message: string;
};

async function saveMessage(sessionId: string, role: "user" | "assistant", content: string) {
  let client;
  try {
    client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);
    
    const existing = await db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.id, sessionId)).limit(1);
    if (existing.length === 0) {
      await db.insert(chatSessions).values({ id: sessionId });
    }
    await db.insert(chatMessages).values({ sessionId, role, content });
    await client.end();
  } catch (e) {
    console.error("Failed to save message:", e);
    if (client) await client.end().catch(() => {});
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { message, sessionId } = json as ChatSessionRequest;
    
    if (!message?.trim()) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    const withMicroInteractions = process.env.NEXT_PUBLIC_WITH_MICRO_INTERACTIONS === "true";

    if (sessionId) {
      saveMessage(sessionId, "user", message);
    }
    
    const messages = [
      {
        role: "user" as const,
        parts: [{ type: "text" as const, text: message }],
      },
    ];

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: myProvider.languageModel("chat-model"),
          system: systemPrompt({
            selectedChatModel: "chat-model",
            requestHints: { latitude: undefined, longitude: undefined, city: undefined, country: undefined },
            withMicroInteractions,
          }),
          messages: convertToModelMessages(messages),
          experimental_transform: smoothStream({ chunking: "word" }),
          onFinish: async ({ text }) => {
            if (sessionId) {
              await saveMessage(sessionId, "assistant", text);
            }
          },
        });

        result.consumeStream();
        dataStream.merge(result.toUIMessageStream());
      },
      generateId: generateUUID,
      onError: () => {
        return "Desculpe, ocorreu um erro. Posso ajudar apenas com assuntos da Gatapreta Sapatilhas.";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    console.error("Error in chat API:", error);
    return new ChatSDKError("offline:chat").toResponse();
  }
}
