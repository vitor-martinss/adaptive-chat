import { generateText } from 'ai';
import { getModel } from '@/lib/ai/models';

export async function POST(request: Request) {
  try {
    const { conversation } = await request.json();

    const { text } = await generateText({
      model: getModel('grok-3-mini'),
      prompt: `Analise esta conversa e extraia o tópico principal em uma frase curta (máximo 6 palavras).
Seja específico e objetivo. Responda apenas o tópico, sem explicações.

Conversa:
${conversation}

Tópico:`,
      maxTokens: 30,
    });

    return Response.json({ topic: text.trim() });
  } catch (error) {
    console.error('Topic extraction error:', error);
    return Response.json({ topic: 'Conversa geral' }, { status: 200 });
  }
}
