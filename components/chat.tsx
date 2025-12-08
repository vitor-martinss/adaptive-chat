"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ChatHeader } from "@/components/chat-header";
import { DetailedFeedback } from "@/components/feedback-system";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
type Vote = { messageId: string; isUpvoted: boolean };
import { fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  onFeedbackGiven,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  onFeedbackGiven?: () => void;
}) {
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const textPart = lastMessage?.parts?.find(part => part.type === 'text');
        return {
          body: {
            message: textPart && 'text' in textPart ? textPart.text : "",
            sessionId: id,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      
      // Check if AI suggests showing feedback
      if (!hasShownFeedback && dataPart.type === 'data-textDelta' && 'textDelta' in dataPart && typeof dataPart.textDelta === 'string') {
        const text = dataPart.textDelta.toLowerCase();
        const endPhrases = ['posso ajudar', 'mais alguma', 'algo mais', 'ficou claro', 'consegui ajudar'];
        if (messages.length >= 3 && endPhrases.some(phrase => text.includes(phrase))) {
          setTimeout(() => {
            setFeedbackTrigger("end_session");
            setShowDetailedFeedback(true);
            setHasShownFeedback(true);
          }, 1000);
        }
      }
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [feedbackTrigger, setFeedbackTrigger] = useState<"milestone" | "idle" | "end_session">("milestone");
  const [hasShownFeedback, setHasShownFeedback] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const lastMessageCountRef = useRef(0);

  // Idle detection - 15s inactivity
  useEffect(() => {
    const resetIdle = () => {
      lastActivityRef.current = Date.now();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      
      if (messages.length >= 3 && !showDetailedFeedback && !hasShownFeedback) {
        idleTimerRef.current = setTimeout(() => {
          setFeedbackTrigger("idle");
          setShowDetailedFeedback(true);
          setHasShownFeedback(true);
        }, 10000);
      }
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('click', resetIdle);
    resetIdle();

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('click', resetIdle);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [messages.length, showDetailedFeedback, hasShownFeedback]);

  // Reset feedback flag when user continues chatting after feedback
  useEffect(() => {
    if (hasShownFeedback && messages.length > lastMessageCountRef.current + 4) {
      setHasShownFeedback(false);
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, hasShownFeedback]);

  // Load votes
  const { data: votes } = useSWR<Vote[]>(
    `/api/vote?chatId=${id}`,
    (url) => fetch(url).then((res) => {
      if (!res.ok) return [];
      return res.json().then(data => Array.isArray(data) ? data : []);
    }),
    { fallbackData: [] }
  );

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader />

        <Messages
          chatId={id}
          isArtifactVisible={false}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          sendMessage={sendMessage}
          setMessages={setMessages}
          status={status}
          votes={votes}
          onFeedbackGiven={onFeedbackGiven}
        />

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={initialVisibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
            />
          )}
        </div>
      </div>

      {/* Artifact component removed for simplified chat */}

      <DetailedFeedback
        isOpen={showDetailedFeedback}
        onClose={() => {
          setShowDetailedFeedback(false);
          onFeedbackGiven?.();
        }}
        chatId={id}
        trigger={feedbackTrigger}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
