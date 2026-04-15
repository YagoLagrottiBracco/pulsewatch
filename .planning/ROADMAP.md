# Roadmap — Milestone v1.1

**Milestone:** v1.1 — Insights IA + Melhorias de Produto
**Coverage:** 17/17 requirements mapped
**Phases:** 11–15 (continuing from phases 9–10, which are complete)

---

## Phases

- [x] **Phase 11: Auto Weekly AI Insights** - Generate AI insights automatically every Monday for business+ users (completed 2026-04-14)
- [x] **Phase 12: Post-Alert Guided Diagnosis** - Show contextual "what to do now" checklists when users view critical alerts (completed 2026-04-15)
- [x] **Phase 13: Loss Calculator on Landing Page** - Add an interactive downtime loss calculator to the landing page (completed 2026-04-15)
- [x] **Phase 14: CSV Export** - Allow users to export alerts and analytics data as CSV files (completed 2026-04-15)
- [ ] **Phase 15: Team Activity Feed** - Give owners visibility into what each team member has done

---

## Phase Details

### Phase 11: Auto Weekly AI Insights
**Goal**: Business+ users receive AI insights automatically every Monday without manual intervention
**Depends on**: Phases 9 and 10 (completed — action tracking and insights history)
**Requirements**: INS-01, INS-02, INS-03, INS-04
**Success Criteria** (what must be TRUE):
  1. A business+ user who has not manually generated insights sees a new insight entry on Monday morning, generated automatically
  2. The automatic insight appears in the history list with a visible "geração automática" label distinguishing it from manual generations
  3. If the user already generated insights within the last 6 days, no duplicate entry is created on Monday
  4. A free or pro user does not receive automatic generation — only business+ tier triggers the automation
**Plans**: TBD

### Phase 12: Post-Alert Guided Diagnosis
**Goal**: Users viewing a critical alert see a contextual checklist of recommended actions tailored to that alert type
**Depends on**: Phase 11 (alerts system is pre-existing from v1.0)
**Requirements**: ALERT-01, ALERT-02, ALERT-03
**Success Criteria** (what must be TRUE):
  1. When a user opens a critical alert, a "O que fazer agora" card is visible on the alert detail view
  2. The checklist items differ depending on alert type — a store offline alert shows different steps than a low stock alert
  3. All four covered alert types (loja offline, estoque zerado, estoque baixo, queda de vendas) display their own specific checklist
**Plans**: 1 plan
Plans:
- [x] 12-01-PLAN.md — Create diagnosis checklist data, component, and wire into alerts page
**UI hint**: yes

### Phase 13: Loss Calculator on Landing Page
**Goal**: Visitors to the landing page can estimate how much revenue they lose per hour of store downtime
**Depends on**: Nothing (landing page is standalone)
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04
**Success Criteria** (what must be TRUE):
  1. A visitor can type their monthly revenue into the calculator and immediately see an estimated hourly loss from downtime
  2. The calculator also displays the estimated impact of a 20% sales drop alongside the downtime loss figure
  3. The calculator widget uses the same visual language (colors, typography, component style) as the rest of the landing page and product
**Plans**: 1 plan
Plans:
- [ ] 13-01-PLAN.md — Create loss calculator component and wire into landing page
**UI hint**: yes

### Phase 14: CSV Export
**Goal**: Users can download their alert history and analytics data as CSV files directly from the browser
**Depends on**: Nothing (reads existing data already available in dashboard)
**Requirements**: EXP-01, EXP-02, EXP-03
**Success Criteria** (what must be TRUE):
  1. On the alerts page, a user can select a date range and download a CSV containing only the alerts from that period
  2. On the analytics page, a user can download a CSV with sales and uptime data
  3. Both CSV downloads happen entirely in the browser — no server endpoint is called to generate the file
**Plans**: 1 plan
Plans:
- [x] 14-01-PLAN.md — Add date-range filter to alerts page and CSV export to analytics page

### Phase 15: Team Activity Feed
**Goal**: Account owners can see a chronological log of actions each team member has taken on alerts
**Depends on**: Nothing (team roles from v1.0, alert interactions already exist)
**Requirements**: TEAM-01, TEAM-02, TEAM-03
**Success Criteria** (what must be TRUE):
  1. An owner navigates to a team or activity section and sees a feed listing recent member actions (viewed alert, archived, added note) with member name and timestamp
  2. When any team member interacts with an alert (views, archives, adds a note), that action is recorded automatically without any extra step from the member
  3. Each feed entry clearly shows who did what and when, without requiring the owner to ask members directly
**Plans**: TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 11. Auto Weekly AI Insights | 1/1 | Complete    | 2026-04-14 |
| 12. Post-Alert Guided Diagnosis | 1/1 | Complete    | 2026-04-15 |
| 13. Loss Calculator on Landing Page | 0/1 | Complete    | 2026-04-15 |
| 14. CSV Export | 1/1 | Complete   | 2026-04-15 |
| 15. Team Activity Feed | 0/? | Not started | - |

---

## Coverage Map

| REQ-ID | Phase |
|--------|-------|
| INS-01 | Phase 11 |
| INS-02 | Phase 11 |
| INS-03 | Phase 11 |
| INS-04 | Phase 11 |
| ALERT-01 | Phase 12 |
| ALERT-02 | Phase 12 |
| ALERT-03 | Phase 12 |
| LAND-01 | Phase 13 |
| LAND-02 | Phase 13 |
| LAND-03 | Phase 13 |
| LAND-04 | Phase 13 |
| EXP-01 | Phase 14 |
| EXP-02 | Phase 14 |
| EXP-03 | Phase 14 |
| TEAM-01 | Phase 15 |
| TEAM-02 | Phase 15 |
| TEAM-03 | Phase 15 |

**Mapped: 17/17**

---

*Last updated: 2026-04-15 — Phase 14 planned*
