'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, FileText, Settings, Trash2, Plus, Edit } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id?: string
  metadata?: any
  created_at: string
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  useRealtimeSubscription({
    channel: 'activity-audit-logs',
    table: 'audit_logs',
    onChange: () => loadLogs(),
  })

  const loadLogs = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    setLogs(data || [])
    setLoading(false)
  }

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return <Plus className="h-4 w-4 text-green-600" />
    if (action.includes('updated')) return <Edit className="h-4 w-4 text-blue-600" />
    if (action.includes('deleted')) return <Trash2 className="h-4 w-4 text-red-600" />
    if (action.includes('toggled')) return <Settings className="h-4 w-4 text-orange-600" />
    return <FileText className="h-4 w-4 text-muted-foreground" />
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'store.created': 'Loja criada',
      'store.updated': 'Loja atualizada',
      'store.deleted': 'Loja removida',
      'alert.dismissed': 'Alerta marcado como lido',
      'alert.deleted': 'Alerta excluído',
      'rule.created': 'Regra de alerta criada',
      'rule.updated': 'Regra de alerta atualizada',
      'rule.deleted': 'Regra de alerta excluída',
      'rule.toggled': 'Regra de alerta ativada/desativada',
      'settings.updated': 'Configurações atualizadas',
      'export.generated': 'Relatório exportado',
      'subscription.changed': 'Assinatura alterada',
    }
    return labels[action] || action
  }

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      store: 'Loja',
      alert: 'Alerta',
      alert_rule: 'Regra',
      user_profile: 'Perfil',
      product: 'Produto',
      export: 'Exportação',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando atividades...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Registro de Atividades</h1>
          <p className="text-muted-foreground">
            Histórico de ações realizadas na sua conta
          </p>
        </div>

        {logs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma atividade registrada</h3>
              <p className="text-muted-foreground text-center">
                Suas ações serão registradas aqui para auditoria
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Últimas Atividades</CardTitle>
              <CardDescription>
                Mostrando as últimas 100 ações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getActionLabel(log.action)}</p>
                        <Badge variant="outline" className="text-xs">
                          {getEntityTypeLabel(log.entity_type)}
                        </Badge>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {log.metadata.name && `Nome: ${log.metadata.name}`}
                          {log.metadata.domain && ` • Domínio: ${log.metadata.domain}`}
                          {log.metadata.count && ` • Quantidade: ${log.metadata.count}`}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
