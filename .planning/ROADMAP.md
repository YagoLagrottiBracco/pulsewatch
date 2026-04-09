# Roadmap: PulseWatch

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-03-31)
- 🔄 **v1.1 Insights IA Avançado** — Phases 9-14 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-8) — SHIPPED 2026-03-31</summary>

- [x] Phase 1: Reestruturação dos Planos — Migrar tiers free/pro/business/agency com Stripe e landing page
- [x] Phase 2: Monitor de Checkout e Velocidade — Detectar lojas online mas quebradas: checkout, velocidade e erros HTTP
- [x] Phase 3: Integrações Brasileiras — Expandir para Mercado Livre, Shopee, Nuvemshop melhorada e gateways brasileiros
- [x] Phase 4: Inteligência e Relatórios — Relatório semanal, dashboard comparativo, previsão de estoque e uptime/SLA
- [x] Phase 5: Multi-usuário e Times — Equipes, convites, papéis e roteamento de alertas
- [x] Phase 6: Plano Agência e White-label — Dashboard multi-cliente, workspace por cliente e white-label
- [x] Phase 7: Automações e API — Webhooks, status page pública, janelas de manutenção e API pública
- [x] Phase 8: Crescimento e Retenção — Onboarding gamificado, indicações, reengajamento, upsell e NPS

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### v1.1 Insights IA Avançado (Phases 9-14)

- [ ] **Phase 9: Rastreamento de Ações** — Usuário acompanha progresso nas recomendações e vê o que fazer hoje
- [ ] **Phase 10: Histórico de Insights** — Usuário navega e compara gerações passadas de insights
- [ ] **Phase 11: Geração Automática Semanal** — Sistema gera insights automaticamente toda semana sem intervenção manual
- [ ] **Phase 12: Insight por Alerta Crítico** — Sistema dispara diagnóstico de IA automaticamente quando um alerta crítico ocorre
- [ ] **Phase 13: Export e Compartilhamento** — Usuário exporta insights como PDF e compartilha via link público
- [ ] **Phase 14: Chat com Dados** — Usuário faz perguntas em linguagem natural sobre os dados da sua loja

---

## Phase Details

### Phase 9: Rastreamento de Ações
**Goal**: Usuário pode acompanhar o progresso das recomendações de IA e ver um resumo das 3 ações mais importantes do dia
**Depends on**: Phase 8 (existing AI insights system)
**Requirements**: ACT-01, ACT-02, ACT-03
**Success Criteria** (what must be TRUE):
  1. Usuário pode alterar o status de cada recomendação individual para pendente, em progresso, concluída ou ignorada
  2. Cada insight card exibe um contador "X/Y concluídas" no header, atualizado em tempo real ao marcar recomendações
  3. Usuário vê um card "O que fazer hoje" na página de insights com as 3 recomendações de alta prioridade ainda pendentes
  4. O card "O que fazer hoje" se atualiza automaticamente à medida que o usuário conclui ou ignora recomendações
**Plans**: TBD
**UI hint**: yes

### Phase 10: Histórico de Insights
**Goal**: Usuário pode navegar pelo histórico de gerações de insights e comparar dois períodos lado a lado
**Depends on**: Phase 9 (action statuses enrich history view)
**Requirements**: HIST-01, HIST-02
**Success Criteria** (what must be TRUE):
  1. Usuário vê um seletor de datas ou lista de gerações anteriores na página de insights
  2. Ao selecionar uma geração passada, os insights daquele período são exibidos corretamente
  3. Usuário pode selecionar duas gerações diferentes e visualizá-las lado a lado para comparação
  4. A geração atual permanece claramente identificada e acessível mesmo durante a navegação no histórico
**Plans**: TBD
**UI hint**: yes

### Phase 11: Geração Automática Semanal
**Goal**: Insights são gerados automaticamente toda segunda-feira para usuários business+ sem nenhuma ação manual
**Depends on**: Phase 10 (historical batches populate timeline already built)
**Requirements**: AUTO-01, AUTO-02
**Success Criteria** (what must be TRUE):
  1. Usuários business+ recebem uma nova geração de insights toda segunda-feira sem clicar em "Gerar"
  2. O cron não dispara uma nova geração se o usuário já gerou insights nos últimos 6 dias (deduplicação visível no histórico)
  3. Gerações automáticas aparecem no histórico de insights identificadas como "geração automática"
  4. Usuários que não são business+ não recebem gerações automáticas
**Plans**: TBD

### Phase 12: Insight por Alerta Crítico
**Goal**: Sistema gera automaticamente um diagnóstico de IA quando um alerta crítico é detectado, fechando o loop entre monitoramento e inteligência
**Depends on**: Phase 11 (generation infrastructure established; alert-triggered reuses same path)
**Requirements**: ALERT-01, ALERT-02
**Success Criteria** (what must be TRUE):
  1. Quando uma loja do usuário gera um alerta crítico, um insight de diagnóstico aparece automaticamente na página de insights
  2. O insight gerado por alerta é identificado como "disparado por alerta" e referencia o alerta que o originou
  3. Se uma loja disparar múltiplos alertas críticos em menos de 4 horas, apenas um insight é gerado — não há duplicatas
  4. A geração do insight por alerta não causa lentidão ou timeout no cron de check-status existente
**Plans**: TBD

### Phase 13: Export e Compartilhamento
**Goal**: Usuário pode exportar um insight completo como PDF e gerar links públicos para compartilhar com clientes sem expor acesso ao dashboard
**Depends on**: Phase 9 (PDF optionally includes action statuses for agency reporting)
**Requirements**: EXPORT-01, SHARE-01, SHARE-02, SHARE-03
**Success Criteria** (what must be TRUE):
  1. Usuário business+ pode baixar um insight como arquivo PDF com todas as recomendações e dados de análise
  2. Usuário agency pode gerar um link público com data de expiração que permite visualizar o insight sem login
  3. Visitante que acessa o link público vê o insight completo sem nenhum dado pessoal do proprietário da conta (PII) exposto
  4. Usuário pode revogar qualquer link compartilhável ativo a qualquer momento, tornando-o imediatamente inacessível
  5. Tentativa de acesso a link expirado ou revogado resulta em resposta de "link não disponível" (não em erro 404 genérico)
**Plans**: TBD
**UI hint**: yes

### Phase 14: Chat com Dados
**Goal**: Usuário business+ pode fazer perguntas em linguagem natural sobre os dados da sua loja e receber respostas contextualizadas geradas por IA
**Depends on**: Phase 11, Phase 12 (rich history of insights available as context), Phase 13 (complete milestone near-ship)
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04
**Success Criteria** (what must be TRUE):
  1. Usuário business+ abre um painel de chat na página de insights e faz perguntas como "Por que meu checkout falhou ontem?" recebendo resposta baseada nos dados reais da loja
  2. As respostas do chat referenciam dados concretos da loja (alertas recentes, produtos, insights anteriores) — não respostas genéricas
  3. Usuário vê claramente quantas mensagens de chat ainda pode enviar no dia (business: 10/dia, agency: 30/dia)
  4. Ao atingir o limite diário, usuário recebe mensagem explicativa e não consegue enviar novas perguntas até o dia seguinte
  5. Respostas do chat chegam em streaming (texto aparece progressivamente), sem timeout visível ao usuário
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Reestruturação dos Planos | v1.0 | — | ✅ Complete | 2025-12 |
| 2. Monitor de Checkout e Velocidade | v1.0 | — | ✅ Complete | 2026-03-30 |
| 3. Integrações Brasileiras | v1.0 | — | ✅ Complete | 2026-03-30 |
| 4. Inteligência e Relatórios | v1.0 | — | ✅ Complete | 2026-03 |
| 5. Multi-usuário e Times | v1.0 | — | ✅ Complete | 2026-03 |
| 6. Plano Agência e White-label | v1.0 | — | ✅ Complete | 2026-03 |
| 7. Automações e API | v1.0 | — | ✅ Complete | 2026-03 |
| 8. Crescimento e Retenção | v1.0 | — | ✅ Complete | 2026-03-31 |
| 9. Rastreamento de Ações | v1.1 | 0/? | Not started | - |
| 10. Histórico de Insights | v1.1 | 2/3 | In Progress|  |
| 11. Geração Automática Semanal | v1.1 | 0/? | Not started | - |
| 12. Insight por Alerta Crítico | v1.1 | 0/? | Not started | - |
| 13. Export e Compartilhamento | v1.1 | 0/? | Not started | - |
| 14. Chat com Dados | v1.1 | 0/? | Not started | - |
