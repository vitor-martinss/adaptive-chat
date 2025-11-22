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
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { chatSessions, chatMessages } from "@/lib/db/schema";

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
    
    // Save user message to database
    const client = postgres(process.env.POSTGRES_URL!);
    const db = drizzle(client);
    
    let sessionExists = false;
    try {
      const existingSession = await db.select().from(chatSessions).where(eq(chatSessions.id, currentSessionId)).limit(1);
      sessionExists = existingSession.length > 0;
    } catch (error) {
      console.error('Error checking session:', error);
    }
    
    // Create session if it doesn't exist
    if (!sessionExists) {
      try {
        await db.insert(chatSessions).values({
          id: currentSessionId,
          withMicroInteractions,
          metadata: { userAgent: request.headers.get('user-agent') }
        });
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }
    
    // Save user message
    try {
      await db.insert(chatMessages).values({
        sessionId: currentSessionId,
        role: 'user',
        content: message,
        messageIndex: new Date()
      });
    } catch (error) {
      console.error('Error saving user message:', error);
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
      onFinish: async ({ messages: responseMessages }) => {
        const responseTime = Date.now() - startTime;
        
        // Save assistant message to database
        try {
          const assistantMessage = responseMessages.find(m => m.role === 'assistant');
          if (assistantMessage) {
            const messageText = assistantMessage.parts?.find(p => p.type === 'text')?.text || '';
            
            await db.insert(chatMessages).values({
              sessionId: currentSessionId,
              role: 'assistant',
              content: messageText,
              responseTimeMs: new Date(responseTime),
              model: 'meta/llama-3.1-8b',
              messageIndex: new Date()
            });
            
            console.log(`Assistant message saved for session ${currentSessionId}`);
          }
        } catch (dbError) {
          console.error('Failed to save assistant message:', dbError);
        }
        
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
