export type CaseType = "entrega" | "precos" | "troca_devolucao" | "produto" | "geral";

export interface CaseConfig {
  type: CaseType;
  name: string;
  keywords: string[];
  feedbackTrigger: {
    interactionCount: number;
    timeThreshold?: number; // em segundos
    endPhrases?: string[];
  };
}

export const CASE_CONFIGS: CaseConfig[] = [
  {
    type: "entrega",
    name: "Entrega",
    keywords: [
      "entrega", "entregar", "prazo", "envio", "enviar", "correios", "transportadora", 
      "receber", "chegou", "chegada", "demora", "demorar", "quando chega", "rastreamento",
      "rastrear", "código", "tracking", "sedex", "pac", "frete", "endereço", "cep"
    ],
    feedbackTrigger: {
      interactionCount: 2,
      timeThreshold: 90,
      endPhrases: ["sua encomenda", "prazo de entrega", "já foi enviado", "código de rastreamento"]
    }
  },
  {
    type: "precos",
    name: "Preços",
    keywords: [
      "preço", "valor", "custo", "custa", "desconto", "promoção", "oferta", "barato", 
      "caro", "quanto", "reais", "r$", "pagar", "pagamento", "parcelado", "à vista",
      "cartão", "pix", "boleto", "financiamento", "atacado", "mínimo", "minimo", "revenda"
    ],
    feedbackTrigger: {
      interactionCount: 2,
      timeThreshold: 60,
      endPhrases: ["o valor é", "preço atual", "em promoção", "custa"]
    }
  },
  {
    type: "troca_devolucao",
    name: "Troca/Devolução",
    keywords: [
      "troca", "trocar", "devolução", "devolver", "defeito", "problema", "danificado",
      "não serviu", "tamanho errado", "cor errada", "arrependimento", "garantia",
      "reembolso", "estorno", "cancelar", "cancelamento"
    ],
    feedbackTrigger: {
      interactionCount: 4,
      timeThreshold: 240,
      endPhrases: ["processo de troca", "política de devolução", "pode trocar", "prazo para trocar"]
    }
  },
  {
    type: "produto",
    name: "Produto",
    keywords: [
      "produto", "modelo", "cor", "tamanho", "disponível", "estoque", "características",
      "especificações", "material", "qualidade", "marca", "novo", "lançamento",
      "numeração", "medidas", "peso", "dimensões"
    ],
    feedbackTrigger: {
      interactionCount: 3,
      timeThreshold: 150,
      endPhrases: ["esse produto", "está disponível", "características do produto", "em estoque"]
    }
  },
  {
    type: "geral",
    name: "Geral",
    keywords: [],
    feedbackTrigger: {
      interactionCount: 4,
      timeThreshold: 180
    }
  }
];

export function classifyTopic(message: string): CaseType {
  const lowerMessage = message.toLowerCase();
  const scores: Record<CaseType, number> = {
    entrega: 0,
    precos: 0,
    troca_devolucao: 0,
    produto: 0,
    geral: 0
  };
  
  // Score each category based on keyword matches
  for (const config of CASE_CONFIGS) {
    if (config.type === "geral") continue;
    
    for (const keyword of config.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        scores[config.type]++;
      }
    }
  }
  
  // Find category with highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "geral";
  
  const topCategory = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as CaseType;
  return topCategory || "geral";
}

export async function extractTopicFromConversation(messages: string[]): Promise<string> {
  const conversationText = messages.slice(-6).join('\n');
  
  try {
    const response = await fetch('/api/extract-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: conversationText })
    });
    
    if (!response.ok) throw new Error('Failed to extract topic');
    
    const { topic } = await response.json();
    return topic || 'Conversa geral';
  } catch {
    return 'Conversa geral';
  }
}

export function getCaseConfig(caseType: CaseType): CaseConfig {
  return CASE_CONFIGS.find(config => config.type === caseType) || CASE_CONFIGS[CASE_CONFIGS.length - 1];
}

export function shouldTriggerFeedback(
  caseType: CaseType,
  interactionCount: number,
  sessionDurationSec: number,
  lastMessage?: string,
  conversationContext?: {
    hasPositiveSignals: boolean;
    hasNegativeSignals: boolean;
    seemsResolved: boolean;
  }
): boolean {
  const config = getCaseConfig(caseType);
  
  // User end phrases - trigger feedback when user says thanks/goodbye
  if (lastMessage) {
    const lowerMessage = lastMessage.toLowerCase();
    const userEndPhrases = [
      'obrigado', 'obrigada', 'valeu', 'brigado', 'brigada',
      'muito obrigado', 'muito obrigada', 'thanks', 'vlw',
      'era isso', 'era só isso', 'só isso', 'é isso',
      'tchau', 'até mais', 'até logo', 'falou', 'flw',
      'entendi', 'entendido', 'beleza', 'blz', 'ok obrigado',
      'perfeito', 'show', 'top', 'maravilha'
    ];
    if (userEndPhrases.some(phrase => lowerMessage.includes(phrase)) && interactionCount >= 1) {
      return true;
    }
  }
  
  // Early feedback for negative signals
  if (conversationContext?.hasNegativeSignals && interactionCount >= 2) {
    return true;
  }
  
  // Check AI end phrases (highest priority)
  if (lastMessage && config.feedbackTrigger.endPhrases) {
    const lowerMessage = lastMessage.toLowerCase();
    const hasEndPhrase = config.feedbackTrigger.endPhrases.some(phrase => 
      lowerMessage.includes(phrase.toLowerCase())
    );
    if (hasEndPhrase && interactionCount >= 2) {
      return true;
    }
  }
  
  // Standard interaction count trigger (case-specific)
  if (interactionCount >= config.feedbackTrigger.interactionCount) {
    return true;
  }
  
  // Time-based trigger (fallback)
  if (config.feedbackTrigger.timeThreshold && sessionDurationSec >= config.feedbackTrigger.timeThreshold) {
    return true;
  }
  
  return false;
}