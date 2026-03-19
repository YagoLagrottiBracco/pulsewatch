-- Adiciona offline_since: marca o momento exato em que a loja ficou offline
-- Usado para calcular a duração do downtime quando a loja se recupera
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS offline_since TIMESTAMPTZ;

-- Adiciona revenue_per_hour: receita média por hora configurada pelo usuário
-- NULL = usa fallback inteligente no serviço de cálculo
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS revenue_per_hour DECIMAL(10, 2);

-- Tabela de incidentes de downtime
-- Cada linha representa um período completo (offline → online) com a perda estimada
CREATE TABLE IF NOT EXISTS public.downtime_incidents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ NOT NULL,
  recovered_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL,
  revenue_per_hour  DECIMAL(10, 2) NOT NULL,  -- snapshot do valor usado no cálculo
  estimated_loss    DECIMAL(10, 2) NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downtime_incidents_store_id
  ON public.downtime_incidents(store_id);

CREATE INDEX IF NOT EXISTS idx_downtime_incidents_started_at
  ON public.downtime_incidents(started_at);

-- RLS: usuário só vê incidentes de suas próprias lojas
ALTER TABLE public.downtime_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own downtime incidents"
  ON public.downtime_incidents
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.downtime_incidents IS
  'Histórico imutável de períodos de indisponibilidade com estimativa de perda financeira.';

COMMENT ON COLUMN public.downtime_incidents.revenue_per_hour IS
  'Snapshot da receita/hora usada no cálculo — preserva o valor mesmo se o usuário alterar depois.';
