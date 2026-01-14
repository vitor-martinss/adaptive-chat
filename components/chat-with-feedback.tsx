"use client";

import { useEffect } from "react";
import { Chat } from "./chat";
import { ChatErrorBoundary } from "./chat-error-boundary";
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

  useEffect(() => {
    // Generate or get existing user ID
    let userId = localStorage.getItem('chat_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_user_id', userId);
    }
    
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, userId }),
    }).catch(console.error);
  }, [id]);

  return (
    <ChatErrorBoundary>
      <Chat
        id={id}
        initialMessages={initialMessages}
        initialChatModel={initialChatModel}
        initialVisibilityType={initialVisibilityType}
        isReadonly={isReadonly}
        autoResume={autoResume}
      />
    </ChatErrorBoundary>
  );
}