# Limpeza do Banco de Dados para Produção

## ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!

Este script irá **DELETAR TODOS OS DADOS** do banco de dados.

---

## 🎯 Quando Usar

Use este script quando:
- ✅ Quiser começar com dados limpos em produção
- ✅ Tiver dados de teste que precisa remover
- ✅ Quiser resetar todas as métricas do dashboard

**NÃO use se:**
- ❌ Tiver dados de produção importantes
- ❌ Não tiver backup dos dados

---

## 📋 Pré-requisitos

1. **Backup (Recomendado)**
   ```bash
   # Faça backup antes de limpar
   pg_dump $POSTGRES_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Variável de Ambiente**
   - Certifique-se que `POSTGRES_URL` está configurada
   - Verifique se está apontando para o banco correto!

---

## 🚀 Como Executar

### Opção 1: Usando npm script (Recomendado)

```bash
npm run db:clear
```

ou

```bash
pnpm db:clear
```

### Opção 2: Diretamente com tsx

```bash
npx tsx clear-database.ts
```

---

## ⏱️ O que Acontece

1. **Aviso de 5 segundos**
   - Script mostra aviso e aguarda 5 segundos
   - Você pode cancelar com `Ctrl+C`

2. **Deleção em Ordem**
   ```
   🗑️  Deleting all data...
   ✅ Deleted user_interactions
   ✅ Deleted chat_feedback
   ✅ Deleted chat_votes
   ✅ Deleted chat_messages
   ✅ Deleted chat_sessions
   ```

3. **Confirmação**
   ```
   ✅ Database cleared successfully!
   📊 You can now deploy to production with clean data.
   ```

---

## 📊 Tabelas Afetadas

O script deleta dados de **5 tabelas** nesta ordem:

1. `user_interactions` - Todas as interações do usuário
2. `chat_feedback` - Todo o feedback coletado
3. `chat_votes` - Todos os votos (upvote/downvote)
4. `chat_messages` - Todas as mensagens
5. `chat_sessions` - Todas as sessões

**Ordem é importante:** Respeita foreign keys para evitar erros.

---

## ✅ Após Limpar o Banco

### 1. Verificar no Dashboard
```bash
# Inicie o servidor
npm run dev

# Acesse o dashboard
http://localhost:3000/dashboard
```

**Deve mostrar:**
- Total Sessions: 0
- Todas as métricas zeradas
- Gráficos vazios

### 2. Testar Nova Sessão
1. Crie uma nova sessão de chat
2. Verifique que `withMicroInteractions` está correto
3. Confirme no dashboard que aparece "Com: 1" ou "Sem: 1"

### 3. Deploy para Produção
```bash
git add .
git commit -m "fix: correct withMicroInteractions flag and clean data"
git push
```

---

## 🔍 Verificação Pós-Limpeza

### Verificar se banco está vazio:

```sql
-- Conecte ao banco e execute:
SELECT 
  (SELECT COUNT(*) FROM chat_sessions) as sessions,
  (SELECT COUNT(*) FROM chat_messages) as messages,
  (SELECT COUNT(*) FROM chat_votes) as votes,
  (SELECT COUNT(*) FROM chat_feedback) as feedback,
  (SELECT COUNT(*) FROM user_interactions) as interactions;
```

**Resultado esperado:**
```
sessions | messages | votes | feedback | interactions
---------|----------|-------|----------|-------------
   0     |    0     |   0   |    0     |      0
```

---

## 🛡️ Segurança

### O script NÃO deleta:
- ✅ Estrutura das tabelas (schema)
- ✅ Usuários do sistema (tabela `User`)
- ✅ Migrações (tabela `__drizzle_migrations`)

### O script DELETA:
- ❌ Todas as sessões de chat
- ❌ Todas as mensagens
- ❌ Todo o feedback
- ❌ Todos os votos
- ❌ Todas as interações

---

## 🔄 Restaurar Backup (Se Necessário)

Se você fez backup e precisa restaurar:

```bash
# Restaurar do backup
psql $POSTGRES_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## 📝 Checklist Antes de Executar

- [ ] Fiz backup dos dados (se necessário)
- [ ] Verifiquei que `POSTGRES_URL` está correta
- [ ] Confirmei que quero deletar TODOS os dados
- [ ] Estou preparado para começar com dados limpos
- [ ] Entendo que esta operação é IRREVERSÍVEL

---

## ❓ FAQ

**Q: Posso cancelar durante a execução?**
A: Sim, pressione `Ctrl+C` durante os 5 segundos de aviso.

**Q: O script deleta usuários?**
A: Não, apenas dados de chat. Usuários na tabela `User` são preservados.

**Q: Preciso rodar migrações depois?**
A: Não, o schema permanece intacto. Apenas os dados são deletados.

**Q: Posso usar em produção?**
A: Sim, mas APENAS se você tiver certeza que quer deletar todos os dados.

**Q: E se der erro?**
A: O script para imediatamente e mostra o erro. Nenhum dado é deletado parcialmente.

---

## ✅ Pronto para Produção

Após limpar o banco:

1. ✅ Dados de teste removidos
2. ✅ Flag `withMicroInteractions` corrigida
3. ✅ Dashboard mostrará dados corretos
4. ✅ Métricas começam do zero
5. ✅ Pronto para coleta de dados reais do TCC

**Boa sorte com a coleta de dados! 🚀**
