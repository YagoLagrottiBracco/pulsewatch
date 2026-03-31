'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store, Package, AlertTriangle, TrendingUp, TrendingDown, Shield, Clock, PackageX, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import OnboardingWidget from '@/components/onboarding-widget'
import NpsModal from '@/components/nps-modal'

interface UptimeStore {
  storeId: string
  storeName: string
  uptimePercent: number
  totalDowntimeMinutes: number
  status: string
}

interface StockForecastItem {
  productId: string
  productName: string
  storeName: string
  currentStock: number
  avgDailySales: number
  daysUntilZero: number | null
  urgency: 'critical' | 'warning' | 'ok'
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showNps, setShowNps] = useState(false)
  const [npsInitialScore, setNpsInitialScore] = useState<number | undefined>(undefined)
  const [stats, setStats] = useState({
    stores: 0,
    products: 0,
    alerts: 0,
    storesOnline: 0,
  })
  const [monthlyLoss, setMonthlyLoss] = useState({
    totalLoss: 0,
    totalIncidents: 0,
    totalDowntimeMinutes: 0,
  })
  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Phase 4: new state
  const [weekComparison, setWeekComparison] = useState({
    alertsThisWeek: 0,
    alertsLastWeek: 0,
    ordersThisWeek: 0,
    ordersLastWeek: 0,
  })
  const [uptimeData, setUptimeData] = useState<{
    stores: UptimeStore[]
    overallUptimePercent: number
  } | null>(null)
  const [stockForecasts, setStockForecasts] = useState<StockForecastItem[]>([])
  const [userTier, setUserTier] = useState('free')

  useEffect(() => {
    checkAdminAndLoadData()

    // NPS from email link
    const npsScore = searchParams.get('nps_score')
    if (npsScore !== null) {
      setNpsInitialScore(parseInt(npsScore))
      setShowNps(true)
    }
  }, [])

  useEffect(() => {
    const handler = () => loadDashboardData()
    window.addEventListener('pw:alerts-changed', handler)
    window.addEventListener('pw:stores-changed', handler)
    return () => {
      window.removeEventListener('pw:alerts-changed', handler)
      window.removeEventListener('pw:stores-changed', handler)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAdminAndLoadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Redirect admins to admin panel
    if (adminData) {
      router.push('/admin')
      return
    }

    // Load normal dashboard data
    loadDashboardData()
  }

  const loadDashboardData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Buscar tier do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    const tier = profile?.subscription_tier || 'free'
    setUserTier(tier)

    // Buscar lojas do usuário primeiro
    const { data: userStores } = await supabase
      .from('stores')
      .select('id, status')
      .eq('user_id', user.id)

    const storeIds = userStores?.map(s => s.id) || []
    const storesOnline = userStores?.filter((s) => s.status === 'online').length || 0

    // Buscar estatísticas
    let productsCount = 0
    let alertsCount = 0

    if (storeIds.length > 0) {
      const [productsRes, alertsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .in('store_id', storeIds),
        supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .in('store_id', storeIds)
          .eq('is_read', false),
      ])

      productsCount = productsRes.count || 0
      alertsCount = alertsRes.count || 0
    }

    setStats({
      stores: userStores?.length || 0,
      products: productsCount,
      alerts: alertsCount,
      storesOnline,
    })

    // Buscar alertas recentes
    if (storeIds.length > 0) {
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*, stores(name)')
        .in('store_id', storeIds)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentAlerts(alerts || [])
    }

    // Buscar perdas financeiras do mês corrente
    try {
      const res = await fetch('/api/stores/financial-loss?period=month')
      if (res.ok) {
        const json = await res.json()
        setMonthlyLoss({
          totalLoss: json.summary.total_estimated_loss,
          totalIncidents: json.summary.total_incidents,
          totalDowntimeMinutes: json.summary.total_downtime_minutes,
        })
      }
    } catch {
      // silently ignore
    }

    // Phase 4: Comparativo semanal
    if (storeIds.length > 0) {
      const now = new Date()
      const thisWeekStart = new Date(now)
      thisWeekStart.setDate(now.getDate() - 7)
      const lastWeekStart = new Date(thisWeekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)

      const [thisWeekAlerts, lastWeekAlerts, thisWeekOrders, lastWeekOrders] = await Promise.all([
        supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .in('store_id', storeIds)
          .gte('created_at', thisWeekStart.toISOString()),
        supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .in('store_id', storeIds)
          .gte('created_at', lastWeekStart.toISOString())
          .lt('created_at', thisWeekStart.toISOString()),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('store_id', storeIds)
          .gte('order_date', thisWeekStart.toISOString()),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('store_id', storeIds)
          .gte('order_date', lastWeekStart.toISOString())
          .lt('order_date', thisWeekStart.toISOString()),
      ])

      setWeekComparison({
        alertsThisWeek: thisWeekAlerts.count || 0,
        alertsLastWeek: lastWeekAlerts.count || 0,
        ordersThisWeek: thisWeekOrders.count || 0,
        ordersLastWeek: lastWeekOrders.count || 0,
      })
    }

    // Phase 4: Uptime SLA
    try {
      const res = await fetch('/api/uptime-sla')
      if (res.ok) {
        const json = await res.json()
        setUptimeData(json)
      }
    } catch {
      // silently ignore
    }

    // Phase 4: Stock Forecast (business+ only)
    if (['business', 'agency'].includes(tier)) {
      try {
        const res = await fetch('/api/stock-forecast')
        if (res.ok) {
          const json = await res.json()
          setStockForecasts(json.forecasts || [])
        }
      } catch {
        // silently ignore
      }
    }

    setLoading(false)
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600 text-white hover:bg-red-700">Crítico</Badge>
      case 'high':
        return <Badge className="bg-red-600 text-white hover:bg-red-700">Alto</Badge>
      case 'medium':
        return <Badge className="bg-yellow-600 text-white hover:bg-yellow-700">Médio</Badge>
      case 'low':
        return <Badge className="bg-green-600 text-white hover:bg-green-700">Baixo</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getTrendInfo = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return { icon: <Minus className="h-3 w-3" />, text: 'Estável', color: 'text-muted-foreground' }
    if (previous === 0) return { icon: <ArrowUp className="h-3 w-3" />, text: 'Novo', color: 'text-blue-600' }
    const percent = Math.round(((current - previous) / previous) * 100)
    if (percent > 5) return { icon: <ArrowUp className="h-3 w-3" />, text: `+${percent}%`, color: 'text-red-600' }
    if (percent < -5) return { icon: <ArrowDown className="h-3 w-3" />, text: `${percent}%`, color: 'text-green-600' }
    return { icon: <Minus className="h-3 w-3" />, text: 'Estável', color: 'text-muted-foreground' }
  }

  const getUptimeColor = (percent: number) => {
    if (percent >= 99.9) return 'text-green-600'
    if (percent >= 99) return 'text-blue-600'
    if (percent >= 95) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getUptimeBgColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'degraded': return 'bg-yellow-500'
      case 'poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  const alertTrend = getTrendInfo(weekComparison.alertsThisWeek, weekComparison.alertsLastWeek)
  // For orders, invert colors — more orders is good
  const orderTrend = (() => {
    const t = getTrendInfo(weekComparison.ordersThisWeek, weekComparison.ordersLastWeek)
    // Swap colors: green for up (good), red for down (bad)
    if (t.text.startsWith('+')) return { ...t, color: 'text-green-600' }
    if (t.text.startsWith('-')) return { ...t, color: 'text-red-600' }
    return t
  })()

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do monitoramento das suas lojas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lojas</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stores}</div>
              <p className="text-xs text-muted-foreground">
                {stats.storesOnline} online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.products}</div>
              <p className="text-xs text-muted-foreground">
                Sincronizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.alerts}</div>
              <p className="text-xs text-muted-foreground">
                Não lidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.stores > 0
                  ? Math.round((stats.storesOnline / stats.stores) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Uptime
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                Perdas do Mês
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {monthlyLoss.totalLoss.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                {monthlyLoss.totalIncidents} incidente{monthlyLoss.totalIncidents !== 1 ? 's' : ''} •{' '}
                {Math.round(monthlyLoss.totalDowntimeMinutes / 60)}h{monthlyLoss.totalDowntimeMinutes % 60}min offline
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Phase 4: Weekly Comparison */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas - Semana</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekComparison.alertsThisWeek}</div>
              <div className={`flex items-center gap-1 text-xs ${alertTrend.color}`}>
                {alertTrend.icon}
                <span>{alertTrend.text} vs semana anterior ({weekComparison.alertsLastWeek})</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos - Semana</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weekComparison.ordersThisWeek}</div>
              <div className={`flex items-center gap-1 text-xs ${orderTrend.color}`}>
                {orderTrend.icon}
                <span>{orderTrend.text} vs semana anterior ({weekComparison.ordersLastWeek})</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 4: Uptime SLA */}
        {uptimeData && uptimeData.stores.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Uptime / SLA Mensal
                  </CardTitle>
                  <CardDescription>
                    Disponibilidade das suas lojas no mês atual
                  </CardDescription>
                </div>
                <div className={`text-3xl font-bold ${getUptimeColor(uptimeData.overallUptimePercent)}`}>
                  {uptimeData.overallUptimePercent}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uptimeData.stores.map((store) => (
                  <div key={store.storeId} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getUptimeBgColor(store.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{store.storeName}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {store.totalDowntimeMinutes > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {store.totalDowntimeMinutes}min offline
                        </span>
                      )}
                      <span className={`font-semibold ${getUptimeColor(store.uptimePercent)}`}>
                        {store.uptimePercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase 4: Stock Forecast (business+ only) */}
        {['business', 'agency'].includes(userTier) && stockForecasts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <PackageX className="h-5 w-5" />
                Previsão de Estoque
              </CardTitle>
              <CardDescription className="text-orange-600/70 dark:text-orange-400/70">
                Produtos que podem ficar sem estoque em breve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockForecasts.slice(0, 5).map((item) => (
                  <div key={item.productId} className="flex items-center justify-between border-b border-orange-200 dark:border-orange-800 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.storeName}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          item.urgency === 'critical'
                            ? 'bg-red-600 text-white'
                            : item.urgency === 'warning'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-green-600 text-white'
                        }>
                          {item.daysUntilZero !== null
                            ? `~${item.daysUntilZero} dia${item.daysUntilZero !== 1 ? 's' : ''}`
                            : 'N/A'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.currentStock} un. • {item.avgDailySales}/dia
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas Recentes</CardTitle>
            <CardDescription>
              Últimas notificações do seu sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum alerta registrado ainda
              </p>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between border-b pb-4 last:border-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(alert.severity)}
                        {!alert.is_read &&
                          new Date().getTime() - new Date(alert.created_at).getTime() < 24 * 60 * 60 * 1000 && (
                          <Badge className="bg-blue-600 text-white">NOVO</Badge>
                        )}
                        <p className="font-medium">{alert.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.stores?.name} •{' '}
                        {new Date(alert.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {alert.email_sent && (
                        <Badge variant="outline">Email</Badge>
                      )}
                      {alert.telegram_sent && (
                        <Badge variant="outline">Telegram</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {stats.stores === 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Comece Agora</CardTitle>
              <CardDescription>
                Adicione sua primeira loja para começar o monitoramento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/stores"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Adicionar Loja
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
