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
  const startTime = Date.now();
  
  try {
    const json = await request.json();
    const { message, sessionId } = json as ChatSessionRequest;
    
    if (!message?.trim()) {
      return new ChatSDKError("bad_request:api").toResponse();
    }

    // Get micro-interactions flag from environment
    const withMicroInteractions = process.env.WITH_MICRO_INTERACTIONS === 'true';
    
    // Create or get session ID
    const currentSessionId = sessionId || generateUUID();
    
    // TODO: Save user message to database
    // TODO: Build message history from database
    
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
      onFinish: async ({ messages: responseMessages }) => {
        const responseTime = Date.now() - startTime;
        
        // TODO: Save assistant message to database
        // TODO: Save response metrics
        
        console.log(`Response generated in ${responseTime}ms for session ${currentSessionId}`);
      },
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
