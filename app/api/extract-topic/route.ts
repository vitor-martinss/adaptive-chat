import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export async function POST(request: Request) {
  try {
    const { conversation } = await request.json();

    const { text } = await generateText({
      model: myProvider.languageModel('chat-model'),
      prompt: `Analise esta conversa e extraia o tópico principal em uma frase curta (máximo 6 palavras).
Seja específico e objetivo. Responda apenas o tópico, sem explicações.

Conversa:
${conversation}

Tópico:`,
    });

    return Response.json({ topic: text.trim() });
  } catch (error) {
    console.error('Topic extraction error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return Response.json({ topic: 'Conversa geral', error: true }, { status: 200 });
  }
}
