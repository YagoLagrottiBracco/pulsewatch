'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Mail, MessageSquare, Trash2 } from 'lucide-react'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('alerts')
      .select('*, stores(name, domain)')
      .order('created_at', { ascending: false })

    setAlerts(data || [])
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', id)

    if (!error) {
      loadAlerts()
    }
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id)

    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .in('id', unreadIds)

    if (!error) {
      loadAlerts()
    }
  }

  const deleteAlert = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este alerta?')) return

    const supabase = createClient()
    const { error } = await supabase.from('alerts').delete().eq('id', id)

    if (!error) {
      loadAlerts()
    }
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

  const getAlertIcon = (type: string) => {
    return <AlertTriangle className="h-5 w-5" />
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'unread') return !alert.is_read
    if (filter === 'read') return alert.is_read
    return true
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando alertas...</p>
        </div>
      </DashboardLayout>
    )
  }

  const unreadCount = alerts.filter((a) => !a.is_read).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alertas</h1>
            <p className="text-muted-foreground">
              Notificações do sistema de monitoramento
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todos como lido
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Todos ({alerts.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
          >
            Não lidos ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            onClick={() => setFilter('read')}
          >
            Lidos ({alerts.length - unreadCount})
          </Button>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {alerts.length === 0
                  ? 'Nenhum alerta registrado'
                  : 'Nenhum alerta nesta categoria'}
              </p>
              <p className="text-muted-foreground">
                {alerts.length === 0
                  ? 'Os alertas aparecerão aqui quando detectados'
                  : 'Tente ajustar os filtros'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`${!alert.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {!alert.is_read && (
                            <Badge variant="default" className="bg-blue-500">
                              Novo
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base">
                          {alert.message}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{alert.stores?.name}</span>
                        <span>•</span>
                        <span>{new Date(alert.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        {alert.email_sent && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Mail className="h-3 w-3" />
                            <span>Email enviado</span>
                          </div>
                        )}
                        {alert.telegram_sent && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <MessageSquare className="h-3 w-3" />
                            <span>Telegram enviado</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!alert.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como lido
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{alerts.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Alertas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">
                    {alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Críticos/Altos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {alerts.filter((a) => a.email_sent).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Emails Enviados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">
                    {alerts.filter((a) => a.telegram_sent).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Telegram Enviados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
