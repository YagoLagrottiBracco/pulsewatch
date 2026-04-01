# Requirements: v1.1 Insights IA Avançado

**Milestone:** v1.1
**Status:** Active
**Created:** 2026-04-01

---

## Active Requirements

### Rastreamento de Ações

- [ ] **ACT-01**: Usuário pode marcar cada recomendação de insight como pendente, em progresso, concluída ou ignorada
- [ ] **ACT-02**: Usuário vê progresso de conclusão de recomendações no header de cada insight card (ex: "3/7 concluídas")
- [ ] **ACT-03**: Usuário vê card "O que fazer hoje" com as top 3 recomendações de alta prioridade ainda pendentes

### Automação e Histórico

- [ ] **AUTO-01**: Sistema gera insights automaticamente toda semana (segunda-feira) para usuários business+ sem intervenção manual
- [ ] **AUTO-02**: Cron de geração semanal verifica se usuário já gerou insights nos últimos 6 dias antes de chamar a IA (deduplicação)
- [ ] **HIST-01**: Usuário pode navegar por gerações passadas de insights via seletor de datas na página de insights
- [ ] **HIST-02**: Usuário pode comparar insights de duas gerações diferentes lado a lado

### Integrações de Monitoramento

- [ ] **ALERT-01**: Sistema gera automaticamente um insight de diagnóstico quando um alerta crítico é criado para uma loja do usuário
- [ ] **ALERT-02**: Sistema limita a geração de insights por alerta crítico a no máximo 1 por loja a cada 4 horas (prevenção de call storm)

### Export e Compartilhamento

- [ ] **EXPORT-01**: Usuário business+ pode exportar um insight completo como arquivo PDF
- [ ] **SHARE-01**: Usuário agency pode gerar um link público compartilhável de um insight com data de expiração
- [ ] **SHARE-02**: Visitante sem conta pode visualizar um insight compartilhado via link público (sem PII do usuário exposta)
- [ ] **SHARE-03**: Usuário pode revogar um link compartilhável a qualquer momento

### Chat com Dados

- [ ] **CHAT-01**: Usuário business+ pode fazer perguntas em linguagem natural sobre os dados da sua loja via interface de chat
- [ ] **CHAT-02**: Chat responde com contexto dos dados reais da loja (pedidos, produtos, alertas, insights existentes)
- [ ] **CHAT-03**: Sistema limita o número de mensagens de chat por dia por tier (business: 10/dia, agency: 30/dia)
- [ ] **CHAT-04**: Usuário vê contador de mensagens restantes no dia na interface de chat

---

## Future Requirements (deferred)

- Persistência de histórico de chat entre sessões / reloads de página
- Benchmark comparativo entre lojas do mesmo segmento
- Insights em linguagem natural automáticos (não só por alerta)
- Export em outros formatos (Excel, CSV)
- Chat com upload de contexto externo (ex: planilha de metas)

---

## Out of Scope

| Item | Razão |
|------|-------|
| Migração do campo legado `plan` para `subscription_tier` | Tech debt, não é feature de valor — deferir |
| Migração Telegram de polling para webhook | Infraestrutura, não impacta UX da milestone |
| Mobile app / PWA | Fora do escopo de insights IA |
| Chat com IA de outros usuários / benchmarks | Risco de privacidade (LGPD), complexidade de consent |
| Chat com modelo diferente do Gemini 1.5 Flash | Projeto é Gemini-committed; multi-model adiciona manutenção sem benefício |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| ACT-01 | Phase 9 | pending |
| ACT-02 | Phase 9 | pending |
| ACT-03 | Phase 9 | pending |
| AUTO-01 | Phase 11 | pending |
| AUTO-02 | Phase 11 | pending |
| HIST-01 | Phase 10 | pending |
| HIST-02 | Phase 10 | pending |
| ALERT-01 | Phase 12 | pending |
| ALERT-02 | Phase 12 | pending |
| EXPORT-01 | Phase 13 | pending |
| SHARE-01 | Phase 13 | pending |
| SHARE-02 | Phase 13 | pending |
| SHARE-03 | Phase 13 | pending |
| CHAT-01 | Phase 14 | pending |
| CHAT-02 | Phase 14 | pending |
| CHAT-03 | Phase 14 | pending |
| CHAT-04 | Phase 14 | pending |
