/**
 * Serviço de cálculo de Uptime / SLA mensal.
 *
 * Calcula o percentual de disponibilidade de cada loja
 * baseado nos dados de store_uptime_daily e alertas de downtime.
 */

import { createClient } from '@supabase/supabase-js'

export interface StoreUptimeResult {
  storeId: string
  storeName: string
  uptimePercent: number
  totalDowntimeMinutes: number
  totalChecks: number
  successfulChecks: number
  avgResponseTimeMs: number | null
  status: 'excellent' | 'good' | 'degraded' | 'poor'
}

export interface UptimeSLAResult {
  stores: StoreUptimeResult[]
  overallUptimePercent: number
  period: { start: string; end: string }
}

/**
 * Calcula o uptime do mês corrente para todas as lojas do usuário.
 */
export async function calculateMonthlyUptime(userId: string): Promise<UptimeSLAResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Buscar lojas do usuário
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!stores || stores.length === 0) {
    return {
      stores: [],
      overallUptimePercent: 100,
      period: { start: monthStart.toISOString(), end: monthEnd.toISOString() },
    }
  }

  const storeIds = stores.map(s => s.id)

  // Buscar dados de uptime diário
  const { data: uptimeData } = await supabase
    .from('store_uptime_daily')
    .select('*')
    .in('store_id', storeIds)
    .gte('date', monthStart.toISOString().split('T')[0])
    .lte('date', monthEnd.toISOString().split('T')[0])

  // Fallback: calcular uptime via alertas de LOJA_OFFLINE/LOJA_ONLINE
  const { data: downtimeAlerts } = await supabase
    .from('alerts')
    .select('store_id, type, created_at, metadata')
    .in('store_id', storeIds)
    .in('type', ['LOJA_OFFLINE', 'LOJA_ONLINE'])
    .gte('created_at', monthStart.toISOString())
    .order('created_at', { ascending: true })

  const uptimeByStore = new Map<string, {
    totalChecks: number
    successfulChecks: number
    totalDowntimeMinutes: number
    responseTimes: number[]
  }>()

  // Processar dados de uptime diário
  for (const record of uptimeData || []) {
    const existing = uptimeByStore.get(record.store_id) || {
      totalChecks: 0, successfulChecks: 0, totalDowntimeMinutes: 0, responseTimes: []
    }
    existing.totalChecks += record.total_checks
    existing.successfulChecks += record.successful_checks
    existing.totalDowntimeMinutes += record.total_downtime_minutes
    if (record.avg_response_time_ms) {
      existing.responseTimes.push(record.avg_response_time_ms)
    }
    uptimeByStore.set(record.store_id, existing)
  }

  // Se não houver dados de uptime diário, calcular via alertas
  if (!uptimeData || uptimeData.length === 0) {
    for (const store of stores) {
      const storeAlerts = (downtimeAlerts || []).filter(a => a.store_id === store.id)
      let totalDowntimeMinutes = 0

      for (let i = 0; i < storeAlerts.length; i++) {
        const alert = storeAlerts[i]
        if (alert.type === 'LOJA_OFFLINE') {
          // Encontrar próximo LOJA_ONLINE ou usar agora
          const nextOnline = storeAlerts.find(
            (a, idx) => idx > i && a.type === 'LOJA_ONLINE'
          )
          const offlineAt = new Date(alert.created_at)
          const onlineAt = nextOnline ? new Date(nextOnline.created_at) : now
          const minutes = Math.round((onlineAt.getTime() - offlineAt.getTime()) / 60000)
          totalDowntimeMinutes += minutes
        }
      }

      // Total de minutos no mês até agora
      const minutesInPeriod = Math.round(
        (now.getTime() - monthStart.getTime()) / 60000
      )
      const totalChecks = Math.max(1, Math.round(minutesInPeriod / 10)) // check cada 10 min
      const failedChecks = Math.round(totalDowntimeMinutes / 10)

      uptimeByStore.set(store.id, {
        totalChecks,
        successfulChecks: Math.max(0, totalChecks - failedChecks),
        totalDowntimeMinutes,
        responseTimes: [],
      })
    }
  }

  const storeResults: StoreUptimeResult[] = stores.map(store => {
    const data = uptimeByStore.get(store.id) || {
      totalChecks: 1, successfulChecks: 1, totalDowntimeMinutes: 0, responseTimes: []
    }

    const uptimePercent = data.totalChecks > 0
      ? Math.round((data.successfulChecks / data.totalChecks) * 10000) / 100
      : 100

    const avgResponseTimeMs = data.responseTimes.length > 0
      ? Math.round(data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length)
      : null

    let status: StoreUptimeResult['status'] = 'excellent'
    if (uptimePercent < 95) status = 'poor'
    else if (uptimePercent < 99) status = 'degraded'
    else if (uptimePercent < 99.9) status = 'good'

    return {
      storeId: store.id,
      storeName: store.name,
      uptimePercent,
      totalDowntimeMinutes: data.totalDowntimeMinutes,
      totalChecks: data.totalChecks,
      successfulChecks: data.successfulChecks,
      avgResponseTimeMs,
      status,
    }
  })

  const overallUptimePercent = storeResults.length > 0
    ? Math.round(
        storeResults.reduce((sum, s) => sum + s.uptimePercent, 0) / storeResults.length * 100
      ) / 100
    : 100

  return {
    stores: storeResults,
    overallUptimePercent,
    period: { start: monthStart.toISOString(), end: monthEnd.toISOString() },
  }
}

/**
 * Registra um snapshot de uptime diário para uma loja.
 * Chamado pelo cron de check-status.
 */
export async function recordUptimeSnapshot(
  supabase: any,
  storeId: string,
  isOnline: boolean,
  responseTimeMs: number | null
) {
  const today = new Date().toISOString().split('T')[0]

  // Upsert: incrementar contadores do dia
  const { data: existing } = await supabase
    .from('store_uptime_daily')
    .select('*')
    .eq('store_id', storeId)
    .eq('date', today)
    .single()

  if (existing) {
    const newTotalChecks = existing.total_checks + 1
    const newSuccessfulChecks = existing.successful_checks + (isOnline ? 1 : 0)
    const newDowntime = existing.total_downtime_minutes + (isOnline ? 0 : 10)

    // Média incremental de response time
    let newAvgResponse = existing.avg_response_time_ms
    if (responseTimeMs !== null) {
      if (existing.avg_response_time_ms) {
        newAvgResponse = Math.round(
          (existing.avg_response_time_ms * existing.total_checks + responseTimeMs) / newTotalChecks
        )
      } else {
        newAvgResponse = responseTimeMs
      }
    }

    await supabase
      .from('store_uptime_daily')
      .update({
        total_checks: newTotalChecks,
        successful_checks: newSuccessfulChecks,
        total_downtime_minutes: newDowntime,
        avg_response_time_ms: newAvgResponse,
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('store_uptime_daily')
      .insert({
        store_id: storeId,
        date: today,
        total_checks: 1,
        successful_checks: isOnline ? 1 : 0,
        total_downtime_minutes: isOnline ? 0 : 10,
        avg_response_time_ms: responseTimeMs,
      })
  }
}
