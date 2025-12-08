import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  streamText,
} from "ai";
import { myProvider } from "@/lib/ai/providers";
import { regularPrompt } from "@/lib/ai/prompts";
import { generateUUID } from "@/lib/utils";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import { ChatSDKError } from "@/lib/errors";

export const maxDuration = 60;

type ChatSessionRequest = {
  sessionId?: string;
  message: string;
};

type ChatSessionResponse = {
  sessionId: string;
  reply: string;
  withMicroInteractions: boolean;
  responseTimeMs: number;
};

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { message } = json as ChatSessionRequest;
    
    if (!message?.trim()) {
      return new ChatSDKError("bad_request:api").toResponse();
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
          system: regularPrompt,
          messages: convertToModelMessages(messages),
          experimental_transform: smoothStream({ chunking: "word" }),
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

// DELETE method removed - not needed for single session chat
