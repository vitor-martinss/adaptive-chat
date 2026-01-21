# Correções Aplicadas

## 1️⃣ Formato de Duração Melhorado

### Problema:
```
Duração Média: 1415m 42s  ❌ Difícil de ler
```

### Solução:
```typescript
function formatDuration(ms: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;  // ✅ Mais legível
  }
  // ...
}
```

### Resultado:
```
Duração Média: 23h 35m  ✅ Muito mais claro
```

---

## 2️⃣ Flag withMicroInteractions Corrigida

### Problema:
**No Vercel:** `NEXT_PUBLIC_WITH_MICRO_INTERACTIONS=true`
**No Dashboard:** Mostrando "Sem: X" (todas as sessões como false)

### Causa Raiz:
O código não estava enviando a flag `withMicroInteractions` ao criar a sessão.

```typescript
// ANTES (ERRADO)
fetch("/api/sessions", {
  body: JSON.stringify({ sessionId: id, userId })  // ❌ Sem flag
});
```

### Solução:
```typescript
// DEPOIS (CORRETO)
const withMicroInteractions = process.env.NEXT_PUBLIC_WITH_MICRO_INTERACTIONS === "true";

fetch("/api/sessions", {
  body: JSON.stringify({ 
    sessionId: id, 
    userId, 
    withMicroInteractions  // ✅ Flag enviada
  })
});
```

### Comportamento:

**Quando `NEXT_PUBLIC_WITH_MICRO_INTERACTIONS=true` (Vercel):**
- ✅ Sessões criadas com `withMicroInteractions: true`
- ✅ Dashboard mostra "Com: X"
- ✅ Sugestões aparecem
- ✅ Enhanced thinking ativo

**Quando `NEXT_PUBLIC_WITH_MICRO_INTERACTIONS=false` ou não definida (Local):**
- ✅ Sessões criadas com `withMicroInteractions: false`
- ✅ Dashboard mostra "Sem: X"
- ✅ Chat tradicional (sem sugestões)

---

## 🔍 Onde a Flag é Usada

### 1. **Criação de Sessão** (`components/chat.tsx`)
```typescript
const withMicroInteractions = process.env.NEXT_PUBLIC_WITH_MICRO_INTERACTIONS === "true";
// Enviado para /api/sessions
```

### 2. **Exibição de Sugestões** (`components/message.tsx`)
```typescript
process.env.NEXT_PUBLIC_WITH_MICRO_INTERACTIONS === "true" && (
  <SuggestedActions ... />
)
```

### 3. **Enhanced Thinking** (`components/message.tsx`)
```typescript
const withMicroInteractions = process.env.NEXT_PUBLIC_WITH_MICRO_INTERACTIONS === "true";
<EnhancedThinking withMicroInteractions={withMicroInteractions} />
```

### 4. **Prompt do Sistema** (`lib/ai/prompts.ts`)
```typescript
export function systemPrompt(withMicroInteractions = false) {
  // Ajusta prompt baseado na flag
}
```

### 5. **Banco de Dados** (`lib/db/schema.ts`)
```typescript
withMicroInteractions: boolean("with_micro_interactions").notNull().default(false)
```

### 6. **Dashboard** (`app/api/dashboard/stats/route.ts`)
```typescript
// Filtra e conta sessões por flag
const [withMicroResult] = await db.select({ count: count() })
  .from(chatSessions)
  .where(eq(chatSessions.withMicroInteractions, true));
```

---

## ⚠️ Nota Importante: Sessões Antigas

**Sessões criadas ANTES desta correção:**
- Todas têm `withMicroInteractions: false` (default do banco)
- Mesmo que o Vercel tivesse a flag `true`
- Isso explica por que dashboard mostrava "Sem: X"

**Sessões criadas DEPOIS desta correção:**
- ✅ Terão o valor correto baseado na env var
- ✅ Dashboard mostrará corretamente "Com: X" ou "Sem: X"

---

## 🎯 Como Validar

### No Vercel (Produção):
1. Verificar env var: `NEXT_PUBLIC_WITH_MICRO_INTERACTIONS=true`
2. Criar nova sessão de chat
3. Verificar no dashboard: "Com: 1" (deve aumentar)
4. Verificar que sugestões aparecem no chat

### Local (Desenvolvimento):
1. Não definir a env var (ou `false`)
2. Criar nova sessão de chat
3. Verificar no dashboard: "Sem: 1" (deve aumentar)
4. Verificar que sugestões NÃO aparecem

---

## ✅ Status

- ✅ Formato de duração corrigido (23h 35m)
- ✅ Flag withMicroInteractions sendo enviada
- ✅ Novas sessões terão valor correto
- ✅ Dashboard funcionará corretamente
- ✅ Build successful

**Próximos passos:**
- Deploy no Vercel
- Criar novas sessões de teste
- Validar que dashboard mostra "Com: X" corretamente
