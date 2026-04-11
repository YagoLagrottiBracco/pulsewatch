---
plan: 12-02
status: complete
started: 2026-04-10
completed: 2026-04-10
commits:
  - 380c02c
---

## What Was Built

`formatGenerationLabel` em `insights/page.tsx` atualizada para tratar `source === 'alert_triggered'`, exibindo "Disparado por alerta — DD/MM/YYYY HH:mm" no seletor de gerações. Labels existentes ("Automatico" e formato manual) preservados.

## Key Files

- `src/app/dashboard/insights/page.tsx` — `formatGenerationLabel` com case `alert_triggered`

## Self-Check: PASSED
