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

    // Buscar estatísticas
    const [storesRes, productsRes, alertsRes] = await Promise.all([
      supabase.from('stores').select('*', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('products').select('*', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('alerts').select('*', { count: 'exact' }).eq('is_read', false),
    ])

    const storesOnline = storesRes.data?.filter((s) => s.status === 'online').length || 0

    setStats({
      stores: storesRes.count || 0,
      products: productsRes.count || 0,
      alerts: alertsRes.count || 0,
      storesOnline,
    })

    // Buscar alertas recentes
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*, stores(name)')
      .order('created_at', { ascending: false })
      .limit(5)

    setRecentAlerts(alerts || [])
    setLoading(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
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
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
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
