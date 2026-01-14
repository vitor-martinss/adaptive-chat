"use client";

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