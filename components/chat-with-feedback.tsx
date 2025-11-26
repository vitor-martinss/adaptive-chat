"use client";

import { useEffect, useState } from "react";
import { Chat } from "./chat";
import { DetailedFeedback, useFeedbackTrigger } from "./feedback-system";
import type { VisibilityType } from "./visibility-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const { 
    showDetailed, 
    setShowDetailed, 
    incrementMessage, 
    triggerEndSession 
  } = useFeedbackTrigger(id);

  // Track message additions
  useEffect(() => {
    incrementMessage();
  }, [initialMessages.length]);

  // Trigger feedback on session end (when user is inactive)
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        triggerEndSession();
      }, 300000); // 5 minutes of inactivity
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [triggerEndSession]);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Track user interaction
  useEffect(() => {
    if (initialMessages.length > 2) {
      setHasInteracted(true);
    }
  }, [initialMessages.length]);

  // Show exit confirmation when trying to leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasInteracted) {
        const message = "Tem certeza que deseja sair? Gostaríamos de saber como foi o atendimento.";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const handleUnload = () => {
      if (hasInteracted) {
        setShowExitConfirm(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [hasInteracted]);

  return (
    <>
      <Chat
        id={id}
        initialMessages={initialMessages}
        initialChatModel={initialChatModel}
        initialVisibilityType={initialVisibilityType}
        isReadonly={isReadonly}
        autoResume={autoResume}
      />
      
      <DetailedFeedback
        isOpen={showDetailed}
        onClose={() => setShowDetailed(false)}
        chatId={id}
        trigger="end_session"
      />
      
      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Tem certeza que deseja sair?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gostaríamos de saber como foi o atendimento antes de você sair.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1"
                >
                  Continuar chat
                </Button>
                <Button 
                  onClick={() => {
                    setShowExitConfirm(false);
                    setShowDetailed(true);
                  }}
                  className="flex-1"
                >
                  Avaliar e sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}