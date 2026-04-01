# Architecture Research: AI Insights Advanced Features (v1.1)

**Project:** PulseWatch
**Researched:** 2026-04-01
**Scope:** 7 new features integrating with existing AI Insights system

---

## Existing Architecture Baseline

Before prescribing changes, the confirmed current state:

- **Route for fetching insights:** `GET /api/insights` — queries `ai_insights` ordered by `created_at DESC`, returns `canGenerate` flag
- **Route for generating insights:** `POST /api/insights/generate` — rate-limited via Supabase RPC, calls `AIInsightsService`, saves to `ai_insights`
- **AI service:** `src/services/ai-insights.ts` — `AIInsightsService` class wraps Gemini 1.5 Flash; stateless, no conversation history
- **Alert creation:** `createAndNotifyAlert()` helper inside `check-status/route.ts` (lines 444-474) — inserts into `alerts` table then calls `sendNotifications()`
- **Cron infrastructure:** Vercel `vercel.json` declares two crons (`check-status` every 10min, `weekly-report` every Monday 11h UTC)
- **Frontend:** Single page at `src/app/dashboard/insights/page.tsx` — client component, fetches from `/api/insights`, renders tabs by `insight_type`
- **Auth pattern:** All protected routes use `createClient()` from `@/lib/supabase/server`, check `user.id`, gate on `subscription_tier`

**Key constraint:** `ai_insights` rows today have no status fields. Recommendations are stored as a JSONB array — individual items have no persistent identity (no `id` field inside the JSON objects). This is the core tension for Feature 1.

---

## Schema Changes

### 1. `recommendation_actions` (new table) — Feature 1 (Action Tracking)

A separate table is the correct choice over adding a column to `ai_insights`. Reasons:
- Each insight has N recommendations; a column would require updating the entire JSONB array atomically
- Actions need their own `created_at`, actor identity, and notes — that's row-level data
- Querying "all pending actions across insights" is a simple JOIN, not a JSON scan
- Backwards-compatible: `ai_insights` table unchanged

```sql
CREATE TABLE recommendation_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id    UUID NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
  rec_index     INTEGER NOT NULL,  -- position in recommendations JSONB array (0-based)
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in_progress', 'done', 'ignored')),
  note          TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for "what to do today" query (top pending actions by priority)
CREATE INDEX idx_rec_actions_user_status ON recommendation_actions(user_id, status);
CREATE INDEX idx_rec_actions_insight ON recommendation_actions(insight_id);
```

Note on `rec_index`: recommendations in JSONB have no stable `id`. Using array index is fragile only if the array is mutated — but `ai_insights.recommendations` is write-once (insert on generation, never updated). Array index is therefore stable and avoids adding an `id` field to each JSONB item.

Alternative rejected: Adding `action_status` as a JSONB column on `ai_insights` itself. Requires full-row updates for each status change; makes the "what to do today" query harder.

### 2. `ai_insights` — ADD `triggered_by` column (Feature 5: Alert-triggered)

```sql
ALTER TABLE ai_insights
  ADD COLUMN triggered_by_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL;
```

This is the only backwards-compatible change to `ai_insights`. Existing rows get `NULL` (insight was user-triggered or cron-triggered). The column distinguishes generation source.

### 3. `insight_share_tokens` (new table) — Feature 6 (Export/Share)

```sql
CREATE TABLE insight_share_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id UUID NOT NULL REFERENCES ai_insights(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  expires_at TIMESTAMPTZ,  -- NULL = never expires
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_tokens_token ON insight_share_tokens(token);
```

PDF generation is server-side (see API routes section) and does not require table storage — it streams a response. The token table is only for the shareable public link feature.

### 4. `chat_messages` (new table) — Feature 7 (Chat with Data)

```sql
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL,  -- client-generated UUID groups a conversation
  role        TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at);
CREATE INDEX idx_chat_user ON chat_messages(user_id, created_at DESC);
```

Session history is needed to pass prior turns as `history` to Gemini's chat API (`model.startChat({ history })`). Without persisting it, the conversation resets on page reload. Message count per session should be capped at 20 turns to bound Gemini context size.

### Summary of Schema Changes

| Change | Type | Backwards Compatible |
|--------|------|----------------------|
| `recommendation_actions` table | New table | Yes — no existing table changed |
| `ai_insights.triggered_by_alert_id` | New nullable column | Yes — existing rows = NULL |
| `insight_share_tokens` table | New table | Yes |
| `chat_messages` table | New table | Yes |

No existing columns are altered or dropped. No existing indexes are affected.

---

## New API Routes

### Feature 1 — Action Tracking

**`PATCH /api/insights/[id]/recommendations/[index]`**
- Auth: session cookie
- Body: `{ status: 'pending' | 'in_progress' | 'done' | 'ignored', note?: string }`
- Logic: Upsert into `recommendation_actions` (ON CONFLICT insight_id, rec_index DO UPDATE)
- Returns: updated action row

**`GET /api/insights/[id]/recommendations`**
- Auth: session cookie
- Returns: all `recommendation_actions` rows for this insight (joined with insight to verify ownership)

### Feature 2 — Scheduled Auto-Generation

**`GET /api/cron/insights-weekly`** (new cron route)
- Auth: `Authorization: Bearer ${CRON_SECRET}` (same pattern as existing crons)
- Logic:
  1. Query all users with `subscription_tier IN ('business', 'agency')` AND `subscription_status = 'active'`
  2. For each: check if an insight was generated in the last 6 days (avoid duplicating manual generations)
  3. If not: fetch their data, call `aiInsightsService.generateInsights()`, insert results, log to `insight_generation_log`
- Rate: add to `vercel.json` crons: `"0 9 * * 1"` (Monday 9h UTC = 6h Brasília)

This is a new dedicated cron, not extending `check-status`. Reason: `check-status` runs every 10 minutes and processes per-store status. Insight generation is per-user, long-running (~5-10s per user), and weekly. Mixing them would bloat the 10-min cron unpredictably.

### Feature 3 — "What To Do Today" Card

**`GET /api/insights/actions/today`**
- Auth: session cookie
- Logic:
  1. JOIN `ai_insights` + `recommendation_actions` for user
  2. Select recommendations where `status IN ('pending', 'in_progress')`
  3. Parse each recommendation's `priority` from JSONB (`recommendations[rec_index].priority`)
  4. Return top 3 sorted by priority (`high` > `medium` > `low`), then by `ai_insights.created_at DESC`
- Returns: `[{ insight_id, insight_title, rec_index, rec_title, rec_description, priority, impact, status }]`

Note: This is computed — no new table. The card is purely a query joining existing `ai_insights` and the new `recommendation_actions` tables.

### Feature 4 — Insight History Timeline

No new route needed. The existing `GET /api/insights` already returns insights ordered by `created_at DESC`. The change is purely frontend: render a timeline view instead of tabs. The route may need a `?limit=50` parameter increase (currently defaults to 10).

Minor backend addition: expose a `generation_source` field (manual vs cron vs alert-triggered) by reading `triggered_by_alert_id` (NULL = manual/cron).

### Feature 5 — Alert-Triggered Insight Generation

**`POST /api/insights/generate`** — MODIFY (not new route)

The existing generation route is POST and user-triggered. For alert-triggered generation, the entry point is `createAndNotifyAlert()` in `check-status/route.ts`. After that function successfully inserts a critical alert, it should call a new internal helper:

```
triggerInsightForCriticalAlert(supabase, userId, storeId, alertId)
```

This helper:
1. Checks if `severity === 'critical'`
2. Checks if an insight was already generated in the last 1 hour for this user (debounce)
3. Generates insights via `aiInsightsService.generateInsights()`
4. Inserts with `triggered_by_alert_id = alertId`

This is NOT a new HTTP route — it's a service function called internally from within `check-status/route.ts`. It avoids the rate-limit check (which is user-facing) and has its own debounce logic.

### Feature 6 — Export/Share

**`POST /api/insights/[id]/share`**
- Auth: session cookie
- Body: `{ expiresInDays?: number }` (optional; omit for permanent link)
- Logic: Insert into `insight_share_tokens`, return `{ token, url }`

**`GET /api/insights/[id]/export/pdf`**
- Auth: session cookie
- Logic: Fetch insight data, generate PDF server-side (see stack note below), stream as `application/pdf`
- Returns: PDF binary stream

**`GET /api/share/[token]`** (public route — no auth)
- Logic: Look up `insight_share_tokens` by token, verify `expires_at`, fetch insight, return JSON (or render a public page)
- Must NOT expose user PII beyond insight content

PDF library: `@react-pdf/renderer` (server-side, no browser needed in Next.js App Router). Alternative: `puppeteer` (too heavy for Vercel serverless). `@react-pdf/renderer` renders JSX to PDF buffer and is well-suited to structured documents like insight reports. Confidence: MEDIUM (widely used pattern, but verify Vercel edge/serverless bundle size compatibility before committing).

### Feature 7 — Chat with Data

**`POST /api/insights/chat`** (streaming route)
- Auth: session cookie
- Body: `{ message: string, session_id: string }`
- Logic:
  1. Load last 10 turns from `chat_messages` for this `session_id`
  2. Build Gemini chat context: load user's latest insight data as system context (same `prepareDataSummary` logic)
  3. Call `model.startChat({ history: priorTurns })` then `chat.sendMessageStream(message)`
  4. Persist user message and model response to `chat_messages`
  5. Stream response using `ReadableStream` / `new Response(stream)`
- Returns: Streaming text/plain (SSE or chunked)

The route uses `model.startChat()` from `@google/generative-ai` — this is the multi-turn chat API already available in the SDK used by `AIInsightsService`. No new SDK needed.

---

## Modified Components

### `src/services/ai-insights.ts`

- Add `generateInsightForAlert(alertData, userData): Promise<GeneratedInsight[]>` method — a focused generation that includes the triggering alert as part of the prompt context
- Add `generateChatResponse(message, history, contextData): AsyncGenerator<string>` method wrapping Gemini's streaming chat API

### `src/app/api/cron/check-status/route.ts`

- Import and call `triggerInsightForCriticalAlert()` after successful critical alert creation (inside `createAndNotifyAlert()`). This is a single function call addition — the existing alert creation flow is unchanged.

### `src/app/api/insights/route.ts` (GET)

- Add `generation_source` field to returned insights (computed from `triggered_by_alert_id`: `'alert'` | `'manual'` | `'scheduled'`)
- Increase default `limit` from 10 to 50 for timeline view

### `src/app/dashboard/insights/page.tsx`

- Add timeline view tab
- Add "What to do today" card section
- Add action status controls on each recommendation (dropdown: Pendente / Em progresso / Concluído / Ignorado)
- Add share/export button per insight
- Add chat panel (slide-over or modal)

### `vercel.json`

- Add new cron entry for `/api/cron/insights-weekly`

---

## Data Flow

### Feature 1 — Action Tracking

```
User clicks status on recommendation
  -> PATCH /api/insights/[id]/recommendations/[index]
  -> UPSERT recommendation_actions (insight_id, rec_index)
  -> GET /api/insights/actions/today re-fetches top 3
  -> UI updates card
```

### Feature 2 — Scheduled Auto-Generation

```
Vercel Cron (Monday 9h UTC)
  -> GET /api/cron/insights-weekly
  -> Query business/agency users
  -> For each user: check insight_generation_log (6-day debounce)
  -> aiInsightsService.generateInsights()
  -> INSERT ai_insights (triggered_by_alert_id = NULL)
  -> INSERT insight_generation_log
```

### Feature 5 — Alert-Triggered

```
Vercel Cron (*/10 * * * *)
  -> check-status route detects store offline
  -> createAndNotifyAlert(supabase, store, { severity: 'critical', ... })
  -> alerts table INSERT
  -> sendNotifications() [unchanged]
  -> triggerInsightForCriticalAlert(supabase, userId, storeId, alertId)  [NEW - only if critical]
  -> 1-hour debounce check
  -> aiInsightsService.generateInsightForAlert()
  -> INSERT ai_insights (triggered_by_alert_id = alertId)
```

### Feature 7 — Chat

```
User sends message
  -> POST /api/insights/chat { message, session_id }
  -> Load chat_messages (last 10 turns for session_id)
  -> Load user's latest insights as data context
  -> model.startChat({ history: priorTurns })
  -> chat.sendMessageStream(message)
  -> Stream response chunks to client
  -> INSERT chat_messages (user message + full model response)
```

---

## Suggested Build Order

The order is driven by three dependency rules:
1. Schema must precede API routes that use it
2. API routes must precede UI that calls them
3. Simpler, standalone features before features that extend others

### Phase 1 — Action Tracking (Feature 1) + "What To Do Today" (Feature 3)

Build together. `recommendation_actions` table is the shared dependency. The "today" card is a query over the same table. Delivering both in one phase gives immediately visible value (the card is the payoff for tracking actions).

Deliverables:
- `recommendation_actions` migration
- `PATCH /api/insights/[id]/recommendations/[index]`
- `GET /api/insights/actions/today`
- UI: action status controls + "O que fazer hoje" card

### Phase 2 — Insight History Timeline (Feature 4)

Depends on: nothing new (queries existing `ai_insights`). Low risk, frontend-only change. Ships fast.

Deliverables:
- UI: timeline view replacing/supplementing tab view
- Backend: add `generation_source` field to `GET /api/insights` response

### Phase 3 — Scheduled Auto-Generation (Feature 2)

Depends on: none (extends existing generation service). No UI changes needed.

Deliverables:
- `GET /api/cron/insights-weekly`
- `vercel.json` cron entry
- Debounce logic in `insight_generation_log` query

### Phase 4 — Alert-Triggered Insight (Feature 5)

Depends on: `ai_insights.triggered_by_alert_id` column (schema migration). Modifies `check-status/route.ts` carefully.

Deliverables:
- `triggered_by_alert_id` column migration
- `triggerInsightForCriticalAlert()` service function
- Integration into `createAndNotifyAlert()`
- UI: badge showing "Gerado por alerta crítico" in timeline (Feature 4 already shipped)

### Phase 5 — Export / Share (Feature 6)

Depends on: `insight_share_tokens` table. Independent of all prior phases.

Deliverables:
- `insight_share_tokens` migration
- `POST /api/insights/[id]/share`
- `GET /api/insights/[id]/export/pdf`
- `GET /api/share/[token]` (public page)
- UI: export/share buttons per insight

### Phase 6 — Chat with Data (Feature 7)

Last because it has the highest complexity (streaming, session management, Gemini multi-turn) and requires the existing insight data to be rich (more insights = better chat context). Build after other features have populated more history.

Deliverables:
- `chat_messages` table migration
- `POST /api/insights/chat` streaming route
- `generateChatResponse()` in `AIInsightsService`
- UI: chat panel component

---

## Integration Points Summary

| Feature | Touches Existing Code | New Code |
|---------|----------------------|----------|
| Action tracking | `insights/page.tsx` (add controls) | `recommendation_actions` table, 2 new routes |
| Scheduled generation | `vercel.json` (add cron) | new cron route, debounce logic |
| Today card | `insights/page.tsx` (add card) | `GET /api/insights/actions/today` |
| History timeline | `insights/route.ts` (add field), `insights/page.tsx` (new view) | none |
| Alert-triggered | `check-status/route.ts` (1 call added), `ai-insights.ts` (1 method) | `triggered_by_alert_id` column |
| Export/share | `insights/page.tsx` (add buttons) | `insight_share_tokens` table, 3 new routes |
| Chat | `ai-insights.ts` (add method), `insights/page.tsx` (add panel) | `chat_messages` table, 1 streaming route |

**Highest-risk modification:** Adding the `triggerInsightForCriticalAlert()` call inside `check-status/route.ts`. This route runs every 10 minutes for all stores. The call must be async-non-blocking (fire-and-forget with error catch) or have a strict timeout to avoid delaying the status check loop. Do not `await` it directly in the hot path — use `Promise.resolve().then(...)` or a background queue pattern.

**Lowest-risk:** Timeline view (Feature 4) — purely frontend, no schema changes, existing data.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Schema design | HIGH | Derived directly from inspecting existing tables and code |
| Route structure | HIGH | Follows confirmed Next.js App Router patterns in existing codebase |
| Gemini chat API | MEDIUM | `model.startChat()` exists in `@google/generative-ai` SDK; streaming confirmed in docs but not used in this codebase yet |
| PDF generation | MEDIUM | `@react-pdf/renderer` server-side is a known pattern; Vercel bundle size needs validation |
| Alert-triggered debounce | MEDIUM | Debounce approach is sound; exact threshold (1 hour) should be validated in production |
| Build order | HIGH | Order directly derived from confirmed dependency graph |
