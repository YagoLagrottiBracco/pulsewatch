-- Phase 12: Insight por Alerta Crítico
-- Adiciona alert_id em insight_generation_log para rastrear qual alerta originou o insight.
-- Nullable: geraçoes manual e automatic nao referenciam alerta.

ALTER TABLE insight_generation_log
  ADD COLUMN IF NOT EXISTS alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL;

-- Index para buscar geraçoes por alerta
CREATE INDEX IF NOT EXISTS idx_insight_generation_log_alert_id
  ON insight_generation_log(alert_id)
  WHERE alert_id IS NOT NULL;
