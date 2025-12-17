'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Mail, MessageSquare, Trash2, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { exportToCSV, formatAlertForExport } from '@/lib/export-utils'
import { logAudit, AuditActions, EntityTypes } from '@/lib/audit-logger'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [stores, setStores] = useState<any[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('global')
  const [loadingStoreRules, setLoadingStoreRules] = useState(false)
  const [stockConfig, setStockConfig] = useState({
    lowStockThreshold: 5,
    enableLowStock: true,
    enableOutOfStock: true,
    enableBackInStock: true,
  })
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [inactivityConfig, setInactivityConfig] = useState({
    daysWithoutSync: 7,
    enableInactivityAlerts: true,
  })
  const [inactivityRuleId, setInactivityRuleId] = useState<string | null>(null)
  const [loadingInactivity, setLoadingInactivity] = useState(true)
  const [savingInactivity, setSavingInactivity] = useState(false)
  const [profile, setProfile] = useState<any | null>(null)

  useEffect(() => {
    loadAlerts()
    loadUserAndStores()
    loadStockAlertRules()
    loadInactivityRules()
  }, [])

  const loadUserAndStores = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('plan, subscription_tier')
      .eq('user_id', user.id)
      .maybeSingle()

    setProfile(profileData || null)

    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name, domain')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setStores(storesData || [])
  }

  const loadRulesForSelectedStore = async (storeId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const normalizedStoreId = storeId === 'global' ? null : storeId
    setLoadingStoreRules(true)

    try {
      const [stockRes, inactivityRes] = await Promise.all([
        supabase
          .from('alert_rules')
          .select('id, store_id, type, condition, is_active')
          .eq('user_id', user.id)
          .eq('type', 'STOCK_LEVEL')
          .eq('is_active', true)
          .eq('store_id', normalizedStoreId)
          .maybeSingle(),
        supabase
          .from('alert_rules')
          .select('id, store_id, type, condition, is_active')
          .eq('user_id', user.id)
          .eq('type', 'PRODUCT_INACTIVE')
          .eq('is_active', true)
          .eq('store_id', normalizedStoreId)
          .maybeSingle(),
      ])

      if (stockRes.data?.condition) {
        const condition: any = stockRes.data.condition
        setStockConfig({
          lowStockThreshold:
            typeof condition.lowStockThreshold === 'number' && condition.lowStockThreshold > 0
              ? condition.lowStockThreshold
              : 5,
          enableLowStock:
            typeof condition.enableLowStock === 'boolean' ? condition.enableLowStock : true,
          enableOutOfStock:
            typeof condition.enableOutOfStock === 'boolean' ? condition.enableOutOfStock : true,
          enableBackInStock:
            typeof condition.enableBackInStock === 'boolean' ? condition.enableBackInStock : true,
        })
        setCurrentRuleId(stockRes.data.id)
      } else {
        setCurrentRuleId(null)
      }

      if (inactivityRes.data?.condition) {
        const condition: any = inactivityRes.data.condition
        setInactivityConfig({
          daysWithoutSync:
            typeof condition.daysWithoutSync === 'number' && condition.daysWithoutSync > 0
              ? condition.daysWithoutSync
              : 7,
          enableInactivityAlerts:
            typeof condition.enableInactivityAlerts === 'boolean'
              ? condition.enableInactivityAlerts
              : true,
        })
        setInactivityRuleId(inactivityRes.data.id)
      } else {
        setInactivityRuleId(null)
      }
    } finally {
      setLoadingStoreRules(false)
    }
  }

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

  const loadInactivityRules = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoadingInactivity(false)
      return
    }

    const { data, error } = await supabase
      .from('alert_rules')
      .select('id, store_id, type, condition, is_active')
      .eq('user_id', user.id)
      .eq('type', 'PRODUCT_INACTIVE')
      .eq('is_active', true)

    if (error) {
      console.error('Erro ao carregar regras de inatividade:', error)
      setLoadingInactivity(false)
      return
    }

    if (!data || data.length === 0) {
      setLoadingInactivity(false)
      return
    }

    const rule = data.find((r: any) => !r.store_id) || data[0]

    if (rule && rule.condition) {
      const condition: any = rule.condition

      setInactivityConfig({
        daysWithoutSync:
          typeof condition.daysWithoutSync === 'number' && condition.daysWithoutSync > 0
            ? condition.daysWithoutSync
            : 7,
        enableInactivityAlerts:
          typeof condition.enableInactivityAlerts === 'boolean'
            ? condition.enableInactivityAlerts
            : true,
      })

      setInactivityRuleId(rule.id)
    }

    setLoadingInactivity(false)
  }

  const loadStockAlertRules = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoadingConfig(false)
      return
    }

    const { data, error } = await supabase
      .from('alert_rules')
      .select('id, store_id, type, condition, is_active')
      .eq('user_id', user.id)
      .eq('type', 'STOCK_LEVEL')
      .eq('is_active', true)

    if (error) {
      console.error('Erro ao carregar regras de alertas:', error)
      setLoadingConfig(false)
      return
    }

    if (!data || data.length === 0) {
      setLoadingConfig(false)
      return
    }

    const rule = data.find((r: any) => !r.store_id) || data[0]

    if (rule && rule.condition) {
      const condition: any = rule.condition

      setStockConfig({
        lowStockThreshold:
          typeof condition.lowStockThreshold === 'number' && condition.lowStockThreshold > 0
            ? condition.lowStockThreshold
            : 5,
        enableLowStock:
          typeof condition.enableLowStock === 'boolean'
            ? condition.enableLowStock
            : true,
        enableOutOfStock:
          typeof condition.enableOutOfStock === 'boolean'
            ? condition.enableOutOfStock
            : true,
        enableBackInStock:
          typeof condition.enableBackInStock === 'boolean'
            ? condition.enableBackInStock
            : true,
      })

      setCurrentRuleId(rule.id)
    }

    setLoadingConfig(false)
  }

  const saveStockConfig = async () => {
    setSavingConfig(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setSavingConfig(false)
        return
      }

      const condition = {
        lowStockThreshold: Number(stockConfig.lowStockThreshold) || 1,
        enableLowStock: stockConfig.enableLowStock,
        enableOutOfStock: stockConfig.enableOutOfStock,
        enableBackInStock: stockConfig.enableBackInStock,
      }

      const storeId = selectedStoreId === 'global' ? null : selectedStoreId

      if (currentRuleId) {
        const { error } = await supabase
          .from('alert_rules')
          .update({ condition })
          .eq('id', currentRuleId)

        if (error) {
          console.error('Erro ao salvar regra de alertas:', error)
        }
      } else {
        const { data, error } = await supabase
          .from('alert_rules')
          .insert({
            user_id: user.id,
            store_id: storeId,
            name: 'Regra global de estoque',
            type: 'STOCK_LEVEL',
            condition,
            is_active: true,
          })
          .select('id')
          .single()

        if (error) {
          console.error('Erro ao criar regra de alertas:', error)
        } else if (data) {
          setCurrentRuleId(data.id)
        }
      }
    } finally {
      setSavingConfig(false)
    }
  }

  const saveInactivityConfig = async () => {
    setSavingInactivity(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setSavingInactivity(false)
        return
      }

      const condition = {
        daysWithoutSync: Number(inactivityConfig.daysWithoutSync) || 1,
        enableInactivityAlerts: inactivityConfig.enableInactivityAlerts,
      }

      const storeId = selectedStoreId === 'global' ? null : selectedStoreId

      if (inactivityRuleId) {
        const { error } = await supabase
          .from('alert_rules')
          .update({ condition })
          .eq('id', inactivityRuleId)

        if (error) {
          console.error('Erro ao salvar regra de inatividade:', error)
        }
      } else {
        const { data, error } = await supabase
          .from('alert_rules')
          .insert({
            user_id: user.id,
            store_id: storeId,
            name: 'Regra global de inatividade',
            type: 'PRODUCT_INACTIVE',
            condition,
            is_active: true,
          })
          .select('id')
          .single()

        if (error) {
          console.error('Erro ao criar regra de inatividade:', error)
        } else if (data) {
          setInactivityRuleId(data.id)
        }
      }
    } finally {
      setSavingInactivity(false)
    }
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

    const alert = alerts.find(a => a.id === id)
    const supabase = createClient()
    const { error } = await supabase.from('alerts').delete().eq('id', id)

    if (!error) {
      if (alert) {
        await logAudit({
          action: AuditActions.ALERT_DELETED,
          entity_type: EntityTypes.ALERT,
          entity_id: id,
          metadata: { title: alert.title, type: alert.type }
        })
      }
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

        {stores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Escopo das regras</CardTitle>
              <CardDescription>
                No Premium, você pode definir regras globais e também sobrescrever por loja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="rules_scope">Aplicar regras em</Label>
                  <select
                    id="rules_scope"
                    value={selectedStoreId}
                    onChange={async (e) => {
                      const next = e.target.value
                      setSelectedStoreId(next)

                      const isPro = profile?.plan === 'pro' || profile?.subscription_tier === 'pro'
                      if (next !== 'global' && !isPro) {
                        alert('Regras por loja estão disponíveis apenas no Premium.')
                        setSelectedStoreId('global')
                        return
                      }

                      await loadRulesForSelectedStore(next)
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="global">Todas as lojas (global)</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                  {loadingStoreRules && (
                    <p className="text-xs text-muted-foreground">Carregando regras deste escopo...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Regras de Estoque</CardTitle>
            <CardDescription>
              Configure quando o PulseWatch deve disparar alertas de estoque para suas lojas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingConfig ? (
              <p className="text-sm text-muted-foreground">Carregando regras...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Estoque baixo abaixo de</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min={1}
                      value={stockConfig.lowStockThreshold}
                      onChange={(e) =>
                        setStockConfig({
                          ...stockConfig,
                          lowStockThreshold: Number(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Quando o estoque for menor ou igual a esse valor, será considerado baixo.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableLowStock">Alerta de Estoque Baixo</Label>
                      <p className="text-xs text-muted-foreground">
                        Notificar quando o estoque ficar abaixo do limite.
                      </p>
                    </div>
                    <Switch
                      id="enableLowStock"
                      checked={stockConfig.enableLowStock}
                      onCheckedChange={(value: boolean) =>
                        setStockConfig({ ...stockConfig, enableLowStock: value })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableOutOfStock">Alerta de Estoque Zerado</Label>
                      <p className="text-xs text-muted-foreground">
                        Notificar quando o produto ficar sem estoque.
                      </p>
                    </div>
                    <Switch
                      id="enableOutOfStock"
                      checked={stockConfig.enableOutOfStock}
                      onCheckedChange={(value: boolean) =>
                        setStockConfig({ ...stockConfig, enableOutOfStock: value })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableBackInStock">Alerta de Volta ao Estoque</Label>
                      <p className="text-xs text-muted-foreground">
                        Notificar quando um produto voltar a ter estoque.
                      </p>
                    </div>
                    <Switch
                      id="enableBackInStock"
                      checked={stockConfig.enableBackInStock}
                      onCheckedChange={(value: boolean) =>
                        setStockConfig({ ...stockConfig, enableBackInStock: value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveStockConfig} disabled={savingConfig}>
                    {savingConfig ? 'Salvando...' : 'Salvar regras de estoque'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regras de Inatividade</CardTitle>
            <CardDescription>
              Dispare alertas quando um produto ficar muito tempo sem sincronizar (dados antigos ou integrações quebradas).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInactivity ? (
              <p className="text-sm text-muted-foreground">Carregando regras...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="daysWithoutSync">Considerar inativo após</Label>
                    <Input
                      id="daysWithoutSync"
                      type="number"
                      min={1}
                      value={inactivityConfig.daysWithoutSync}
                      onChange={(e) =>
                        setInactivityConfig({
                          ...inactivityConfig,
                          daysWithoutSync: Number(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Número de dias sem sincronização para que o produto seja marcado como inativo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border rounded-md p-4">
                  <div className="space-y-1">
                    <Label htmlFor="enableInactivityAlerts">Alertar produtos inativos</Label>
                    <p className="text-xs text-muted-foreground">
                      Desative se não quiser receber alertas de produtos sem atualização.
                    </p>
                  </div>
                  <Switch
                    id="enableInactivityAlerts"
                    checked={inactivityConfig.enableInactivityAlerts}
                    onCheckedChange={(value: boolean) =>
                      setInactivityConfig({ ...inactivityConfig, enableInactivityAlerts: value })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveInactivityConfig} disabled={savingInactivity}>
                    {savingInactivity ? 'Salvando...' : 'Salvar regras de inatividade'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 justify-between items-center">
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
          
          {alerts.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const exportData = filteredAlerts.map(formatAlertForExport)
                exportToCSV(exportData, 'alertas-pulsewatch')
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
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
