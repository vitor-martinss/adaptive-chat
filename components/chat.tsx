"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ChatHeader } from "@/components/chat-header";
import { DetailedFeedback } from "@/components/feedback-system";
import { EndSessionModal } from "@/components/end-session-modal";
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
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [feedbackTrigger, setFeedbackTrigger] = useState<"milestone" | "idle" | "end_session">("milestone");
  const [hasShownFeedback, setHasShownFeedback] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const lastMessageCountRef = useRef(0);

  // Redirect if session was already ended
  useEffect(() => {
    const wasEnded = sessionStorage.getItem(`session_ended_${id}`);
    if (wasEnded === "true") {
      window.location.replace("/");
    }
  }, [id]);

  // Idle detection - 15s inactivity
  useEffect(() => {
    const resetIdle = () => {
      lastActivityRef.current = Date.now();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      
      if (interactionCount >= 1 && !showEndSessionModal && !sessionEnded) {
        idleTimerRef.current = setTimeout(() => {
          setFeedbackTrigger("idle");
          setShowEndSessionModal(true);
          fetch("/api/interactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: id, interactionType: "end_modal_shown" }),
          }).catch(console.error);
        }, 15000);
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
  }, [interactionCount, showEndSessionModal, sessionEnded, id]);

  // Check interaction count for end-session modal (wait for AI response)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isAIResponding = status === "streaming";
    
    if (interactionCount > 0 && interactionCount % 4 === 0 && !showEndSessionModal && !sessionEnded && !isAIResponding && lastMessage?.role === "assistant") {
      setShowEndSessionModal(true);
      fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, interactionType: "end_modal_shown" }),
      }).catch(console.error);
    }
  }, [interactionCount, showEndSessionModal, sessionEnded, id, messages, status]);

  const handleInteraction = () => {
    if (!sessionEnded) {
      setInteractionCount(prev => prev + 1);
    }
  };

  const handleSessionSolved = async () => {
    setShowEndSessionModal(false);
    setSessionEnded(true);
    sessionStorage.setItem(`session_ended_${id}`, "true");
    
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, interactionType: "end_modal_answer_yes" }),
    }).catch(console.error);
    
    setShowDetailedFeedback(true);
  };

  const handleSessionNotSolved = async () => {
    setShowEndSessionModal(false);
    setInteractionCount(0);
    
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, interactionType: "end_modal_answer_no" }),
    }).catch(console.error);
  };



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
          onInteraction={handleInteraction}
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
              sendMessage={(message) => {
                handleInteraction();
                return sendMessage(message);
              }}
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

      <EndSessionModal
        isOpen={showEndSessionModal}
        onSolved={handleSessionSolved}
        onNotSolved={handleSessionNotSolved}
      />

      <DetailedFeedback
        isOpen={showDetailedFeedback}
        onClose={() => {
          setShowDetailedFeedback(false);
          onFeedbackGiven?.();
        }}
        onSkip={async () => {
          sessionStorage.setItem(`session_ended_${id}`, "true");
          await fetch("/api/interactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              sessionId: id, 
              interactionType: "feedback_skipped",
              content: "user_skipped_feedback",
              metadata: { source: "feedback_flow" }
            }),
          }).catch(console.error);
          window.location.replace("https://www.gatapretasapatilhas.com.br");
        }}
        onSubmitSuccess={async () => {
          await fetch("/api/interactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              sessionId: id, 
              interactionType: "post_feedback_redirect",
              content: "auto_redirect_after_feedback",
              metadata: { source: "feedback_flow" }
            }),
          }).catch(console.error);
          window.location.replace("https://www.gatapretasapatilhas.com.br");
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
