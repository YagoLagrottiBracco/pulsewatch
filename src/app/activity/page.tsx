'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Clock, FileText, Settings, Trash2, Plus, Edit, Eye, Archive } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id?: string
  metadata?: any
  created_at: string
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `ha ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `ha ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `ha ${days} dias`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState<boolean | null>(null)
  const [teamLogs, setTeamLogs] = useState<any[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamError, setTeamError] = useState(false)
  const [teamLoaded, setTeamLoaded] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    const handler = () => loadLogs()
    window.addEventListener('pw:activity-changed', handler)
    return () => window.removeEventListener('pw:activity-changed', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkOwnership = async (userId: string) => {
    const supabase = createClient()
    const { data: ownedMembers } = await supabase
      .from('account_members')
      .select('id')
      .eq('account_owner_id', userId)
      .eq('status', 'active')
      .limit(1)

    setIsOwner((ownedMembers?.length ?? 0) > 0)
  }

  const loadLogs = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    setCurrentUserId(user.id)
    checkOwnership(user.id)

    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    setLogs(data || [])
    setLoading(false)
  }

  const loadTeamFeed = async () => {
    if (!currentUserId) return
    setTeamLoading(true)
    setTeamError(false)

    try {
      const supabase = createClient()

      // Step 1: Get active members with emails
      const { data: members } = await supabase
        .from('account_members')
        .select('user_id, email')
        .eq('account_owner_id', currentUserId)
        .eq('status', 'active')
        .not('user_id', 'is', null)

      if (!members || members.length === 0) {
        setTeamLogs([])
        setTeamLoading(false)
        setTeamLoaded(true)
        return
      }

      // Step 2: Build email lookup map
      const emailMap: Record<string, string> = {}
      const userIds: string[] = []
      members.forEach((m: any) => {
        emailMap[m.user_id] = m.email
        userIds.push(m.user_id)
      })

      // Step 3: Fetch alert-scoped audit logs for those members
      const { data: fetchedLogs } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, entity_type, entity_id, metadata, created_at')
        .in('user_id', userIds)
        .like('action', 'alert.%')
        .order('created_at', { ascending: false })
        .limit(50)

      // Step 4: Enrich with member email
      const enriched = (fetchedLogs || []).map((log: any) => ({
        ...log,
        memberEmail: log.user_id === currentUserId ? 'Voce' : (emailMap[log.user_id] || log.user_id),
      }))

      setTeamLogs(enriched)
      setTeamLoaded(true)
    } catch (err) {
      console.error('Failed to load team feed:', err)
      setTeamError(true)
    } finally {
      setTeamLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    if (value === 'team' && !teamLoaded && !teamLoading) {
      loadTeamFeed()
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return <Plus className="h-4 w-4 text-green-600" />
    if (action.includes('updated')) return <Edit className="h-4 w-4 text-blue-600" />
    if (action.includes('deleted')) return <Trash2 className="h-4 w-4 text-red-600" />
    if (action.includes('toggled')) return <Settings className="h-4 w-4 text-orange-600" />
    return <FileText className="h-4 w-4 text-muted-foreground" />
  }

  const getTeamActionIcon = (action: string) => {
    if (action === 'alert.viewed') return <Eye className="h-4 w-4 text-muted-foreground" />
    if (action === 'alert.dismissed') return <Archive className="h-4 w-4 text-muted-foreground" />
    if (action === 'alert.deleted') return <Trash2 className="h-4 w-4 text-red-600" />
    return <FileText className="h-4 w-4 text-muted-foreground" />
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'store.created': 'Loja criada',
      'store.updated': 'Loja atualizada',
      'store.deleted': 'Loja removida',
      'alert.viewed': 'Visualizou alerta',
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

  const myActivityContent = (
    <>
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
    </>
  )

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

        {isOwner === null ? (
          // Still checking ownership — show existing content without tabs
          myActivityContent
        ) : isOwner ? (
          <Tabs defaultValue="my-activity" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="my-activity">Minha Atividade</TabsTrigger>
              <TabsTrigger value="team">Time</TabsTrigger>
            </TabsList>
            <TabsContent value="my-activity">
              {myActivityContent}
            </TabsContent>
            <TabsContent value="team">
              {teamLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Carregando atividades do time...</p>
                </div>
              ) : teamError ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                      Nao foi possivel carregar a atividade do time. Tente novamente.
                    </p>
                  </CardContent>
                </Card>
              ) : teamLogs.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma atividade do time ainda</h3>
                    <p className="text-muted-foreground text-center">
                      As acoes dos membros aparecerao aqui quando interagirem com alertas
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade do Time</CardTitle>
                    <CardDescription>Ultimas 50 acoes dos membros</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamLogs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                          <div className="p-2 rounded-lg bg-muted">
                            {getTeamActionIcon(log.action)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{getActionLabel(log.action)}</p>
                              <Badge variant="outline" className="text-xs">Alerta</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{log.memberEmail}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {getRelativeTime(log.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // Non-owner: render existing content directly without Tabs wrapper
          myActivityContent
        )}
      </div>
    </DashboardLayout>
  )
}
