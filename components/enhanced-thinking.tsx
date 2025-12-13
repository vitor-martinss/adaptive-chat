"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { SparklesIcon } from "./icons";
import { useReducedMotion } from "../hooks/use-reduced-motion";

const getContextualMessage = (userMessage: string): string[] => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('atacado') || message.includes('mínimo') || message.includes('quantidade')) {
    return [
      "Verificando informações de atacado...",
      "Consultando quantidades mínimas...",
      "Preparando detalhes comerciais..."
    ];
  }
  
  if (message.includes('preço') || message.includes('valor') || message.includes('custo')) {
    return [
      "Consultando tabela de preços...",
      "Verificando valores atualizados...",
      "Preparando informações comerciais..."
    ];
  }
  
  if (message.includes('entrega') || message.includes('frete') || message.includes('envio')) {
    return [
      "Consultando opções de entrega...",
      "Verificando prazos de envio...",
      "Calculando informações de frete..."
    ];
  }
  
  if (message.includes('produto') || message.includes('sapatilha') || message.includes('modelo')) {
    return [
      "Buscando informações do produto...",
      "Consultando catálogo disponível...",
      "Verificando modelos e tamanhos..."
    ];
  }
  
  if (message.includes('pagamento') || message.includes('pix') || message.includes('cartão')) {
    return [
      "Consultando formas de pagamento...",
      "Verificando opções disponíveis...",
      "Preparando informações financeiras..."
    ];
  }
  
  return [
    "Analisando sua pergunta...",
    "Buscando informações relevantes...",
    "Preparando resposta personalizada..."
  ];
};

interface EnhancedThinkingProps {
  userMessage?: string;
  withMicroInteractions?: boolean;
}

export const EnhancedThinking = ({ userMessage = "", withMicroInteractions = false }: EnhancedThinkingProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dots, setDots] = useState("");
  const prefersReducedMotion = useReducedMotion();
  
  const messages = getContextualMessage(userMessage);
  const shouldAnimate = withMicroInteractions && !prefersReducedMotion;
  
  useEffect(() => {
    if (!withMicroInteractions) return;
    
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, shouldAnimate ? 2000 : 4000);
    
    return () => clearInterval(messageInterval);
  }, [messages.length, withMicroInteractions]);
  
  useEffect(() => {
    if (!withMicroInteractions) return;
    
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    
    return () => clearInterval(dotsInterval);
  }, [withMicroInteractions]);

  if (!withMicroInteractions) {
    return (
      <motion.div
        animate={{ opacity: 1 }}
        className="group/message w-full"
        data-role="assistant"
        data-testid="message-assistant-loading"
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start justify-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
          <div className="flex w-full flex-col gap-2 md:gap-4">
            <div className="p-0 text-muted-foreground text-sm">
              Aguarde...
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="group/message w-full"
      data-role="assistant"
      data-testid="message-assistant-loading"
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-start gap-3">
        <motion.div 
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border"
          animate={shouldAnimate ? { 
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 0 0 0 rgba(59, 130, 246, 0)",
              "0 0 0 4px rgba(59, 130, 246, 0.1)",
              "0 0 0 0 rgba(59, 130, 246, 0)"
            ]
          } : {}}
          transition={shouldAnimate ? { 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        >
          <SparklesIcon size={14} />
        </motion.div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="p-0 text-muted-foreground text-sm">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentMessageIndex}
                initial={shouldAnimate ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldAnimate ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: 0.3 } : { duration: 0 }}
              >
                {messages[currentMessageIndex]}
                <span className="inline-block w-4">{dots}</span>
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};