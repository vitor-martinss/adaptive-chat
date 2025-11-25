"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo, useState, useEffect } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  suggestions?: string[];
  messagesLength?: number;
};

function PureSuggestedActions({ chatId, sendMessage, suggestions, messagesLength }: SuggestedActionsProps) {
  const [isHidden, setIsHidden] = useState(false);
  const [lastMessagesLength, setLastMessagesLength] = useState(messagesLength || 0);
  
  // Hide suggestions when new message is added
  useEffect(() => {
    if (messagesLength && messagesLength > lastMessagesLength) {
      setIsHidden(true);
    }
    setLastMessagesLength(messagesLength || 0);
  }, [messagesLength, lastMessagesLength]);
  
  const defaultSuggestions = [
    "Vende no atacado?",
    "Posso comprar com CPF?",
    "Qual a quantidade mínima?",
    "Onde eu vejo os preços?",
  ];
  
  const suggestedActions = suggestions && suggestions.length > 0 ? suggestions : defaultSuggestions;
  
  if (isHidden) return null;

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              setIsHidden(true);
              window.history.replaceState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (JSON.stringify(prevProps.suggestions) !== JSON.stringify(nextProps.suggestions)) {
      return false;
    }
    if (prevProps.messagesLength !== nextProps.messagesLength) {
      return false;
    }

    return true;
  }
);
