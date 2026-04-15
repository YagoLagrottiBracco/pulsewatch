# Requirements — Milestone v1.1

## Insights IA (continuação)

- [x] **INS-01**: Sistema gera insights automaticamente toda segunda-feira para lojas de usuários business+
- [x] **INS-02**: Geração automática é deduplicada — não gera se já gerou nos últimos 6 dias
- [x] **INS-03**: Gerações automáticas aparecem no histórico com label "geração automática"
- [x] **INS-04**: Gate de tier: apenas business+ recebe geração automática

## Alertas e UX

- [x] **ALERT-01**: Ao visualizar um alerta crítico, usuário vê card "O que fazer agora" com checklist específico por tipo de problema
- [x] **ALERT-02**: Checklist cobre os tipos: loja offline, estoque zerado, estoque baixo, queda de vendas
- [x] **ALERT-03**: Card é contextual ao tipo do alerta — não genérico

## Landing Page

- [x] **LAND-01**: Landing page exibe calculadora interativa de perdas por downtime
- [x] **LAND-02**: Calculadora aceita faturamento mensal como input e calcula perda estimada por hora de downtime
- [x] **LAND-03**: Calculadora exibe também impacto de queda de 20% nas vendas
- [x] **LAND-04**: Widget é visualmente consistente com o design system existente

## Exportação de Dados

- [x] **EXP-01**: Usuário pode exportar alertas filtrados por período em CSV
- [x] **EXP-02**: Usuário pode exportar dados de analytics (vendas, uptime) em CSV
- [x] **EXP-03**: Exportação é gerada client-side (sem dependência de biblioteca externa)

## Times e Atividade

- [ ] **TEAM-01**: Owner visualiza feed de atividade com ações de cada membro (visualizou alerta, arquivou, adicionou nota)
- [ ] **TEAM-02**: Ações são registradas automaticamente ao interagir com alertas
- [ ] **TEAM-03**: Feed exibe nome do membro, ação realizada e timestamp

## Future Requirements (deferred)

- Wizard de onboarding por plataforma (F02)
- Página de status pública por loja (F03)
- Timeline visual de incidentes (F04)
- Métricas de negócio no admin (F06)
- Alertas SSE em tempo real (F01)
- Push notifications PWA (F09)
- White-label para agências (F08)
- SLA configurável por loja (F11)
- Ranking comparativo entre lojas (F12)

## Out of Scope (v1.1)

- App mobile nativo — fora da stack atual
- WebSocket/SSE (F01) — tamanho G, milestone futuro
- White-label (F08) — tamanho G, milestone futuro

## Traceability

| REQ-ID | Phase |
|---|---|
| INS-01..04 | Phase 11 |
| ALERT-01..03 | Phase 12 |
| LAND-01..04 | Phase 13 |
| EXP-01..03 | Phase 14 |
| TEAM-01..03 | Phase 15 |
