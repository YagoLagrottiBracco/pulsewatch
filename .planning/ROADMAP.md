# Roadmap: PulseWatch

## Overview

PulseWatch é um SaaS de monitoramento de e-commerce para lojistas brasileiros. O roadmap evolui o produto desde a detecção de lojas offline até uma plataforma completa com inteligência, multi-usuário, white-label e API.

## Phases

- [x] **Phase 1: Reestruturação dos Planos** - Migrar tiers free/premium/ultimate → free/pro/business/agency com Stripe e landing page
- [ ] **Phase 2: Monitor de Checkout e Velocidade** - Detectar lojas online mas quebradas: checkout, velocidade e erros HTTP
- [ ] **Phase 3: Integrações Brasileiras** - Expandir para Mercado Livre, Shopee, Nuvemshop melhorada e gateways brasileiros
- [ ] **Phase 4: Inteligência e Relatórios** - Relatório semanal, dashboard comparativo, previsão de estoque e uptime/SLA
- [ ] **Phase 5: Multi-usuário e Times** - Equipes, convites, papéis e roteamento de alertas
- [ ] **Phase 6: Plano Agência e White-label** - Dashboard multi-cliente, workspace por cliente e white-label
- [ ] **Phase 7: Automações e API** - Webhooks, status page pública, janelas de manutenção e API pública
- [ ] **Phase 8: Crescimento e Retenção** - Onboarding, programa de indicação, upsell e NPS

## Phase Details

### Phase 1: Reestruturação dos Planos
**Goal**: Migrar estrutura de planos free/premium/ultimate para free/pro/business/agency com todos os gates, limites, Stripe e landing page atualizados.
**Depends on**: Nothing (first phase)
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. subscription_tier aceita valores free, pro, business, agency no banco
  2. Stripe checkout cria assinaturas nos planos corretos
  3. Landing page exibe tabela de preços atualizada
  4. Trial periods: pro/business 7 dias, agency 14 dias
**Plans**: TBD

### Phase 2: Monitor de Checkout e Velocidade
**Goal**: Detectar lojas "online mas quebradas" — o maior gap do produto atual. Implementar monitor de checkout, velocidade e erros HTTP com gate pro+.
**Depends on**: Phase 1
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Monitor de velocidade mede response time e cria alerta LOJA_LENTA quando > threshold configurável
  2. Monitor de erros detecta 4xx/5xx na home e cria alerta ERRO_PAGINA
  3. Monitor de checkout verifica URL de cart/checkout e cria alerta CHECKOUT_OFFLINE
  4. Todos os monitores avançados são gate-checked (apenas pro, business, agency)
  5. UI da loja tem seção "Monitores Avançados" com toggle e threshold configurável
  6. Thresholds são persistidos por loja no banco de dados
**Plans**: TBD

### Phase 3: Integrações Brasileiras
**Goal**: Expandir além de Shopify/WooCommerce para plataformas dominantes no Brasil e monitorar gateways de pagamento.
**Depends on**: Phase 2
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Integração com Mercado Livre via OAuth + API para listagens e reputação
  2. Integração com Shopee para produtos e pedidos
  3. Monitoramento de gateways: Pix, PagSeguro, Mercado Pago, Cielo
  4. Gate: business+
**Plans**: TBD

### Phase 4: Inteligência e Relatórios
**Goal**: Transformar dados de monitoramento em inteligência acionável com relatórios automáticos e dashboards.
**Depends on**: Phase 3
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Email semanal automático com uptime %, alertas e comparativo (gate: pro+)
  2. Dashboard com comparativo "hoje vs semana passada"
  3. Previsão de estoque "produto X zera em ~N dias" (gate: business+)
  4. Contador de uptime/SLA mensal com histórico de incidentes
**Plans**: TBD

### Phase 5: Multi-usuário e Times
**Goal**: Permitir que equipes usem o PulseWatch juntas com papéis, convites e roteamento de alertas.
**Depends on**: Phase 4
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Tabela account_members com owner/manager/viewer
  2. Convite por email funcional
  3. Roteamento de alertas por membro
  4. Log de reconhecimento de alertas
  5. Gate: business+ (3 usuários), agency (ilimitado)
**Plans**: TBD

### Phase 6: Plano Agência e White-label
**Goal**: Capturar segmento de agências com dashboard multi-cliente, workspaces isolados e white-label.
**Depends on**: Phase 5
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Dashboard consolidado de todos os clientes da agência
  2. Workspace por cliente isolado
  3. Logo, cores e domínio customizável
  4. Portal do cliente (link read-only)
  5. Gate: agency apenas
**Plans**: TBD

### Phase 7: Automações e API
**Goal**: Permitir integrações com ferramentas externas via webhooks e API pública.
**Depends on**: Phase 6
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Webhooks próprios compatíveis com n8n/Zapier/Make (gate: business+)
  2. Página de status pública com uptime em tempo real (gate: pro+)
  3. Janelas de manutenção agendáveis
  4. API documentada (gate: agency)
**Plans**: TBD

### Phase 8: Crescimento e Retenção
**Goal**: Aumentar conversão free→pago e reduzir churn com onboarding, indicações e upsell contextual.
**Depends on**: Phase 7
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. Onboarding gamificado com progress bar e trial estendido por ações
  2. Programa de indicação com cupons rastreáveis
  3. Email de reengajamento para free inativo há 7 dias
  4. Modal de upsell contextual ao tentar feature bloqueada
  5. NPS automático 30 dias após assinar
**Plans**: TBD
