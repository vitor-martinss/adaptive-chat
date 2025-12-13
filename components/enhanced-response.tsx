"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Response } from "./elements/response";
import { enhanceWithEmojis } from "@/lib/ai/emoji-enhancer";

interface EnhancedResponseProps {
  children: string;
  isStreaming?: boolean;
  withMicroInteractions?: boolean;
  className?: string;
}

export const EnhancedResponse = ({ 
  children, 
  isStreaming = false, 
  withMicroInteractions = false,
  className = ""
}: EnhancedResponseProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const enhancedChildren = enhanceWithEmojis(children, withMicroInteractions);
    
    if (!withMicroInteractions || !isStreaming) {
      setDisplayedText(enhancedChildren);
      return;
    }

    if (currentIndex < enhancedChildren.length) {
      const timer = setTimeout(() => {
        setDisplayedText(enhancedChildren.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20); // Typing speed

      return () => clearTimeout(timer);
    }
  }, [children, currentIndex, isStreaming, withMicroInteractions]);

  useEffect(() => {
    if (isStreaming) {
      setCurrentIndex(0);
      setDisplayedText("");
    }
  }, [isStreaming]);

  if (!withMicroInteractions) {
    return <Response className={className}>{children}</Response>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={className}>
        <Response>{displayedText}</Response>
        {isStreaming && currentIndex < enhanceWithEmojis(children, withMicroInteractions).length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-5 bg-current ml-1"
          />
        )}
      </div>
    </motion.div>
  );
};