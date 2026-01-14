export function analyzeConversationContext(messages: string[]): {
  hasPositiveSignals: boolean;
  hasNegativeSignals: boolean;
  seemsResolved: boolean;
} {
  const allText = messages.join(' ').toLowerCase();
  
  const positiveSignals = [
    'obrigado', 'obrigada', 'valeu', 'perfeito', 'ótimo', 'excelente', 
    'ajudou', 'esclareceu', 'entendi', 'consegui', 'resolveu', 'certo'
  ];
  
  const negativeSignals = [
    'não entendi', 'confuso', 'complicado', 'difícil', 'problema', 
    'erro', 'errado', 'não funciona', 'não consegui', 'ainda tenho dúvida'
  ];
  
  const resolutionSignals = [
    'já sei', 'entendi', 'esclarecido', 'resolvido', 'consegui', 
    'obrigado', 'valeu', 'era isso mesmo', 'perfeito'
  ];
  
  const hasPositiveSignals = positiveSignals.some(signal => allText.includes(signal));
  const hasNegativeSignals = negativeSignals.some(signal => allText.includes(signal));
  const seemsResolved = resolutionSignals.some(signal => allText.includes(signal));
  
  return {
    hasPositiveSignals,
    hasNegativeSignals,
    seemsResolved
  };
}