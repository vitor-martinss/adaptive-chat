"use client";

import { useEffect } from "react";
import { Chat } from "./chat";
import { useFeedbackWarning } from "@/hooks/use-feedback-warning";
import type { VisibilityType } from "./visibility-selector";

export function ChatWithFeedback({ 
  id, 
  initialMessages, 
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume = false
}: {
  id: string;
  initialMessages: any[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume?: boolean;
}) {
  const { setHasGivenFeedback } = useFeedbackWarning();

  useEffect(() => {
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id }),
    }).catch(console.error);
  }, [id]);

  return (
    <Chat
      id={id}
      initialMessages={initialMessages}
      initialChatModel={initialChatModel}
      initialVisibilityType={initialVisibilityType}
      isReadonly={isReadonly}
      autoResume={autoResume}
      onFeedbackGiven={() => setHasGivenFeedback(true)}
    />
  );
}