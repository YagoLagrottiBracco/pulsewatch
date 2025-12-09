'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store, Package, AlertTriangle, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    stores: 0,
    products: 0,
    alerts: 0,
    storesOnline: 0,
  })
  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        </div>

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
