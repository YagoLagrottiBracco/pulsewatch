# Research Summary — v1.1 Insights IA Avançado

**Synthesized:** 2026-04-01
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

PulseWatch v1.1 adds 7 advanced AI features on top of the existing Gemini-powered insight system shipped in v1.0. All 7 features are purely additive — no existing tables are dropped or altered destructively, and no existing services need to be replaced. The new capabilities fall into two categories: depth features (action tracking, "what to do today" card, history timeline, scheduled auto-generation) that make the existing AI insights stickier and more useful, and premium features (alert-triggered insights, export/share, natural language chat) that create upsell leverage and differentiate PulseWatch from generic analytics tools.

The stack additions are minimal: 3 new packages (`ai@4.3.19`, `@ai-sdk/google@3.0.55`, `@react-pdf/renderer@4.3.2`) plus a minor zod bump. All other features reuse existing infrastructure (Vercel Cron, Supabase, Gemini SDK, recharts). The architecture is schema-first: 3 new tables and 1 new nullable column are the structural foundation for 6 of the 7 features, with the 7th (history timeline) requiring zero schema changes.

The primary risks are cost and timeout related, not technical. Unconstrained chat context, alert-triggered generation without throttling, and sequential Gemini calls in a weekly cron are the three scenarios that can create runaway costs or silent failures. Each has a well-defined prevention strategy documented in PITFALLS.md. Building in the recommended order de-risks the milestone by saving the highest-complexity feature (chat) for last, after simpler features have validated the new infrastructure.

---

## Stack Additions

| Package | Version | Purpose |
|---------|---------|---------|
| `ai` | `^4.3.19` | Vercel AI SDK — `streamText`, `StreamingTextResponse`, `toDataStreamResponse()` for chat streaming in Next.js Route Handlers; pinned to v4 for React 18 / Next.js 14 compatibility (v6 requires incompatible zod v4) |
| `@ai-sdk/google` | `^3.0.55` | Official Gemini provider for AI SDK; wraps `@google/generative-ai` with streaming-first API; coexists with existing raw SDK used in `ai-insights.ts` batch generation |
| `@react-pdf/renderer` | `^4.3.2` | Server-side PDF generation via `renderToBuffer()`; pure JavaScript with no Chromium binary; Vercel-safe (4MB vs Puppeteer's ~300MB); uses Yoga layout engine with `<Document>/<Page>/<View>/<Text>` primitives |

**Also required:** `zod` bump from `^3.22.4` to `^3.23.8` (peer requirement of `ai@4.3.19`; minor semver, no breaking changes).

**Install command:**
```bash
npm install ai@4.3.19 @ai-sdk/google@3.0.55 @react-pdf/renderer@4.3.2 zod@^3.23.8
```

**Not added (and why):** `puppeteer` (exceeds 250MB Vercel limit), `langchain` (50+ transitive deps for a use case covered by 3 packages), `ai@6` (requires zod v4, breaks existing stack), `socket.io`/`pusher` (Web Streams API via AI SDK is sufficient for chat).

---

## Feature Table Stakes

Features users expect from any AI-powered B2B SaaS. Absence makes PulseWatch feel unfinished compared to Klaviyo, Baremetrics, Intercom.

| Feature | Why Non-Negotiable | Implementation Notes |
|---------|-------------------|----------------------|
| **Action tracking on recommendations** (done / in-progress / dismissed / ignored) | Every B2B tool with recommendations tracks whether users acted on them. Without tracking, recommendations are disposable and the product cannot demonstrate ROI. | New `recommendation_actions` table; status per `(insight_id, rec_index)`; never mutate the `recommendations` JSONB column |
| **Scheduled weekly auto-generation** | Users won't manually click "Generate" after novelty wears off. Automated delivery is the baseline for any "intelligent" tool. | New `/api/cron/insights-weekly` route + `vercel.json` cron entry; skip if last generation < 6 days ago; explicit rate limit check per user |
| **"What to do today" summary card** | Dashboards that surface 3-5 prioritized actions outperform full-list UIs for task completion. | Computed query over `ai_insights` + `recommendation_actions`; top 3 pending/in-progress by priority; requires action tracking first |
| **Insight history / timeline** | Without history, each generation overwrites context. Users expect to see trends over time, not just the latest snapshot. | Frontend-only change against existing `ai_insights.created_at`; add `generation_source` field to API response; group by generation batch |

---

## Feature Differentiators

Features that create retention and upsell leverage. Not expected at baseline but produce "aha moments".

| Feature | Upsell / Retention Value | Implementation Notes |
|---------|--------------------------|----------------------|
| **Insight triggered by critical alert** | Closes the unique loop between monitoring (PulseWatch's core) and intelligence that no pure-analytics tool offers. A checkout breaking triggers immediate AI analysis, not just a ping. | `triggerInsightForCriticalAlert()` helper called inside `createAndNotifyAlert()`; 1-alert-triggered insight per store per 4 hours (hard throttle); lighter prompt focused on the specific alert |
| **Export / share insights (PDF + shareable link)** | Agency tier's primary value: report to clients without giving dashboard access. Shareable links directly justify the agency price point. | PDF: `@react-pdf/renderer` server-side at `/api/insights/[id]/export/pdf`; Share: `insight_share_tokens` table with cryptographic token, expiry enforced at DB level; public route `/api/share/[token]` with no PII |
| **Natural language chat with store data** | Turns PulseWatch into a BI partner. "Why did sales drop last Tuesday?" via Gemini is the highest-value differentiator — no pre-canned insight competes with free-form query. | AI SDK streaming route `/api/insights/chat`; conversation history capped at 10 turns; per-user daily message cap (business: 10, agency: 30); Edge Runtime for streaming timeout; `chat_messages` table for session persistence |

**Tier gating summary:** All v1.1 features gate at `business+`. Shareable links gate at `agency only`. Chat has daily message caps by tier.

---

## Architecture Highlights

### Schema Changes (all backwards-compatible)

| Change | Type | Key Details |
|--------|------|-------------|
| `recommendation_actions` table | New | `(insight_id, rec_index, user_id, status, note)`; index on `(user_id, status)` for "today" query |
| `insight_share_tokens` table | New | `token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url')`, `expires_at TIMESTAMPTZ` with RLS enforcement |
| `chat_messages` table | New | `(session_id, role, content)`; session_id is client-generated UUID; cap at 20 turns per session |
| `ai_insights.triggered_by_alert_id` | New nullable column | `UUID REFERENCES alerts(id) ON DELETE SET NULL`; NULL = manual or cron; distinguishes generation source |

No existing columns are altered or dropped. No existing indexes are affected.

### New Routes

| Route | Method | Feature |
|-------|--------|---------|
| `/api/insights/[id]/recommendations/[index]` | PATCH | Action tracking — upsert status |
| `/api/insights/actions/today` | GET | "What to do today" — top 3 pending by priority |
| `/api/cron/insights-weekly` | GET | Weekly auto-generation cron |
| `/api/insights/[id]/share` | POST | Generate share token |
| `/api/insights/[id]/export/pdf` | GET | Stream PDF binary |
| `/api/share/[token]` | GET | Public share view (no auth) |
| `/api/insights/chat` | POST | Streaming chat (Edge Runtime) |

### Key Build Rules

1. Schema migrations before API routes before UI — never invert this order.
2. The `check-status/route.ts` integration for alert-triggered insights must be fire-and-forget (`Promise.resolve().then(...)`) — never `await` in the hot 10-minute cron path.
3. Chat route must use Edge Runtime (`export const runtime = 'edge'`) to avoid the 60s serverless timeout on streaming responses.
4. The existing `ai-insights.ts` direct Gemini usage (batch generation) and the new AI SDK chat route coexist. Do not migrate batch generation to AI SDK — it does not benefit from streaming.
5. The PDF component file must be kept outside client component modules — `@react-pdf/renderer` uses its own Yoga reconciler.

### Modified Existing Files

- `src/services/ai-insights.ts` — add `generateInsightForAlert()` and `generateChatResponse()` methods
- `src/app/api/cron/check-status/route.ts` — one fire-and-forget call to `triggerInsightForCriticalAlert()` after critical alert creation
- `src/app/api/insights/route.ts` — add `generation_source` field, increase default limit to 50
- `src/app/dashboard/insights/page.tsx` — action controls, "today" card, timeline view, share/export buttons, chat panel
- `vercel.json` — add weekly insights cron entry

---

## Watch Out For

The top 5 pitfalls that will cause silent failures or unexpected costs if not addressed before shipping.

### 1. Weekly cron will time out processing multiple users sequentially

The current `aiInsightsService.generateInsights()` runs 7 sequential Gemini calls per user (~35s/user). A cron that loops over all business/agency users in a single invocation will hit Vercel's 60s limit after the first user and silently kill the rest.

**Prevention:** One user per invocation — the cron coordinator fans out to per-user jobs (queue table or staggered calls). Set `export const maxDuration = 300` on the cron route. Never add AI generation inside the existing `/api/cron/weekly-report` route.

### 2. Chat will produce runaway Gemini costs without context limits

Chat history grows quadratically — each message sends all prior turns. The existing `dataSummary` JSON (~2-5KB) in every prompt compounds this. No token budgeting exists in the current codebase.

**Prevention:** Cap conversation history to last 10 turns. Add `ai_usage` table (`user_id`, `date`, `tokens_used`) to instrument cost per user. Enforce daily message caps (10/day business, 30/day agency). Use `gemini-1.5-flash` only (never `pro`) for chat.

### 3. Alert-triggered generation will create Gemini call storms on flapping stores

A store that goes offline/online repeatedly can fire dozens of critical alerts per hour. Each would trigger a Gemini call, bypassing the 6-hour manual rate limit entirely.

**Prevention:** Hard throttle: 1 alert-triggered insight per store per 4 hours. Deduplicate by `(store_id, alert_type, last 4h)` before calling Gemini. Use a lighter focused prompt (not the full 7-type analysis).

### 4. PDF generation will silently fail on Vercel if built with Puppeteer

Puppeteer requires ~300MB Chromium binary which exceeds Vercel's 250MB function limit. It works locally but fails silently in deployment.

**Prevention:** Use only `@react-pdf/renderer` (4MB, pure JS, serverless-safe). Test PDF export on Vercel staging before building the full UI. Never install `puppeteer`, `playwright`, or `wkhtmltopdf` for this feature.

### 5. Share tokens using predictable values expose user business data

Tokens derived from insight IDs, user IDs, or timestamps are enumerable. A competitor could iterate tokens and read business metrics.

**Prevention:** Generate tokens as `crypto.randomBytes(32).toString('hex')` (or Supabase's `gen_random_bytes(24)` in SQL). Enforce expiry at the RLS level, not just application level. Return HTTP 410 Gone (not 404) for expired tokens. No PII in public share views.

---

## Recommended Build Order

Order is driven by: (a) feature dependencies, (b) risk profile (low-risk first), (c) value delivery cadence.

1. **Action tracking + "What to do today" card** — Build together; `recommendation_actions` table is the shared dependency; the "today" card is the immediate payoff that makes tracking feel worthwhile. Lowest risk. Clear schema. No external services.

2. **Insight history timeline** — Frontend-only change against existing data. Zero schema changes. Ships fast, validates the timeline UI before it becomes more complex in later phases.

3. **Scheduled weekly auto-generation** — Established Vercel cron pattern. No UI changes. Creates historical batches that enrich the timeline view already shipped. Must implement per-user batching and deduplication before enabling.

4. **Alert-triggered insights** — Bridges monitoring and AI (core PulseWatch differentiator). Requires the `triggered_by_alert_id` column migration. Must be fire-and-forget in the check-status hot path. Throttle guard is non-negotiable before shipping.

5. **Export / share (PDF + shareable link)** — Independent of all prior phases. High value for agency tier. PDF requires early Vercel staging validation. Shareable links require cryptographic token implementation from day one.

6. **Natural language chat** — Last because it has the highest complexity (streaming, Edge Runtime, session management, Gemini multi-turn), the highest cost exposure, and benefits from a rich history of insights already generated by phases 1-5. Building last also means the milestone can ship partial if chat runs over schedule.

---

## Open Questions

Decisions that must be made before or during implementation — not answered by research.

| Question | Impact | Who Decides |
|----------|--------|-------------|
| What is the maximum acceptable monthly Gemini cost per user at scale? | Determines chat message caps and whether to consolidate 7 insight types into fewer API calls | Product / Finance |
| Should weekly cron auto-generation be opt-in or opt-out for business+ users? | Opt-in = fewer surprise generations + costs; opt-out = better "set and forget" UX | Product |
| Should chat history persist across sessions (page reloads) or reset per session? | Persistence requires `chat_messages` DB reads on every chat open; stateless is simpler but worse UX | Product |
| What fields are safe to include in a shared insight public view? | Revenue numbers? Product names? Alert descriptions? — LGPD review needed if the product scales | Legal / Product |
| Should PDF export include recommendation action statuses (done/ignored)? | Better for agency reporting if yes; requires action tracking to be shipped first | Product |
| What should happen to alert-triggered insights if the user has already dismissed all recommendations from the previous alert-triggered insight? | De-duplicate or force new generation? | Product |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (packages, versions, compatibility) | HIGH | All versions verified against npm registry; peer deps checked; v4/v6 AI SDK distinction confirmed |
| Features (table stakes vs differentiators) | MEDIUM | Based on competitive analysis of Klaviyo, Baremetrics, Intercom from training data — no live product audit |
| Architecture (schema, routes, build order) | HIGH | Derived directly from codebase inspection; all existing tables and routes confirmed |
| Pitfalls (timeouts, costs, security) | HIGH | Vercel limits documented; Puppeteer serverless issue well-established; prompt injection is a known class |
| Gemini API pricing | MEDIUM | Flash pricing ~$0.075/1M input tokens as of early 2026 — verify current pricing before cost projections for chat |

**Overall: HIGH confidence on technical decisions. MEDIUM confidence on feature prioritization and cost projections.**

---

## Sources

- `src/services/ai-insights.ts` — existing Gemini service
- `src/app/api/insights/` — existing insight routes
- `src/app/api/cron/check-status/route.ts` — alert creation flow
- `src/app/dashboard/insights/page.tsx` — existing UI
- `supabase/migrations/20250118000000_create_ai_insights_system.sql` — existing schema
- `vercel.json` — existing cron configuration
- npm registry — `ai@4.3.19`, `@ai-sdk/google@3.0.55`, `@react-pdf/renderer@4.3.2` peer deps verified
- Vercel documentation — cron limits (Pro: 1 min interval, 100 jobs, 60s timeout)
- Competitive UX analysis — Baremetrics, Klaviyo, Intercom, Linear AI, Notion AI (training data, MEDIUM confidence)
