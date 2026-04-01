# Phase 9: Rastreamento de Ações - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 09-rastreamento-de-ações
**Areas discussed:** Schema de status, Card "O que fazer hoje", Interação de status, Atualização em tempo real

---

## Schema de Status

| Option | Description | Selected |
|--------|-------------|----------|
| Nova tabela `recommendation_actions` | insight_id FK, rec_index INTEGER, status TEXT, updated_at — consultas limpas, suporta histórico futuro | ✓ |
| JSONB no `ai_insights` | Campo `action_statuses JSONB` na tabela existente — sem nova tabela, mas update parcial de JSONB | |

**User's choice:** Nova tabela (Recomendado)

---

## Schema — Tratamento de Status Padrão

| Option | Description | Selected |
|--------|-------------|----------|
| Sem linha = pendente | Row não existe → implicitamente 'pending'; insere só na 1ª mudança | ✓ |
| Inserir todas ao gerar | Criar linhas pending para todas as recomendações no momento da geração | |

**User's choice:** Sem linha = pendente (Recomendado)

---

## Card "O que fazer hoje" — Posição

| Option | Description | Selected |
|--------|-------------|----------|
| Topo da página | Card fixo no início, acima dos insight cards | ✓ |
| Sidebar ou coluna lateral | Layout 2 colunas com card fixo à direita | |

**User's choice:** Topo da página (Recomendado)

---

## Card "O que fazer hoje" — Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Próximas 3 pendentes | Auto-recarrega com próximas 3 (alta → média) | ✓ |
| Estado vazio com parabéns | Mensagem de conclusão quando tudo feito | |

**User's choice:** Próximas 3 pendentes (Recomendado)

---

## Card "O que fazer hoje" — Escopo

| Option | Description | Selected |
|--------|-------------|----------|
| Cross-store | Top 3 de todos os insights do usuário | ✓ |
| Por loja selecionada | Filtra pela loja ativa no dashboard | |

**User's choice:** Cross-store (Recomendado)

---

## Interação de Status — UI

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown por recomendação | Select com 4 opções: Pendente / Em Progresso / Concluída / Ignorada | ✓ |
| Botões de ação rápida | Botões inline: [✓ Concluir] [→ Em progresso] [× Ignorar] | |

**User's choice:** Dropdown por recomendação (Recomendado)

---

## Interação de Status — Contador

| Option | Description | Selected |
|--------|-------------|----------|
| Apenas concluídas | Conta só status='done'. Ex: "3/7 concluídas" | ✓ |
| Concluídas + ignoradas | Conta done + ignored como "resolvidas" | |

**User's choice:** Apenas concluídas (Recomendado)

---

## Atualização em Tempo Real

| Option | Description | Selected |
|--------|-------------|----------|
| Otimistic update local | Atualiza React state imediatamente, API em background | ✓ |
| Refetch após salvar | Aguarda API, depois busca dados atualizados | |
| Supabase Realtime | Websocket subscription — overkill para fase 9 | |

**User's choice:** Otimistic update local (Recomendado)

---

## Claude's Discretion

- Estrutura exata do endpoint de API para UPSERT de status
- RLS policies da nova tabela (seguir padrão existente)
- Debounce de updates rápidos

## Deferred Ideas

Nenhuma — discussão manteve escopo da fase.
