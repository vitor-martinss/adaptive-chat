"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const contextualPlaceholders = [
  "Digite sua mensagem...",
  "Pergunte sobre nossos produtos...",
  "Como posso ajudar hoje?",
  "Dúvidas sobre atacado?",
  "Precisa de informações?"
];

interface EnhancedInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  disabled?: boolean;
  withMicroInteractions?: boolean;
  className?: string;
  [key: string]: any;
}

export const EnhancedInput = ({ 
  value, 
  onChange, 
  onSubmit, 
  disabled = false, 
  withMicroInteractions = false,
  className = "",
  ...props 
}: EnhancedInputProps) => {
  const [placeholder, setPlaceholder] = useState(contextualPlaceholders[0]);
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    if (!withMicroInteractions) return;
    
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const currentIndex = contextualPlaceholders.indexOf(prev);
        const nextIndex = (currentIndex + 1) % contextualPlaceholders.length;
        return contextualPlaceholders[nextIndex];
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [withMicroInteractions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  if (!withMicroInteractions) {
    return (
      <textarea
        {...props}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Digite sua mensagem..."
        className={className}
      />
    );
  }

  return (
    <motion.div
      animate={{
        boxShadow: isFocused 
          ? "0 0 0 2px rgba(59, 130, 246, 0.2)" 
          : "0 0 0 0px rgba(59, 130, 246, 0)"
      }}
      transition={{ duration: 0.2 }}
      className="relative rounded-xl"
    >
      <textarea
        {...props}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        placeholder={placeholder}
        className={`${className} transition-all duration-200`}
      />
      
      {value.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-2 right-2 text-xs text-muted-foreground"
        >
          {value.length}
        </motion.div>
      )}
    </motion.div>
  );
};