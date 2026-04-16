import { createClient } from '@supabase/supabase-js'
import { captureStoreError } from '@/lib/sentry'

export type GatewayName = 'pix' | 'pagseguro' | 'mercadopago' | 'cielo'
export type GatewayStatus = 'online' | 'offline' | 'degraded' | 'unknown'

interface GatewayCheckResult {
  gateway: GatewayName
  status: GatewayStatus
  responseTimeMs: number
  error?: string
}

interface GatewayConfig {
  name: GatewayName
  label: string
  url: string
  timeout: number
  method: 'GET' | 'HEAD'
  // Status codes que indicam que o gateway está online
  okStatuses: number[]
}

const GATEWAY_CONFIGS: GatewayConfig[] = [
  {
    name: 'pix',
    label: 'Pix (Banco Central)',
    url: 'https://www.bcb.gov.br/estabilidadefinanceira/pagamentosinstantaneos',
    timeout: 8000,
    method: 'GET',
    okStatuses: [200, 301, 302],
  },
  {
    name: 'pagseguro',
    label: 'PagSeguro',
    url: 'https://ws.pagseguro.uol.com.br/v2/sessions',
    timeout: 5000,
    method: 'GET',
    // PagSeguro retorna 401 sem credenciais, mas isso indica que o serviço está UP
    okStatuses: [200, 401, 403],
  },
  {
    name: 'mercadopago',
    label: 'Mercado Pago',
    url: 'https://api.mercadopago.com',
    timeout: 5000,
    method: 'GET',
    okStatuses: [200, 401, 403],
  },
  {
    name: 'cielo',
    label: 'Cielo',
    url: 'https://api.cieloecommerce.cielo.com.br/1/',
    timeout: 5000,
    method: 'GET',
    okStatuses: [200, 401, 403, 404],
  },
]

/**
 * Verificar status de um gateway específico
 */
async function checkSingleGateway(config: GatewayConfig): Promise<GatewayCheckResult> {
  try {
    const t0 = performance.now()
    const response = await fetch(config.url, {
      method: config.method,
      redirect: 'follow',
      signal: AbortSignal.timeout(config.timeout),
      headers: { 'User-Agent': 'PulseWatch-GatewayMonitor/1.0' },
    })
    const responseTimeMs = Math.round(performance.now() - t0)

    const isOk = config.okStatuses.includes(response.status)
    // Degraded: respondeu mas com status inesperado ou muito lento
    let status: GatewayStatus
    if (isOk && responseTimeMs <= 3000) status = 'online'
    else if (isOk) status = 'degraded'
    else status = 'degraded'

    return { gateway: config.name, status, responseTimeMs }
  } catch (error) {
    captureStoreError(`gateway:${config.name}`, error, { gateway: config.name })
    return {
      gateway: config.name,
      status: 'offline',
      responseTimeMs: 0,
      error: String(error),
    }
  }
}

/**
 * Verificar todos os gateways e persistir resultados
 */
export async function checkAllGateways(): Promise<GatewayCheckResult[]> {
  const results = await Promise.all(
    GATEWAY_CONFIGS.map(config => checkSingleGateway(config))
  )
  return results
}

/**
 * Verificar gateways específicos (para um usuário que monitora apenas alguns)
 */
export async function checkGateways(gateways: GatewayName[]): Promise<GatewayCheckResult[]> {
  const configs = GATEWAY_CONFIGS.filter(c => gateways.includes(c.name))
  const results = await Promise.all(
    configs.map(config => checkSingleGateway(config))
  )
  return results
}

/**
 * Persistir resultados e criar alertas se necessário
 * Chamado pelo cron job
 */
export async function monitorGatewaysAndAlert(
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ checked: number; alerts: number }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Verificar todos os gateways
  const results = await checkAllGateways()

  // 2. Persistir status
  for (const result of results) {
    await supabase.from('gateway_status').insert({
      gateway: result.gateway,
      status: result.status,
      response_time_ms: result.responseTimeMs,
      metadata: result.error ? { error: result.error } : undefined,
    })
  }

  // 3. Buscar status anterior de cada gateway para comparação
  let alertsCreated = 0

  for (const result of results) {
    if (result.status === 'online') continue

    // Buscar penúltimo status (o anterior ao que acabamos de inserir)
    const { data: previousStatuses } = await supabase
      .from('gateway_status')
      .select('status')
      .eq('gateway', result.gateway)
      .order('checked_at', { ascending: false })
      .limit(2)

    // Se o status anterior era online e agora não é, alertar
    const previousStatus: string = previousStatuses && previousStatuses.length > 1
      ? previousStatuses[1].status
      : 'unknown'

    if (previousStatus === 'online') {
      // Buscar usuários business+ que monitoram este gateway
      const { data: users } = await supabase
        .from('user_profiles')
        .select('user_id, subscription_tier, monitored_gateways')
        .in('subscription_tier', ['business', 'agency'])

      if (users) {
        for (const user of users) {
          const gateways: string[] = user.monitored_gateways || []
          // Se o array está vazio, monitorar todos (padrão)
          if (gateways.length > 0 && !gateways.includes(result.gateway)) continue

          // Buscar lojas do usuário para associar o alerta
          const { data: stores } = await supabase
            .from('stores')
            .select('id, name')
            .eq('user_id', user.user_id)
            .eq('is_active', true)
            .limit(1)

          if (stores && stores.length > 0) {
            const store = stores[0]
            const gatewayLabel = GATEWAY_CONFIGS.find(c => c.name === result.gateway)?.label || result.gateway

            await supabase.from('alerts').insert({
              store_id: store.id,
              type: 'GATEWAY_OFFLINE',
              severity: 'critical',
              title: `Gateway Offline: ${gatewayLabel}`,
              message: `O gateway de pagamento ${gatewayLabel} está ${result.status === 'offline' ? 'fora do ar' : 'com degradação'}. Seus clientes podem ter dificuldades para pagar.`,
              metadata: {
                gateway: result.gateway,
                gatewayStatus: result.status,
                responseTimeMs: result.responseTimeMs,
                error: result.error,
              },
              is_read: false,
            })
            alertsCreated++
          }
        }
      }
    }
  }

  return { checked: results.length, alerts: alertsCreated }
}

/**
 * Obter ultimo status de cada gateway
 */
export async function getLatestGatewayStatuses(
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<Record<GatewayName, { status: GatewayStatus; responseTimeMs: number; checkedAt: string } | null>> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const result: Record<string, any> = {}

  for (const config of GATEWAY_CONFIGS) {
    const { data } = await supabase
      .from('gateway_status')
      .select('status, response_time_ms, checked_at')
      .eq('gateway', config.name)
      .order('checked_at', { ascending: false })
      .limit(1)

    result[config.name] = data && data.length > 0
      ? { status: data[0].status, responseTimeMs: data[0].response_time_ms, checkedAt: data[0].checked_at }
      : null
  }

  return result as any
}

export { GATEWAY_CONFIGS }
