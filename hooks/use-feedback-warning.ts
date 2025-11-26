import { useEffect, useState } from "react";

export function useFeedbackWarning() {
  const [hasGivenFeedback, setHasGivenFeedback] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasGivenFeedback) {
        const message = "Antes de sair, que tal avaliar nossa conversa? Sua opinião é muito importante!";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasGivenFeedback]);

  return {
    setHasGivenFeedback,
  };
}