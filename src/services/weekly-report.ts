/**
 * Serviço de relatório semanal automático.
 *
 * Gera e envia relatório semanal por email toda segunda-feira.
 * Gate: pro+ apenas.
 */

import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './email'
import { calculateMonthlyUptime } from './uptime-sla'

const PRO_TIERS = ['pro', 'business', 'agency']

export interface WeeklyReportData {
  userName: string
  period: { start: string; end: string }
  stores: {
    total: number
    online: number
    offline: number
  }
  alerts: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    byType: Record<string, number>
  }
  comparison: {
    alertsThisWeek: number
    alertsLastWeek: number
    alertsTrend: 'up' | 'down' | 'stable'
    alertsTrendPercent: number
  }
  topProducts: Array<{ name: string; stock: number; storeName: string }>
  uptime: {
    overall: number
    totalDowntimeMinutes: number
  }
  totalOrders: number
  totalRevenue: number
}

/**
 * Gera os dados do relatório semanal para um usuário.
 */
export async function generateWeeklyReportData(userId: string): Promise<WeeklyReportData | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Período: semana passada (segunda a domingo)
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() - now.getDay()) // último domingo
  weekEnd.setHours(23, 59, 59, 999)
  const weekStart = new Date(weekEnd)
  weekStart.setDate(weekEnd.getDate() - 6) // segunda anterior
  weekStart.setHours(0, 0, 0, 0)

  // Semana anterior (para comparação)
  const prevWeekEnd = new Date(weekStart)
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)
  prevWeekEnd.setHours(23, 59, 59, 999)
  const prevWeekStart = new Date(prevWeekEnd)
  prevWeekStart.setDate(prevWeekEnd.getDate() - 6)
  prevWeekStart.setHours(0, 0, 0, 0)

  // Perfil do usuário
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!profile) return null

  // Lojas
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, status')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!stores || stores.length === 0) return null

  const storeIds = stores.map(s => s.id)
  const storesOnline = stores.filter(s => s.status === 'online').length

  // Alertas da semana
  const { data: weekAlerts } = await supabase
    .from('alerts')
    .select('type, severity')
    .in('store_id', storeIds)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString())

  // Alertas da semana anterior
  const { data: prevWeekAlerts } = await supabase
    .from('alerts')
    .select('id')
    .in('store_id', storeIds)
    .gte('created_at', prevWeekStart.toISOString())
    .lte('created_at', prevWeekEnd.toISOString())

  const alerts = weekAlerts || []
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 }
  const byType: Record<string, number> = {}

  for (const alert of alerts) {
    severityCounts[alert.severity as keyof typeof severityCounts]++
    byType[alert.type] = (byType[alert.type] || 0) + 1
  }

  const alertsThisWeek = alerts.length
  const alertsLastWeek = prevWeekAlerts?.length || 0
  let alertsTrend: 'up' | 'down' | 'stable' = 'stable'
  let alertsTrendPercent = 0

  if (alertsLastWeek > 0) {
    alertsTrendPercent = Math.round(((alertsThisWeek - alertsLastWeek) / alertsLastWeek) * 100)
    if (alertsTrendPercent > 5) alertsTrend = 'up'
    else if (alertsTrendPercent < -5) alertsTrend = 'down'
  }

  // Produtos com estoque baixo
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('name, stock_quantity, store_id, stores(name)')
    .in('store_id', storeIds)
    .gt('stock_quantity', 0)
    .lte('stock_quantity', 10)
    .order('stock_quantity', { ascending: true })
    .limit(5)

  const topProducts = (lowStockProducts || []).map(p => ({
    name: p.name,
    stock: p.stock_quantity,
    storeName: (p.stores as any)?.name || 'Unknown',
  }))

  // Pedidos da semana
  const { data: weekOrders } = await supabase
    .from('orders')
    .select('total')
    .in('store_id', storeIds)
    .gte('order_date', weekStart.toISOString())
    .lte('order_date', weekEnd.toISOString())

  const totalOrders = weekOrders?.length || 0
  const totalRevenue = weekOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

  // Uptime
  const uptimeResult = await calculateMonthlyUptime(userId)

  return {
    userName: profile.full_name || profile.email,
    period: { start: weekStart.toISOString(), end: weekEnd.toISOString() },
    stores: {
      total: stores.length,
      online: storesOnline,
      offline: stores.length - storesOnline,
    },
    alerts: {
      total: alertsThisWeek,
      ...severityCounts,
      byType,
    },
    comparison: {
      alertsThisWeek,
      alertsLastWeek,
      alertsTrend,
      alertsTrendPercent,
    },
    topProducts,
    uptime: {
      overall: uptimeResult.overallUptimePercent,
      totalDowntimeMinutes: uptimeResult.stores.reduce((sum, s) => sum + s.totalDowntimeMinutes, 0),
    },
    totalOrders,
    totalRevenue,
  }
}

/**
 * Gera o HTML do email do relatório semanal.
 */
export function generateWeeklyReportHTML(data: WeeklyReportData): string {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const trendIcon = data.comparison.alertsTrend === 'down' ? '📉' : data.comparison.alertsTrend === 'up' ? '📈' : '➡️'
  const trendColor = data.comparison.alertsTrend === 'down' ? '#10b981' : data.comparison.alertsTrend === 'up' ? '#ef4444' : '#6b7280'
  const trendText = data.comparison.alertsTrend === 'down'
    ? `${Math.abs(data.comparison.alertsTrendPercent)}% menos alertas`
    : data.comparison.alertsTrend === 'up'
    ? `${data.comparison.alertsTrendPercent}% mais alertas`
    : 'Estável'

  const lowStockRows = data.topProducts.map(p => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${p.storeName}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="color: ${p.stock <= 3 ? '#ef4444' : '#f59e0b'}; font-weight: bold;">${p.stock}</span>
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Semanal PulseWatch</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 24px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    .stats-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .stat-card { flex: 1; min-width: 120px; background: #f9fafb; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; color: #111827; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .trend-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 22px;">📊 Relatório Semanal</h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${formatDate(data.period.start)} a ${formatDate(data.period.end)}</p>
    </div>
    <div class="content">
      <p style="color: #374151;">Olá, <strong>${data.userName}</strong>! Aqui está o resumo da sua semana:</p>

      <div class="section">
        <div class="section-title">Visão Geral</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.stores.online}/${data.stores.total}</div>
            <div class="stat-label">Lojas Online</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.uptime.overall}%</div>
            <div class="stat-label">Uptime Mensal</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.totalOrders}</div>
            <div class="stat-label">Pedidos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(data.totalRevenue)}</div>
            <div class="stat-label">Receita</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Alertas</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.alerts.total}</div>
            <div class="stat-label">Total da Semana</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ef4444;">${data.alerts.critical + data.alerts.high}</div>
            <div class="stat-label">Críticos/Altos</div>
          </div>
        </div>
        <div style="margin-top: 12px; text-align: center;">
          <span class="trend-badge" style="background: ${trendColor}15; color: ${trendColor};">
            ${trendIcon} vs semana anterior: ${trendText}
          </span>
        </div>
      </div>

      ${data.topProducts.length > 0 ? `
      <div class="section">
        <div class="section-title">⚠️ Estoque Baixo</div>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Loja</th>
              <th style="text-align: center;">Estoque</th>
            </tr>
          </thead>
          <tbody>${lowStockRows}</tbody>
        </table>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Ver Dashboard Completo</a>
      </div>
    </div>
    <div class="footer">
      <p>Relatório gerado automaticamente pelo PulseWatch</p>
      <p>© ${new Date().getFullYear()} PulseWatch - Monitoramento de E-commerce</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Envia o relatório semanal para todos os usuários pro+.
 */
export async function sendWeeklyReports(): Promise<{ sent: number; errors: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Calcular week_start (segunda-feira da semana que acabou)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() - 6) // segunda da semana passada
  weekStart.setHours(0, 0, 0, 0)
  const weekStartDate = weekStart.toISOString().split('T')[0]

  // Buscar todos os usuários pro+ com email ativo
  const { data: users } = await supabase
    .from('user_profiles')
    .select('user_id, email, full_name, subscription_tier')
    .in('subscription_tier', PRO_TIERS)
    .eq('email_notifications', true)

  if (!users || users.length === 0) {
    return { sent: 0, errors: 0 }
  }

  let sent = 0
  let errors = 0

  for (const user of users) {
    try {
      // Verificar se já enviou esta semana
      const { data: existing } = await supabase
        .from('weekly_report_log')
        .select('id')
        .eq('user_id', user.user_id)
        .eq('week_start', weekStartDate)
        .single()

      if (existing) continue // Já enviado

      const reportData = await generateWeeklyReportData(user.user_id)
      if (!reportData) continue

      const html = generateWeeklyReportHTML(reportData)
      const success = await sendEmail({
        to: user.email,
        subject: `📊 Relatório Semanal PulseWatch — ${new Date(reportData.period.start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${new Date(reportData.period.end).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
        html,
      })

      if (success) {
        await supabase.from('weekly_report_log').insert({
          user_id: user.user_id,
          week_start: weekStartDate,
          channels_sent: ['email'],
          report_data: reportData,
        })
        sent++
      } else {
        errors++
      }
    } catch (error) {
      console.error(`Erro ao enviar relatório para ${user.email}:`, error)
      errors++
    }
  }

  return { sent, errors }
}
