# Stack Research — PulseWatch v1.1 AI Insights Advanced

**Project:** PulseWatch v1.1
**Researched:** 2026-04-01
**Scope:** New libraries needed for 7 advanced AI Insights features only. Existing stack (Next.js 14, Supabase, Gemini, Stripe, shadcn/ui) is not re-evaluated.

---

## New Dependencies

### 1. Chat Streaming — Vercel AI SDK

**Feature:** Natural language chat with store data (via Gemini)

| Package | Version | Purpose |
|---------|---------|---------|
| `ai` | `^4.3.19` | Core SDK: `streamText`, server-side streaming route |
| `@ai-sdk/google` | `^3.0.55` | Official Google Gemini provider for AI SDK |
| `@ai-sdk/react` | `^1.0.0` (bundled in `ai@4`) | `useChat` hook for streaming UI |

**Why `ai@4.3.19` not `ai@6`:**
The `npm latest` tag now points to `ai@6.0.142` (a major rewrite with different API surface). This project uses Next.js 14 (not 15) and React 18. The v4 series is the last generation with confirmed Next.js 14 / React 18 compatibility, peer deps `zod ^3.23.8` and `react ^18`, which matches the existing stack perfectly. v6 requires zod `^3.25.76 || ^4.1.8` — the `^4` range is a new incompatible zod major not yet used in this codebase. Use `ai@4.3.19` (confidence: HIGH — npm registry confirmed).

**Why not keep raw `@google/generative-ai` for chat:**
The existing `@google/generative-ai@0.21.0` does not provide streaming HTTP response primitives compatible with Next.js Route Handlers' `ReadableStream` contract. AI SDK's `streamText` with `@ai-sdk/google` returns a proper `StreamingTextResponse` that works natively with the `useChat` hook and handles token-by-token flush. Reusing the raw SDK for chat would require manual `ReadableStream` wrapping.

**API pattern (server):**
```typescript
// src/app/api/insights/chat/route.ts
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const result = streamText({
    model: google('gemini-1.5-flash'),
    messages,
    system: '...'
  })
  return result.toDataStreamResponse()
}
```

**API pattern (client):**
```typescript
import { useChat } from 'ai/react'
const { messages, input, handleSubmit } = useChat({ api: '/api/insights/chat' })
```

---

### 2. PDF Generation — @react-pdf/renderer

**Feature:** Export/share insights as PDF

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-pdf/renderer` | `^4.3.2` | Server-side PDF generation from React component trees |

**Why `@react-pdf/renderer` not `jspdf`:**
`jspdf` is DOM-dependent (requires a browser `document` object) — it cannot run in Next.js Route Handlers or server components. `@react-pdf/renderer` is explicitly described as "Create PDF files on the browser and server" (npm description, confirmed from registry). Its `renderToBuffer()` / `renderToStream()` APIs run in pure Node.js with no DOM dependency, making it suitable for a Route Handler like `GET /api/insights/[id]/pdf` that returns `Content-Type: application/pdf`.

Peer deps: `react ^16.8 || ^17 || ^18 || ^19` — fully compatible with existing React 18 (confidence: HIGH — npm registry confirmed).

**Why not Puppeteer/Playwright headless PDF:**
Both are ~300MB install size with Chromium binary. Vercel Serverless Functions have a 250MB compressed limit. Puppeteer's `@sparticuz/chromium` shim brings the function to the edge of the limit and requires custom build config. `@react-pdf/renderer` adds ~4MB. Not worth the operational cost for a reports PDF.

**API pattern:**
```typescript
// src/app/api/insights/[id]/pdf/route.ts
import { renderToBuffer } from '@react-pdf/renderer'
import { InsightPDFDocument } from '@/components/pdf/InsightPDFDocument'

export async function GET(req, { params }) {
  const buffer = await renderToBuffer(<InsightPDFDocument insightId={params.id} />)
  return new Response(buffer, {
    headers: { 'Content-Type': 'application/pdf' }
  })
}
```

Note: The PDF component file must be a `.tsx` file with `'use server'` or kept in a non-client module, since `@react-pdf/renderer` uses its own React reconciler (not the browser one). Do not mix it with client components.

---

### 3. Scheduled Cron — No New Library

**Feature:** Scheduled auto-generation (cron semanal)

No new library needed. The project already uses Vercel Cron Jobs via `vercel.json` (confirmed: the file already has `crons` array with two entries). Adding a weekly insight generation cron is purely a `vercel.json` + new Route Handler.

**Verified Vercel limits (from official docs, confidence: HIGH):**
- Pro plan: minimum interval 1 minute, up to 100 cron jobs per project
- All plans: max 100 cron jobs
- Timezone: always UTC (Brasília = UTC-3, so `0 11 * * 1` = Monday 8h BRT, same as existing weekly-report cron)

**Configuration:**
```json
// vercel.json — add to existing crons array
{
  "path": "/api/cron/weekly-insights",
  "schedule": "0 11 * * 1"
}
```

**Authentication pattern** (already validated in existing cron routes):
```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### 4. Shareable Links — No New Library

**Feature:** Shareable insight links

No new library needed. Shareable links are a Supabase + nanoid pattern.

**Pattern:**
1. When user clicks "Share", generate a `share_token` using `nanoid()` (already available as transitive dependency in the tree; can also use `crypto.randomUUID()` from Node built-ins for zero-dependency approach)
2. Store token in a `shared_insights` table with `insight_generation_id`, `expires_at`, `user_id`
3. Public route `GET /insights/share/[token]` reads from Supabase with RLS bypassed via service-role client (or a public anon read policy scoped to the token)
4. No auth required to view — Supabase Row Level Security policy: `SELECT WHERE share_token = :token AND expires_at > now()`

Use `crypto.randomUUID()` (Node 14.17+ built-in) over adding `nanoid` as a dependency — zero bundle cost. (confidence: HIGH — Node.js built-in, no verification needed)

---

### 5. Action Tracking — No New Library

**Feature:** Track recommendation actions (done/in-progress/dismissed)

Pure database work. New `insight_actions` table in Supabase:
```sql
insight_actions (
  id uuid,
  user_id uuid,
  insight_id uuid,
  recommendation_index int,
  status text CHECK (status IN ('done', 'in_progress', 'dismissed')),
  updated_at timestamptz
)
```

API: `PATCH /api/insights/[id]/actions` — upsert by `(insight_id, recommendation_index)`.

No library needed beyond existing Supabase client.

---

### 6. Insight History Timeline — No New Library

**Feature:** Timeline comparing insight generations over time

Pure data + UI work. `recharts` is already in the stack (`^3.6.0`) and handles timeline/comparative charts. The `ai_insights` table already has `created_at`. Group by `DATE_TRUNC('week', created_at)` in Postgres to produce timeline data.

No library needed.

---

### 7. Alert-Triggered Insights — No New Library

**Feature:** Insight triggered by critical alert

The existing alert system writes to `alerts` table. Add a trigger condition in `src/app/api/cron/check-status/route.ts` (already exists): when an alert with severity `critical` is created, call the insight generation endpoint internally (`fetch('/api/insights/generate', { method: 'POST' })` with service-role auth headers).

No new library needed.

---

## Summary: New Dependencies

| Package | Version | Feature | Confidence |
|---------|---------|---------|-----------|
| `ai` | `^4.3.19` | Chat streaming (server) | HIGH — npm registry |
| `@ai-sdk/google` | `^3.0.55` | Gemini provider for AI SDK | HIGH — npm registry |
| `@react-pdf/renderer` | `^4.3.2` | PDF export | HIGH — npm registry |

Total: **3 new packages**. Everything else reuses existing infrastructure.

---

## Integration Points

### Chat → Existing Gemini integration

The codebase already uses `@google/generative-ai@0.21.0` directly in `src/services/ai-insights.ts`. The new chat feature should use `@ai-sdk/google` (AI SDK's wrapper) in the Route Handler **only**, keeping the existing direct SDK usage for batch insight generation unchanged. Do not migrate the existing service — the two can coexist.

Reason: batch generation does not benefit from streaming (no UI waiting for tokens); only the chat UI does. Forcing a migration of `ai-insights.ts` to AI SDK would be unnecessary scope.

### PDF → Supabase insights data

The PDF route needs to fetch insight data server-side. Use Supabase server client with the user's session (from cookie) or service role (if called from a signed URL). Do not pass insight JSON through query params — fetch by ID server-side.

### Cron → Rate limiting

The existing `check_insight_rate_limit` RPC applies to user-triggered generation. The weekly cron should bypass this rate limit (it runs as service, not user). Add a `skip_rate_limit` parameter or use a separate DB function for scheduled generation.

### Shared links → RLS

The `shared_insights` table needs a Supabase RLS policy that allows anonymous reads by token. The service-role client must not be used in the public `GET /insights/share/[token]` route — use anon client + well-scoped SELECT policy to avoid accidentally exposing other rows.

### AI SDK → Zod version

`ai@4.3.19` peer-requires `zod ^3.23.8`. Existing stack uses `zod ^3.22.4`. The installed version must be upgraded to `>=3.23.8`. Run `npm install zod@^3.23.8`. This is a minor semver bump — no breaking changes expected (confidence: HIGH).

---

## What NOT to Add

| Library | Why Not |
|---------|---------|
| `puppeteer` / `playwright` | ~300MB Chromium binary exceeds Vercel 250MB function limit. Avoid. |
| `jspdf` / `html2pdf.js` | DOM-dependent, cannot run server-side in Route Handlers. |
| `ai@6` | Requires zod v4 (incompatible with current stack), different API surface from v4, would require rewriting existing service. |
| `langchain` | Massive dependency tree (~50 transitive packages) for a use case covered by AI SDK in 3 packages. Overkill. |
| `openai` SDK | Project is Gemini-committed. Adding OpenAI SDK to support "options" adds cost and maintenance surface with zero benefit. |
| `socket.io` / `pusher` | Chat streaming is handled by the native Web Streams API via AI SDK. Real-time libraries are unnecessary for request-response chat. |
| `react-markdown` | Gemini responses for this use case (store analysis) should be controlled JSON → avoid uncontrolled markdown rendering. If markdown is needed, shadcn/ui's prose classes suffice. |
| `date-fns` / `dayjs` | Timeline date grouping is done in Postgres (`DATE_TRUNC`). Client-side date formatting can use `Intl.DateTimeFormat` (built-in). |

---

## Recommendations

### Install command

```bash
npm install ai@4.3.19 @ai-sdk/google@3.0.55 @react-pdf/renderer@4.3.2 zod@^3.23.8
```

Note: `zod` is a patch/minor upgrade from `^3.22.4` to `^3.23.8` — required by `ai@4.3.x`.

### Version pinning rationale

- `ai@4.3.19` pinned to minor (not `^4`) because AI SDK has a history of breaking changes in minor releases
- `@ai-sdk/google` pinned to `3.0.55` for the same reason
- `@react-pdf/renderer@^4.3.2` — `^` is safe here, the library is stable

### Architecture recommendation for chat

Build the chat Route Handler as a stateless context-injection pattern: each request includes the user's relevant data summary (top alerts, recent insight summary, key metrics) in the system prompt. Do not use any server-side session/conversation store — Gemini's context window (1M tokens) is large enough for multi-turn chat within a single session, and the `messages` array from `useChat` carries full history client-side.

This means no new database table for chat history (scope reduction). If history persistence is needed, add it in a future milestone.

### PDF generation note

`@react-pdf/renderer` uses its own layout engine (Yoga) and custom font handling. It does not render HTML/CSS. PDF components must be written with `<Document>`, `<Page>`, `<View>`, `<Text>` primitives from the library. Budget 2-3h for the initial component authoring.

---

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| `ai@4.3.19` version + compatibility | HIGH | npm registry — version confirmed, peer deps verified |
| `@ai-sdk/google@3.0.55` | HIGH | npm registry confirmed |
| `@react-pdf/renderer@4.3.2` server-side support | HIGH | npm description + peer deps confirmed, Node.js support documented |
| Vercel cron limits (Pro: 1 min interval, 100 jobs) | HIGH | Official Vercel docs verified |
| `crypto.randomUUID()` for share tokens | HIGH | Node.js built-in since 14.17, no external dependency needed |
| AI SDK v4 vs v6 recommendation | HIGH | npm dist-tags + peer dep analysis |
| Puppeteer function size limit | MEDIUM | Vercel 250MB limit is documented; exact Puppeteer bundle size on Vercel is environment-dependent |
