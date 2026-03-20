'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Package, DollarSign, AlertCircle } from 'lucide-react'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'

interface AlertStats {
  date: string
  count: number
}

interface StoreStats {
  name: string
  alerts: number
  products: number
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [alertTrend, setAlertTrend] = useState<AlertStats[]>([])
  const [storeStats, setStoreStats] = useState<StoreStats[]>([])
  const [severityData, setSeverityData] = useState<any[]>([])
  const [totalAlerts, setTotalAlerts] = useState(0)
  const [avgAlertsPerDay, setAvgAlertsPerDay] = useState(0)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  useRealtimeSubscription({
    channel: 'analytics-alerts',
    table: 'alerts',
    onChange: () => loadAnalytics(),
  })

  useRealtimeSubscription({
    channel: 'analytics-products',
    table: 'products',
    onChange: () => loadAnalytics(),
  })

  const loadAnalytics = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', user.id)

    const storeIds = stores?.map(s => s.id) || []

    if (storeIds.length === 0) {
      setLoading(false)
      return
    }

    const { data: alerts } = await supabase
      .from('alerts')
      .select('*, stores(name)')
      .in('store_id', storeIds)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (!alerts) {
      setLoading(false)
      return
    }

    setTotalAlerts(alerts.length)
    setAvgAlertsPerDay(Number((alerts.length / daysAgo).toFixed(1)))

    const alertsByDate: Record<string, number> = {}
    const alertsByStore: Record<string, { alerts: number, products: number }> = {}
    const alertsBySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    alerts.forEach(alert => {
      const date = new Date(alert.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      })
      alertsByDate[date] = (alertsByDate[date] || 0) + 1

      const storeName = alert.stores?.name || 'Unknown'
      if (!alertsByStore[storeName]) {
        alertsByStore[storeName] = { alerts: 0, products: 0 }
      }
      alertsByStore[storeName].alerts++

      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1
    })

    const { data: products } = await supabase
      .from('products')
      .select('store_id, stores(name)')
      .in('store_id', storeIds)

    products?.forEach(product => {
      const storeName = (product.stores as any)?.name || 'Unknown'
      if (alertsByStore[storeName]) {
        alertsByStore[storeName].products++
      }
    })

    const trendData = Object.entries(alertsByDate).map(([date, count]) => ({
      date,
      count
    }))

    const storeData = Object.entries(alertsByStore).map(([name, data]) => ({
      name,
      alerts: data.alerts,
      products: data.products
    }))

    const severityColors: Record<string, string> = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    }

    const severityLabels: Record<string, string> = {
      low: 'Baixo',
      medium: 'Médio',
      high: 'Alto',
      critical: 'Crítico'
    }

    const severityChartData = Object.entries(alertsBySeverity)
      .filter(([_, count]) => count > 0)
      .map(([severity, count]) => ({
        name: severityLabels[severity],
        value: count,
        color: severityColors[severity]
      }))

    setAlertTrend(trendData)
    setStoreStats(storeData)
    setSeverityData(severityChartData)
    setLoading(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Análise detalhada dos seus alertas e métricas
            </p>
          </div>
          <Tabs value={timeRange} onValueChange={(v: string) => setTimeRange(v as any)}>
            <TabsList>
              <TabsTrigger value="7d">7 dias</TabsTrigger>
              <TabsTrigger value="30d">30 dias</TabsTrigger>
              <TabsTrigger value="90d">90 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Últimos {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgAlertsPerDay}</div>
              <p className="text-xs text-muted-foreground">
                Alertas por dia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lojas Monitoradas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStats.length}</div>
              <p className="text-xs text-muted-foreground">
                Ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storeStats.reduce((acc, s) => acc + s.products, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total sincronizados
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Alertas</CardTitle>
              <CardDescription>
                Volume de alertas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={alertTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="Alertas" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas por Severidade</CardTitle>
              <CardDescription>
                Distribuição por nível de criticidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alertas por Loja</CardTitle>
            <CardDescription>
              Comparação de alertas entre suas lojas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {storeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="alerts" fill="#8884d8" name="Alertas" />
                  <Bar dataKey="products" fill="#82ca9d" name="Produtos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma loja cadastrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
