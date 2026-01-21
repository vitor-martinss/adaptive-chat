# Análise Compreensiva do Dashboard para TCC

## 📊 Visão Geral

Dashboard desenvolvido para análise de chatbot com microinterações, focado em medir eficácia, engajamento e satisfação do usuário.

---

## 1️⃣ MÉTRICAS PRINCIPAIS (Cards Superiores)

### 1.1 Total Sessions
**O que mede:** Número total de sessões de chat iniciadas no período

**Relevância para TCC:**
- ✅ Métrica fundamental de **volume de uso**
- ✅ Indica **adoção** do sistema
- ✅ Permite comparar períodos (crescimento/declínio)

**Subdivisão:**
- Com microinterações: Sessões com sistema de sugestões ativo
- Sem microinterações: Sessões com chat tradicional (controle)

**Uso no TCC:**
> "Durante o período de análise, foram registradas X sessões, sendo Y% com microinterações e Z% no grupo controle."

---

### 1.2 Sessões Completas
**O que mede:** Sessões que chegaram ao fim do fluxo (feedback solicitado)

**Cálculo:** `(completedSessions / totalSessions) * 100`

**Relevância para TCC:**
- ✅ Indica **taxa de conclusão** do fluxo
- ✅ Mede **efetividade** do sistema em resolver problemas
- ✅ Sessões incompletas podem indicar abandono ou problema não resolvido

**Interpretação:**
- Alta taxa (>70%): Sistema eficaz em resolver problemas
- Baixa taxa (<40%): Usuários abandonam antes de resolver

**Uso no TCC:**
> "A taxa de conclusão foi de X%, indicando que a maioria dos usuários conseguiu resolver suas dúvidas."

---

### 1.3 Com Feedback
**O que mede:** Sessões onde usuário preencheu feedback detalhado

**Cálculo:** `(uniqueUsersWithFeedback / completedSessions) * 100`

**Relevância para TCC:**
- ✅ Mede **engajamento pós-interação**
- ✅ Indica **disposição** do usuário em avaliar
- ✅ Qualidade dos dados coletados

**Interpretação:**
- Alta taxa (>60%): Usuários engajados e satisfeitos
- Baixa taxa (<30%): Possível fadiga ou insatisfação

**Uso no TCC:**
> "X% das sessões completas resultaram em feedback detalhado, demonstrando alto engajamento."

---

### 1.4 Taxa de Abandono
**O que mede:** Percentual de sessões abandonadas antes da conclusão

**Cálculo:** `(abandonedSessions / totalSessions) * 100`

**Relevância para TCC:**
- ✅ **Indicador crítico** de problemas
- ✅ Mede **frustração** do usuário
- ✅ Permite comparar grupos (com/sem microinterações)

**Interpretação:**
- Baixa taxa (<20%): Sistema funciona bem
- Alta taxa (>40%): Problemas sérios de UX ou eficácia

**Hipótese para TCC:**
> "Espera-se que microinterações reduzam a taxa de abandono ao facilitar a navegação."

---

### 1.5 Msgs/Sessão
**O que mede:** Média de mensagens trocadas por sessão

**Cálculo:** `totalMessages / totalSessions`

**Relevância para TCC:**
- ✅ Indica **complexidade** das interações
- ✅ Mede **eficiência** (menos mensagens = mais direto)
- ✅ Permite comparar grupos

**Interpretação:**
- Baixa média (1-3): Problemas simples, respostas diretas
- Alta média (>5): Problemas complexos ou sistema ineficiente

**Hipótese para TCC:**
> "Microinterações podem reduzir o número de mensagens necessárias ao guiar o usuário."

---

### 1.6 Upvote Ratio
**O que mede:** Percentual de votos positivos nas respostas

**Cálculo:** `(upvotes / totalVotes) * 100`

**Relevância para TCC:**
- ✅ **Indicador direto de satisfação**
- ✅ Feedback em tempo real
- ✅ Mede qualidade das respostas

**Interpretação:**
- Alta taxa (>70%): Respostas úteis e precisas
- Baixa taxa (<50%): Problemas de qualidade

**Uso no TCC:**
> "O upvote ratio de X% indica alta satisfação com as respostas fornecidas."

---

## 2️⃣ MÉTRICAS DE FEEDBACK (Card Detalhado)

### 2.1 Satisfação Média
**O que mede:** Avaliação média de satisfação (escala 1-5)

**Relevância para TCC:**
- ✅ **Métrica principal** de sucesso
- ✅ Permite comparação estatística entre grupos
- ✅ Validação da hipótese

**Interpretação:**
- Excelente: >4.0
- Bom: 3.5-4.0
- Regular: 3.0-3.5
- Ruim: <3.0

**Análise Estatística:**
> "Teste t para comparar satisfação média entre grupo com microinterações (M=X, SD=Y) e grupo controle (M=A, SD=B)."

---

### 2.2 Sessões Completas
**O que mede:** Número absoluto de sessões finalizadas

**Relevância para TCC:**
- ✅ Tamanho da amostra para análise
- ✅ Valida significância estatística

---

### 2.3 Redirecionados
**O que mede:** Usuários que completaram feedback e foram redirecionados

**Relevância para TCC:**
- ✅ Indica **conclusão total** do fluxo
- ✅ Mede **retenção** até o fim

**Interpretação:**
- Baixo número: Usuários fecham navegador antes do redirect
- Alto número: Fluxo bem desenhado

---

### 2.4 Feedback Pulado
**O que mede:** Usuários que optaram por não dar feedback

**Relevância para TCC:**
- ✅ Indica **fadiga** ou **pressa**
- ✅ Mede **fricção** no processo

**Uso no TCC:**
> "X% dos usuários pularam o feedback, sugerindo necessidade de otimização do formulário."

---

### 2.5 Taxa Redirect
**O que mede:** `(redirectedSessions / completedSessions) * 100`

**Relevância para TCC:**
- ✅ Mede **completude** do fluxo
- ✅ Indica problemas técnicos se muito baixa

---

## 3️⃣ MÉTRICAS DE ENGAJAMENTO

### 3.1 Cliques em Sugestões
**O que mede:** Número de vezes que usuários clicaram em sugestões

**Relevância para TCC:**
- ✅ **Métrica central** para validar microinterações
- ✅ Mede **adoção** do recurso
- ✅ Indica **utilidade** das sugestões

**Uso no TCC:**
> "As microinterações foram utilizadas X vezes, demonstrando alta adoção do recurso."

---

### 3.2 Msgs Digitadas
**O que mede:** Número de mensagens digitadas manualmente

**Relevância para TCC:**
- ✅ Complementa análise de sugestões
- ✅ Indica quando usuário precisa de mais controle

---

### 3.3 Ratio Sugestões
**O que mede:** `(suggestionClicks / (suggestionClicks + typedMessages)) * 100`

**Relevância para TCC:**
- ✅ **MÉTRICA CRÍTICA** para TCC
- ✅ Mede **preferência** por microinterações vs digitação
- ✅ Valida hipótese de facilidade de uso

**Interpretação:**
- Alta taxa (>70%): Usuários preferem sugestões (mais fácil)
- Baixa taxa (<40%): Sugestões não atendem necessidades

**Hipótese para TCC:**
> "H1: Usuários com microinterações terão ratio de sugestões >70%, indicando preferência pelo recurso."

---

## 4️⃣ TEMPO DE SESSÃO

### 4.1 Duração Média
**O que mede:** Tempo médio de duração das sessões

**Relevância para TCC:**
- ✅ Indica **eficiência** do sistema
- ✅ Permite comparar grupos

**Interpretação:**
- Curta (<2 min): Problemas simples ou abandono rápido
- Média (2-5 min): Interação normal
- Longa (>5 min): Problemas complexos ou dificuldade

---

### 4.2 Com Micro vs Sem Micro
**O que mede:** Duração média por grupo

**Relevância para TCC:**
- ✅ **COMPARAÇÃO DIRETA** entre grupos
- ✅ Valida eficiência das microinterações

**Hipótese para TCC:**
> "H2: Sessões com microinterações terão duração menor, indicando maior eficiência."

**Análise Estatística:**
> "Teste t para comparar duração média: Grupo A (M=X min) vs Grupo B (M=Y min), p<0.05."

---

### 4.3 Até Abandono
**O que mede:** Tempo médio até usuário abandonar

**Relevância para TCC:**
- ✅ Identifica **ponto de frustração**
- ✅ Indica quando usuário desiste

---

## 5️⃣ ANÁLISE POR TÓPICOS

### Métricas por Tópico:
1. **Tópico** - Assunto tratado (extraído por LLM)
2. **Sessões** - Volume por tópico
3. **Duração Média** - Complexidade por tópico
4. **Msg/Sessão** - Eficiência por tópico
5. **Satisfação** - Qualidade por tópico
6. **Sugestões %** - Adoção por tópico

**Relevância para TCC:**
- ✅ Identifica **tópicos problemáticos**
- ✅ Mostra onde microinterações são mais úteis
- ✅ Permite **análise qualitativa**

**Uso no TCC:**
> "Tópicos relacionados a 'entrega' tiveram maior uso de sugestões (X%), enquanto 'troca/devolução' teve menor adoção (Y%), sugerindo que microinterações são mais eficazes para problemas simples."

---

## 6️⃣ GRÁFICO TEMPORAL (Sessions Per Day)

**O que mostra:**
- Evolução diária de sessões
- Comparação com/sem microinterações
- Tendências ao longo do tempo

**Relevância para TCC:**
- ✅ Valida **consistência** dos dados
- ✅ Identifica **outliers**
- ✅ Mostra **adoção** ao longo do tempo

---

## 📈 MÉTRICAS ESSENCIAIS PARA TCC

### Primárias (Obrigatórias):
1. ✅ **Satisfação Média** - Validação principal da hipótese
2. ✅ **Ratio Sugestões** - Adoção das microinterações
3. ✅ **Taxa de Abandono** - Eficácia do sistema
4. ✅ **Duração Média (Com vs Sem)** - Eficiência comparativa

### Secundárias (Complementares):
5. ✅ **Upvote Ratio** - Qualidade das respostas
6. ✅ **Msgs/Sessão** - Complexidade das interações
7. ✅ **Taxa de Conclusão** - Efetividade do fluxo
8. ✅ **Análise por Tópicos** - Insights qualitativos

---

## 🎯 HIPÓTESES TESTÁVEIS

### H1: Satisfação
> "Usuários com microinterações terão satisfação média significativamente maior (p<0.05) que o grupo controle."

**Métrica:** `avgSatisfaction` (com vs sem micro)
**Teste:** t-test independente

---

### H2: Eficiência
> "Sessões com microinterações terão duração média menor, indicando maior eficiência."

**Métrica:** `sessionDuration.avgWithMicroMs` vs `avgWithoutMicroMs`
**Teste:** t-test independente

---

### H3: Adoção
> "Usuários utilizarão sugestões em >70% das interações, demonstrando preferência pelo recurso."

**Métrica:** `suggestionRatio`
**Teste:** Teste de proporção

---

### H4: Abandono
> "Taxa de abandono será menor no grupo com microinterações."

**Métrica:** `abandonmentRate` (com vs sem micro)
**Teste:** Teste qui-quadrado

---

### H5: Engajamento
> "Usuários com microinterações terão maior taxa de conclusão e feedback."

**Métricas:** `completedSessions`, `uniqueUsersWithFeedback`
**Teste:** Teste qui-quadrado

---

## 📊 ANÁLISES ESTATÍSTICAS RECOMENDADAS

### 1. Análise Descritiva
```
Grupo A (Com Micro):
- N = X sessões
- Satisfação: M = 4.2, SD = 0.8
- Duração: M = 3.5 min, SD = 1.2
- Ratio Sugestões: 85%

Grupo B (Sem Micro):
- N = Y sessões
- Satisfação: M = 3.8, SD = 0.9
- Duração: M = 4.2 min, SD = 1.5
- Ratio Sugestões: N/A
```

### 2. Testes de Hipóteses
- **t-test** para satisfação e duração
- **Qui-quadrado** para taxas (abandono, conclusão)
- **Teste de proporção** para ratio de sugestões

### 3. Análise de Correlação
- Satisfação vs Duração
- Satisfação vs Ratio Sugestões
- Msgs/Sessão vs Taxa de Abandono

### 4. Análise Qualitativa
- Análise por tópicos
- Padrões de uso
- Feedback textual

---

## ✅ VALIDAÇÃO DAS MÉTRICAS

### Consistência Lógica:
- ✅ `completedSessions` ≤ `totalSessions`
- ✅ `uniqueUsersWithFeedback` ≤ `completedSessions`
- ✅ `upvotes` + `downvotes` = `totalVotes`
- ✅ `withMicroInteractions` + `withoutMicroInteractions` = `totalSessions`

### Filtros Aplicados:
- ✅ Todas as métricas respeitam filtros de data
- ✅ Todas as métricas respeitam filtro de condição (com/sem micro)
- ✅ JOINs corretos para manter consistência

---

## 🎓 ESTRUTURA PARA TCC

### Capítulo de Metodologia:
```
4.3 Métricas de Avaliação

Para avaliar a eficácia das microinterações, foram definidas as seguintes métricas:

4.3.1 Métricas Primárias
- Satisfação do Usuário (escala 1-5)
- Taxa de Adoção de Sugestões (%)
- Duração Média da Sessão (minutos)
- Taxa de Abandono (%)

4.3.2 Métricas Secundárias
- Upvote Ratio (%)
- Mensagens por Sessão
- Taxa de Conclusão (%)
- Análise por Tópicos
```

### Capítulo de Resultados:
```
5. RESULTADOS

5.1 Análise Descritiva
Durante o período de X dias, foram coletadas Y sessões...

5.2 Comparação Entre Grupos
Grupo com microinterações (N=X):
- Satisfação: M=4.2, SD=0.8
- Duração: M=3.5 min, SD=1.2

Grupo controle (N=Y):
- Satisfação: M=3.8, SD=0.9
- Duração: M=4.2 min, SD=1.5

5.3 Testes de Hipóteses
H1: t(df)=X.XX, p<0.05 - ACEITA
H2: t(df)=Y.YY, p<0.05 - ACEITA
...

5.4 Análise Qualitativa
Análise por tópicos revelou que...
```

---

## 🚀 CONCLUSÃO

**Dashboard está COMPLETO e ADEQUADO para TCC:**

✅ Métricas primárias bem definidas
✅ Comparação entre grupos possível
✅ Dados consistentes e confiáveis
✅ Análises estatísticas viáveis
✅ Insights qualitativos disponíveis

**Recomendações:**
1. Coletar dados de pelo menos 100 sessões por grupo
2. Garantir distribuição aleatória entre grupos
3. Documentar período de coleta
4. Exportar dados para análise estatística (SPSS/R)
5. Incluir análise qualitativa dos tópicos

**O dashboard fornece TODAS as métricas necessárias para um TCC robusto e cientificamente válido.**
