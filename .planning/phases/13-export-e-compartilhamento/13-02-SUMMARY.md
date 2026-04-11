---
plan: 13-02
status: complete
started: 2026-04-10
completed: 2026-04-10
commits:
  - cd0dfd7
  - 60f6439
---

## What Was Built

Página Server Component `/share/[token]` exibe insights públicos sem PII (sem user_id, store_id), com fallback amigável "Link não disponível" para tokens inválidos/expirados/revogados. Em `insights/page.tsx`: estado `shareLink`/`shareLoading`/`shareError`/`showSharePanel`, handlers `handleExportPDF` (window.print), `handleShare` (POST /api/insights/share), `handleRevoke` (DELETE). Botão "Exportar PDF" visível para business+ com geração selecionada. Botão "Compartilhar"/"Ver link" visível para !upgradeRequired com painel inline de cópia e revogação. CSS `@media print` oculta `[data-no-print]`, nav e header.

## Key Files

- `src/app/share/[token]/page.tsx` — página pública sem autenticação
- `src/app/dashboard/insights/page.tsx` — botões Export PDF e Compartilhar

## Decisions

- window.print() para PDF — zero dependências, funciona em todos os browsers
- `data-no-print` nos botões de ação para não aparecerem no PDF impresso
- Share button aparece para todos business+ (servidor valida agency), erro mostrado inline
- Painel de share inline (não modal) para manter tokens contextuais ao fluxo

## Self-Check: PASSED
