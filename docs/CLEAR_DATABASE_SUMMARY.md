# ✅ Script de Limpeza do Banco Criado

## 📁 Arquivos Criados

1. **`clear-database.ts`** - Script de limpeza
2. **`DATABASE_CLEAR_INSTRUCTIONS.md`** - Instruções detalhadas
3. **`package.json`** - Adicionado comando `db:clear`

---

## 🚀 Como Usar

### Comando Rápido:
```bash
npm run db:clear
```

ou

```bash
pnpm db:clear
```

---

## ⚠️ IMPORTANTE: Leia Antes de Executar

### O que o script faz:
1. ⏱️ Aguarda 5 segundos (você pode cancelar com Ctrl+C)
2. 🗑️ Deleta TODOS os dados de 5 tabelas:
   - `user_interactions`
   - `chat_feedback`
   - `chat_votes`
   - `chat_messages`
   - `chat_sessions`
3. ✅ Confirma sucesso

### O que NÃO é deletado:
- ✅ Estrutura das tabelas (schema)
- ✅ Usuários (tabela `User`)
- ✅ Migrações

---

## 📋 Checklist Antes de Executar

- [ ] Tenho certeza que quero deletar TODOS os dados
- [ ] Fiz backup se necessário
- [ ] Verifiquei que `POSTGRES_URL` está correta
- [ ] Li as instruções em `DATABASE_CLEAR_INSTRUCTIONS.md`

---

## 🎯 Motivo da Limpeza

Você está limpando o banco porque:

1. **Sessões antigas têm `withMicroInteractions: false`**
   - Foram criadas antes da correção
   - Dashboard mostra "Sem: X" incorretamente

2. **Dados de teste**
   - Não são representativos para o TCC
   - Podem distorcer as métricas

3. **Começar limpo**
   - Novas sessões terão flag correta
   - Dashboard mostrará dados precisos
   - Pronto para coleta de dados reais

---

## ✅ Após Limpar

### 1. Verificar Dashboard
```bash
npm run dev
# Acesse: http://localhost:3000/dashboard
```

**Deve mostrar:**
- Total Sessions: 0
- Todas as métricas zeradas

### 2. Testar Nova Sessão

**No Vercel (com microinterações):**
- Criar sessão → Dashboard deve mostrar "Com: 1" ✅

**Local (sem microinterações):**
- Criar sessão → Dashboard deve mostrar "Sem: 1" ✅

### 3. Deploy

```bash
git add .
git commit -m "fix: correct withMicroInteractions flag and clean data"
git push
```

---

## 🔍 Exemplo de Execução

```bash
$ npm run db:clear

> ai-chatbot@3.1.0 db:clear
> npx tsx clear-database.ts

⚠️  WARNING: This will DELETE ALL DATA from the database!
⏳ Starting in 5 seconds... Press Ctrl+C to cancel

🗑️  Deleting all data...
✅ Deleted user_interactions
✅ Deleted chat_feedback
✅ Deleted chat_votes
✅ Deleted chat_messages
✅ Deleted chat_sessions

✅ Database cleared successfully!

📊 You can now deploy to production with clean data.
```

---

## 🛡️ Segurança

- ✅ Aviso de 5 segundos antes de executar
- ✅ Pode cancelar com Ctrl+C
- ✅ Deleta em ordem correta (respeita foreign keys)
- ✅ Mostra progresso de cada tabela
- ✅ Confirma sucesso ao final

---

## 📚 Documentação Completa

Veja `DATABASE_CLEAR_INSTRUCTIONS.md` para:
- Instruções detalhadas
- FAQ
- Como fazer backup
- Como restaurar
- Verificações pós-limpeza

---

## ✅ Pronto!

Você agora tem:
1. ✅ Script de limpeza funcional
2. ✅ Comando npm configurado
3. ✅ Documentação completa
4. ✅ Segurança com aviso de 5 segundos

**Execute quando estiver pronto para começar com dados limpos! 🚀**
