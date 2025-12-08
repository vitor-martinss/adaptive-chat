"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Simple feedback text
export function FeedbackText() {
  return (
    <div className="text-xs text-muted-foreground mt-1">
      Gostou da resposta?
    </div>
  );
}

// Detailed feedback modal
export function DetailedFeedback({ 
  isOpen, 
  onClose, 
  chatId, 
  trigger 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  chatId: string;
  trigger: "end_session" | "milestone" | "exit_intent" | "idle";
}) {
  const [satisfaction, setSatisfaction] = useState<number>(0);
  const [aspects, setAspects] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const satisfactionLabels = ["Ruim", "Regular", "Bom", "Muito Bom", "Excelente"];
  const aspectOptions = [
    "Precisão da resposta",
    "Velocidade da resposta", 
    "Utilidade",
    "Clareza",
    "Completude",
    "Relevância"
  ];

  const handleSubmit = async () => {
    if (satisfaction === 0) {
      toast.error("Por favor, avalie sua satisfação");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch("/api/feedback/detailed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          satisfaction,
          aspects,
          comment,
          trigger,
        }),
      });
      toast.success("Obrigado pelo seu feedback detalhado!");
      onClose();
    } catch (error) {
      toast.error("Falha ao enviar feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Como foi sua experiência?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Satisfaction Rating */}
          <div>
            <label className="text-sm font-medium">Satisfação geral</label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={satisfaction === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSatisfaction(rating)}
                  className="flex-1"
                >
                  {rating}
                </Button>
              ))}
            </div>
            {satisfaction > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {satisfactionLabels[satisfaction - 1]}
              </p>
            )}
          </div>

          {/* Aspect Selection */}
          <div>
            <label className="text-sm font-medium">O que funcionou bem?</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {aspectOptions.map((aspect) => (
                <Badge
                  key={aspect}
                  variant={aspects.includes(aspect) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setAspects(prev => 
                      prev.includes(aspect) 
                        ? prev.filter(a => a !== aspect)
                        : [...prev, aspect]
                    );
                  }}
                >
                  {aspect}
                </Badge>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium">Comentários adicionais (opcional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Pular
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Smart feedback trigger hook
export function useFeedbackTrigger(chatId: string) {
  const [showDetailed, setShowDetailed] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [lastFeedbackTime, setLastFeedbackTime] = useState<number>(0);

  useEffect(() => {
    // Exit intent detection
    const handleBeforeUnload = () => {
      const now = Date.now();
      if (messageCount > 3 && now - lastFeedbackTime > 300000) { // 5 minutes
        setShowDetailed(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [messageCount, lastFeedbackTime]);

  const incrementMessage = () => {
    setMessageCount(prev => {
      const newCount = prev + 1;
      // Trigger feedback every 10 messages
      if (newCount % 10 === 0 && Date.now() - lastFeedbackTime > 600000) { // 10 minutes
        setShowDetailed(true);
        setLastFeedbackTime(Date.now());
      }
      return newCount;
    });
  };

  const triggerEndSession = () => {
    if (messageCount > 2) {
      setShowDetailed(true);
    }
  };

  return {
    showDetailed,
    setShowDetailed,
    incrementMessage,
    triggerEndSession,
  };
}