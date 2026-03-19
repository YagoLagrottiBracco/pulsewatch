/**
 * Serviço de cálculo de perda financeira por downtime.
 *
 * Responsabilidade: cálculo puro + fallback de receita/hora + formatação de mensagens.
 * Sem efeitos colaterais (sem escrita no banco).
 */

const DEFAULT_REVENUE_PER_HOUR = 50 // R$ 50/h — fallback conservador para SMB brasileiro

export interface FinancialLossResult {
  durationMinutes: number
  revenuePerHour: number
  estimatedLoss: number
  /** Fonte do valor de receita/hora usado */
  revenueSource: 'configured' | 'orders_history' | 'product_avg' | 'default'
  /** Mensagens formatadas para exibição */
  messages: {
    neutral: string
    commercial: string
    urgency: string
  }
}

/**
 * Calcula a perda financeira estimada para um período de downtime.
 */
export function calculateFinancialLoss(
  durationMinutes: number,
  revenuePerHour: number,
  revenueSource: FinancialLossResult['revenueSource'] = 'configured'
): FinancialLossResult {
  const estimatedLoss = (durationMinutes / 60) * revenuePerHour

  return {
    durationMinutes,
    revenuePerHour,
    estimatedLoss,
    revenueSource,
    messages: buildMessages(durationMinutes, estimatedLoss, revenuePerHour),
  }
}

/**
 * Resolve a receita por hora a usar, aplicando fallback inteligente.
 *
 * Prioridade:
 * 1. Valor configurado na loja (revenue_per_hour)
 * 2. Média dos pedidos dos últimos 30 dias / 24h
 * 3. Preço médio dos produtos × fator de conversão conservador
 * 4. Default: R$ 50/h
 */
export function resolveRevenuePerHour(params: {
  configuredRevenue: number | null
  recentOrdersTotal?: number | null  // soma dos pedidos dos últimos 30 dias
  avgProductPrice?: number | null
}): { value: number; source: FinancialLossResult['revenueSource'] } {
  const { configuredRevenue, recentOrdersTotal, avgProductPrice } = params

  if (configuredRevenue != null && configuredRevenue > 0) {
    return { value: configuredRevenue, source: 'configured' }
  }

  if (recentOrdersTotal != null && recentOrdersTotal > 0) {
    // 30 dias × 24 horas = 720 horas
    const hourlyRate = recentOrdersTotal / 720
    return { value: Math.round(hourlyRate * 100) / 100, source: 'orders_history' }
  }

  if (avgProductPrice != null && avgProductPrice > 0) {
    // Estimativa: 0,5 pedidos/hora × preço médio (conversão conservadora)
    const hourlyRate = avgProductPrice * 0.5
    return { value: Math.round(hourlyRate * 100) / 100, source: 'product_avg' }
  }

  return { value: DEFAULT_REVENUE_PER_HOUR, source: 'default' }
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

function buildMessages(
  durationMinutes: number,
  estimatedLoss: number,
  revenuePerHour: number
): FinancialLossResult['messages'] {
  const duration = formatDuration(durationMinutes)
  const loss = formatCurrency(estimatedLoss)
  const rate = formatCurrency(revenuePerHour)

  return {
    neutral:
      `Tempo offline: ${duration} — Impacto estimado: ${loss}`,

    commercial:
      `Sua loja ficou fora do ar por ${duration}. ` +
      `Estimamos que você deixou de faturar ${loss} nesse período.`,

    urgency:
      `Sua loja está offline há ${duration}. ` +
      `A cada hora que passa, você perde aproximadamente ${rate} em vendas.`,
  }
}
