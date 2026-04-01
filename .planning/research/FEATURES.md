# Features Research: AI Insights Advanced — PulseWatch v1.1

**Domain:** B2B SaaS — AI-powered e-commerce monitoring, analytics, and insights
**Researched:** 2026-04-01
**Confidence:** MEDIUM (training data + codebase analysis; WebSearch unavailable)

---

## Context: What Already Exists

The existing AI insights system (shipped in v1.0) provides:
- Manual on-demand generation with a 6h rate limit
- 7 insight types via Gemini: sales_patterns, stock_forecast, product_recommendations, anomaly_detection, pricing_suggestions, performance_analysis, dropshipping_analysis
- Insight cards with findings / trends / risks / opportunities / recommendations (with priority: high/medium/low)
- Stats summary (total insights, avg confidence, recommendation count, high-priority count)
- Gated to business+ tier; paywall with upsell copy shown to lower tiers
- `ai_insights` and `insight_generation_log` tables with RLS

The 7 new features in v1.1 build on top of this foundation. None requires replacing existing infrastructure — all are additive.

---

## Table Stakes

Features that users of AI-powered SaaS tools expect. Absence makes the product feel unfinished compared to competitors (Klaviyo, Hotjar, Baremetrics, etc.).

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Action tracking on recommendations** (done / in-progress / dismissed) | Every B2B tool with "recommendations" shows whether the user acted on them. Without tracking, recommendations feel disposable and the product can't show ROI. | Medium | Requires new `recommendation_actions` table or `action_status` column on the JSONB recommendations array. Status transitions: `pending → in_progress → done` or `pending → dismissed`. Per-recommendation granularity, not per-insight. |
| **Scheduled auto-generation (weekly cron)** | Users won't manually click "Generate" every week after novelty wears off. Automated delivery is the baseline expectation for "intelligent" tools. | Low | Pattern already established: `/api/cron/weekly-report` + Vercel cron entry in `vercel.json`. A new `/api/cron/insights` route + `"0 11 * * 1"` (Monday 8h Brasília) is a straightforward addition. Must respect the 6h rate-limit by bypassing it for system-initiated calls (service role key, different code path). |
| **"What to do today" summary card** | Dashboards that surface 3-5 prioritized actions outperform full-list UIs for task completion. Users won't scroll through 7 insight cards every day. | Medium | Pulls top 3 `high`-priority recommendations across all current insights that haven't been marked `done` or `dismissed`. Displayed at the top of the insights page or dashboard. Depends on action tracking being implemented first. |
| **Insight history / timeline** | Without history, each generation overwrites context. Users want to see "last week we had X, now Y" — this is core to trend understanding. | Medium | Current table already stores `created_at`. History requires grouping by generation batch (add `generation_id UUID` to `ai_insights`) and displaying a timeline of past generations. Comparison between generations is additive. |

---

## Differentiators

Features that set PulseWatch apart from generic AI tools. Not expected at baseline, but they create "aha moments" and drive retention/upsell.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Insight triggered by critical alert** | Closes the loop between monitoring (PulseWatch's core) and intelligence. A store going offline or a checkout breaking triggers an immediate AI analysis, not just a ping notification. This is the unique intersection no pure-analytics tool has. | Medium | The `/api/cron/check-status` route already fires alerts with severity levels. The trigger needs to: detect severity=critical → call insight generation for that store (with `store_id` scope) → send the result via notification channel. Avoids the 6h rate limit for alert-triggered generation (different code path). Risk: Gemini API cost spike if stores go critical often. Mitigation: max 1 alert-triggered generation per store per 24h. |
| **Natural language chat with store data** | Most SaaS tools show pre-canned insights. Allowing "why did sales drop last Tuesday?" queries via Gemini turns PulseWatch into a business intelligence partner. This is the highest-value differentiator but also the most complex. | High | Requires: a chat interface (messages, input), a context-builder that assembles current store data as prompt context (orders, products, alerts), a Gemini conversational API call (multi-turn), and session/message persistence. Must be scoped to business+ tier. Gemini 1.5 Flash supports multi-turn via `startChat()`. Token usage grows with conversation length — need context window management. |
| **Export/share insights (PDF + shareable link)** | Agency users need to report to clients. PDF export and shareable links let them present AI analysis without giving clients dashboard access. This directly serves the agency tier, which is the highest-paying. | Medium | Two distinct sub-features: (1) PDF — use `@react-pdf/renderer` or `jspdf` on the server; render insight data as a structured PDF. (2) Shareable link — generate a public UUID-keyed token stored in `ai_insights` or a separate `shared_insights` table with expiry. The share page is a public route with no auth. |

---

## Anti-Features (Avoid)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Chat with unlimited context / no cost controls** | Gemini charges per token. A single user sending 50 messages per day with full store context (100 orders, 100 products) will cost significantly more than the subscription value. | Cap at N messages/day by tier (e.g., 10/day for business, 30/day for agency). Summarize context instead of appending raw JSON. Implement message count tracking. |
| **Alert-triggered insights with no throttle** | If a store is in a flapping state (goes offline/online repeatedly), it could trigger dozens of Gemini calls per hour. | Hard limit: 1 alert-triggered insight per `store_id` per 24h. Check this before invoking the AI service. |
| **PDF generation on the client** | Client-side PDF libraries (jsPDF used in browser) are unreliable, large bundles, and produce poor layout. | Generate PDFs as a server-side API route (`/api/insights/export/[id]`) that returns a binary response. Use `@react-pdf/renderer` (server-side) or a headless browser approach. |
| **Real-time streaming for chat responses** | Streaming (SSE/websockets) for chat adds significant infrastructure complexity for a B2B tool where responses are 2-5 seconds. | Use standard `POST` with loading state. Return complete response. Users tolerate 3s waits for substantive answers. |
| **Comparing insights across users / benchmarks** | Would require sharing data between accounts — privacy risk, complex consent flows, and misleading comparisons between different store sizes. | Keep insights always scoped to the user's own data. |
| **History that deletes old insights automatically** | Current schema has `expires_at = NOW() + 30 days`. Auto-deletion breaks history view if users expect to scroll back. | For history/timeline features, increase `expires_at` to 180 days for business+ tier, or remove expiry on historical batches. |

---

## UX Patterns

Concrete patterns observed in comparable B2B SaaS tools (Baremetrics, Klaviyo, ChartMogul, Intercom).

### Action Tracking on Recommendations

**Pattern: Inline status toggle on recommendation cards**
- Each recommendation card shows a dropdown or button group: `Pendente / Em Progresso / Concluído / Ignorado`
- Status persists visually with color coding: pending=gray, in_progress=blue, done=green, dismissed=muted/strikethrough
- Dismissed items collapse (still accessible via "show dismissed" toggle)
- Stats card ("Recomendações") updates to show `X concluídas / Y pendentes`
- Optimistic UI: update state immediately, rollback on API error

**Pattern: Progress indicator on insight card header**
- Show a small `3/7 concluídas` pill on each insight card header so users see completion at a glance without opening the full card
- This is the same pattern Notion and Linear use for project progress

### "What to Do Today" Card

**Pattern: Pinned action card above the insights list**
- Card title: "Ações de Hoje" or "Prioridades da Semana"
- Shows 3 items max: icon, recommendation title, source insight type, priority badge
- Each item has a quick "Marcar como feito" button (one-click, no modal)
- If all 3 items are done: show congratulatory empty state ("Todas as ações concluídas!") — this is a retention/habit loop pattern
- If no high-priority items exist: show a softer "Nenhuma ação urgente" state
- Dismissed recommendations are excluded

**Dependency:** Requires action tracking to know what's still pending.

### Insight History Timeline

**Pattern: Generation batch selector (not infinite scroll)**
- At the top of the insights page, show a date picker or segmented selector showing past generation dates: "Hoje", "28/03", "21/03", etc.
- Selecting a date loads insights from that batch (filtered by `generation_id` or `created_at` date bucket)
- Comparison pattern: "Comparar com geração anterior" expands a diff view — e.g., "Antes: 12 produtos com baixo estoque | Agora: 8" (delta display)
- This is similar to Baremetrics' "compare periods" and ChartMogul's snapshot comparison

**Pattern: Timeline sidebar (for power users)**
- A collapsible left panel listing all past generation batches with date + count of insights
- Click a batch to load it in the main area

### Chat Interface

**Pattern: Drawer/panel, not full page**
- Chat lives in a side drawer or bottom panel, not a dedicated page — users want to see their insights and ask questions about them simultaneously
- This is the pattern Intercom, Notion AI, and Linear's AI use
- Mobile: full-screen sheet

**Pattern: Pre-suggested questions**
- Show 3-4 suggested questions when chat is empty: "Por que minhas vendas caíram?", "Qual produto devo repor urgente?", "O que está causando mais alertas?"
- This reduces blank-page paralysis and teaches users what the feature can do
- Remove suggestions once first message is sent

**Pattern: Context source attribution**
- Below each AI response, show a small "Baseado em: 87 pedidos, 34 produtos, 12 alertas" — this builds trust and explains why the answer might be limited
- Gemini response quality degrades with stale/incomplete data — transparency prevents frustration

**Pattern: Message limit indicator**
- Show "8/10 mensagens restantes hoje" in the chat header
- When limit is reached: inline upsell nudge for agency tier

### Export/Share

**Pattern: Two-button export header**
- On the insights page header: "Exportar PDF" (primary) + "Compartilhar link" (secondary) buttons
- PDF export: show a loading state, then trigger file download. Include: header with PulseWatch logo + store name + date, all insight cards, recommendations with priority badges
- Shared link: copy-to-clipboard button with toast confirmation. Show expiry date ("Link válido por 7 dias"). The public share page is a minimal read-only version of the insights page — no sidebar, no auth, PulseWatch branding

---

## Feature Dependencies

```
action_tracking_on_recommendations
  → required by: "what to do today" card (needs pending/done status)
  → required by: stats showing completion rates

weekly_cron_auto_generation
  → no dependencies on v1.1 features
  → depends on existing: /api/insights/generate, CRON_SECRET auth pattern
  → enables: insight_history_timeline (more batches = richer history)

what_to_do_today_card
  → depends on: action_tracking_on_recommendations

insight_history_timeline
  → depends on: generation_id column added to ai_insights
  → benefits from: weekly_cron_auto_generation (creates more historical batches)

insight_triggered_by_critical_alert
  → depends on: existing alert severity system (check-status cron)
  → independent of other v1.1 features
  → note: needs throttle guard (1 per store per 24h) to prevent cost explosion

export_share_insights
  → independent of other v1.1 features
  → PDF quality improves if action statuses are shown (depends on action_tracking)
  → for agency tier: shareable links are the primary use case

chat_with_store_data
  → no hard dependencies on other v1.1 features
  → benefits from: existing ai_insights data as context
  → most independent, can be built in isolation
  → highest complexity; build last to de-risk milestone
```

**Recommended build order based on dependencies and risk:**
1. `action_tracking` (enables "what to do today"; low risk; clear DB schema)
2. `what_to_do_today_card` (immediate UX payoff; depends on #1)
3. `weekly_cron_auto_generation` (low complexity; established pattern; enables history)
4. `insight_history_timeline` (requires generation_id migration; moderate complexity)
5. `insight_triggered_by_critical_alert` (bridges monitoring+AI; moderate; needs throttle)
6. `export_share_insights` (valuable for agency tier; medium complexity; no blockers)
7. `chat_with_store_data` (highest complexity + cost; build last; isolated feature)

---

## Tier Gating Recommendations

| Feature | Tier Gate | Rationale |
|---------|-----------|-----------|
| Action tracking | business+ (same as insights) | Part of existing insights gate; no separate gate needed |
| Weekly auto-generation | business+ | Same gate as manual generation |
| "What to do today" | business+ | Depends on action tracking |
| Insight history | business+ | Additive to current insights |
| Alert-triggered insights | business+ | Same tier as insights |
| PDF export | business+ | Adds value to existing feature |
| Shareable link | agency only | Primary value is for agency → client reporting workflow |
| Chat with data | business+ (with message cap) | business: 10 messages/day; agency: 30 messages/day |

---

## Cost Surface

The three features that create meaningful Gemini API cost exposure:

| Feature | Cost Driver | Mitigation |
|---------|-------------|------------|
| Weekly auto-generation | N users * 7 insight types * weekly = high volume | Batch per user, dedup if recent manual generation exists (skip if last generation < 48h ago) |
| Alert-triggered insights | Potentially many triggers per day | Max 1 per store per 24h, hard stop |
| Chat | Token count grows with conversation history | Summarize context to <500 tokens, cap messages/day, clear session after 24h |

---

## Sources

- Codebase analysis: `src/services/ai-insights.ts`, `src/app/dashboard/insights/page.tsx`, `src/app/api/insights/`, `supabase/migrations/20250118000000_create_ai_insights_system.sql` — HIGH confidence
- Pattern analysis: Baremetrics, Klaviyo, Intercom, Linear AI, Notion AI UX conventions — MEDIUM confidence (training data, no live verification)
- Cost estimates: Gemini 1.5 Flash pricing from training data — LOW confidence (verify before shipping chat feature)
