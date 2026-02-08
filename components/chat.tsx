"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import useSWR from "swr";
import { ChatHeader } from "@/components/chat-header";
import { DetailedFeedback } from "@/components/feedback-system";
import { EndSessionModal } from "@/components/end-session-modal";
import { sessionManager } from "@/lib/session-manager";
import type { CaseType } from "@/lib/case-classification";
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

  // Create session on mount and check if session is expired
  useEffect(() => {
    // Skip if session already ended (user came back)
    if (sessionStorage.getItem(`session_ended_${id}`) === "true") return;
    
    // Check if session is expired (older than 24 hours)
    const checkSessionExpiry = async () => {
      try {
        const response = await fetch(`/api/sessions/check?sessionId=${id}`);
        const data = await response.json();
        
        // Only redirect if session exists AND is expired
        if (data.exists && data.expired) {
          window.location.href = '/';
          return;
        }
      } catch (error) {
        console.error('Failed to check session expiry:', error);
      }
    };
    
    checkSessionExpiry();
    
    let userId = localStorage.getItem('chat_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_user_id', userId);
    }
    
    const withMicroInteractions = process.env.NEXT_PUBLIC_WITH_MICRO_INTERACTIONS === "true";
    
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, userId, withMicroInteractions }),
    }).catch(() => {}); // Silently ignore - session may already exist
  }, [id]);

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
  const [feedbackTrigger, setFeedbackTrigger] = useState<string>("milestone");
  const [currentCaseType, setCurrentCaseType] = useState<CaseType>("geral");
  const [currentTopic, setCurrentTopic] = useState<string | undefined>();
  const [sessionEnded, setSessionEnded] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`session_ended_${id}`) === "true";
    }
    return false;
  });
  const [hasShownFeedback, setHasShownFeedback] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`session_ended_${id}`) === "true";
    }
    return false;
  });
  const [interactionCount, setInteractionCount] = useState(0);
  const idleTimerRef = useRef<NodeJS.Timeout>();

  // Capture abandonment events
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!sessionEnded) {
        navigator.sendBeacon('/api/sessions/abandon', JSON.stringify({ sessionId: id }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !sessionEnded) {
        fetch('/api/sessions/abandon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: id }),
          keepalive: true
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, sessionEnded]);

  // Idle detection - 25s after last message (only if no feedback shown recently)
  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    if (interactionCount >= 1 && !showEndSessionModal && !sessionEnded) {
      idleTimerRef.current = setTimeout(() => {
        setFeedbackTrigger("idle");
        setShowEndSessionModal(true);
        setHasShownFeedback(true);
        fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: id, interactionType: "end_modal_shown_idle" }),
        }).catch(console.error);
      }, 25000); // Increased from 15s to 25s to give users time to read
    }

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [interactionCount, showEndSessionModal, sessionEnded, hasShownFeedback, id]);

  // Milestone check is now handled by sessionManager in handleInteraction
  // This effect is removed - sessionManager.shouldTriggerFeedback handles case-specific milestones

  const handleInteraction = useCallback(async (message?: string) => {
    if (!sessionEnded && message) {
      setInteractionCount(prev => prev + 1);
      
      try {
        const result = await sessionManager.addMessage(id, message);
        setCurrentCaseType(result.caseType);
        setCurrentTopic(result.topic);
        
        // Save topic to database
        fetch("/api/sessions/update-topic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            sessionId: id, 
            topic: result.topic || result.caseType, 
            caseType: result.caseType 
          }),
        }).catch(console.error);
        
        if (result.shouldShowFeedback && !hasShownFeedback) {
          setFeedbackTrigger(result.trigger);
          setHasShownFeedback(true);
          
          // Wait 10 seconds to let user read the response before showing feedback
          setTimeout(() => {
            setShowEndSessionModal(true);
          }, 10000);
          
          await fetch("/api/sessions/interaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              sessionId: id, 
              message,
              caseType: result.caseType,
              trigger: result.trigger
            }),
          });
        }
      } catch (error) {
        console.error('Interaction handling failed:', error);
      }
    }
  }, [id, sessionEnded]);

  const handleSessionSolved = async () => {
    setShowEndSessionModal(false);
    setSessionEnded(true);
    sessionStorage.setItem(`session_ended_${id}`, "true");
    
    await Promise.all([
      fetch("/api/sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, resolved: true }),
      }),
      fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: id, 
          interactionType: "end_modal_answer_yes",
          topic: currentCaseType
        }),
      })
    ]).catch(console.error);
    
    setShowDetailedFeedback(true);
  };

  const handleSessionNotSolved = async () => {
    setShowEndSessionModal(false);
    setInteractionCount(0);
    setHasShownFeedback(false); // Reset to allow feedback again later
    
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
                const textPart = message?.parts?.find(part => part.type === 'text');
                const messageText = textPart && 'text' in textPart ? textPart.text : "";
                handleInteraction(messageText);
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
              topic: currentTopic || currentCaseType,
              metadata: { source: "feedback_flow", caseType: currentCaseType }
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
              topic: currentTopic || currentCaseType,
              metadata: { source: "feedback_flow", caseType: currentCaseType }
            }),
          }).catch(console.error);
          window.location.replace("https://www.gatapretasapatilhas.com.br");
        }}
        chatId={id}
        trigger={feedbackTrigger as "idle" | "milestone" | "end_session" | "exit_intent" | "case_specific"}
        caseType={currentCaseType}
        topic={currentTopic}
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
