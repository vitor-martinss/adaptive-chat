import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export async function POST(request: Request) {
  try {
    const { conversation } = await request.json();

    const { text } = await generateText({
      model: myProvider.languageModel('chat-model'),
      prompt: `Você analisa conversas de atendimento ao cliente de uma loja de sapatilhas.

Identifique o TEMA PRINCIPAL em até 5 palavras. Foque na INTENÇÃO do cliente, não em palavras isoladas.

Exemplos:
- Cliente pergunta sobre pagamento + entrega → "Processo de compra"
- Cliente pergunta só sobre preços → "Consulta de preços"
- Cliente pergunta sobre prazo de entrega → "Prazo de entrega"
- Cliente pergunta sobre troca de produto → "Troca de produto"
- Cliente pergunta sobre disponibilidade → "Disponibilidade de produto"

Conversa:
${conversation}

Tema (máximo 5 palavras):`,
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
