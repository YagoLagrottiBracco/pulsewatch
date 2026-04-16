# Milestones

## v1.1 Insights IA + Melhorias de Produto (Shipped: 2026-04-16)

**Phases completed:** 5 phases, 7 plans, 9 tasks

**Key accomplishments:**

- JSX badge component replacing string label for automatic AI insight generations — blue "Geração automática" chip with Clock icon in history dropdown, amber "Por alerta" chip for alert-triggered generations
- Inline "O que fazer agora" diagnosis checklists rendered on /alerts for critical alerts, covering downtime, stock_low, and sales_drop with 6-7 actionable steps each
- One-liner:
- ALERT_VIEWED audit action added to AuditActions, wired into markAsRead, and additive Supabase RLS policy created granting owners SELECT on active team members' audit_logs
- Owner-only Tabs UI on /activity page with lazy-loaded team feed showing member email, action label, and relative timestamp per audit log entry

---
