'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit, AlertTriangle, Package, TrendingDown, Clock } from 'lucide-react'
import { logAudit, AuditActions, EntityTypes } from '@/lib/audit-logger'

interface AlertRule {
  id: string
  name: string
  type: string
  condition: any
  is_active: boolean
  store_id?: string
  stores?: { name: string }
}

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'stock_low',
    store_id: '',
    threshold: '10',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const [rulesRes, storesRes] = await Promise.all([
      supabase
        .from('alert_rules')
        .select('*, stores(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
    ])

    setRules(rulesRes.data || [])
    setStores(storesRes.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const condition = {
      threshold: parseInt(formData.threshold),
      operator: formData.type === 'stock_low' ? '<' : '>',
    }

    if (editingRule) {
      await supabase
        .from('alert_rules')
        .update({
          name: formData.name,
          type: formData.type,
          store_id: formData.store_id || null,
          condition,
        })
        .eq('id', editingRule.id)
      
      await logAudit({
        action: AuditActions.RULE_UPDATED,
        entity_type: EntityTypes.RULE,
        entity_id: editingRule.id,
        metadata: { name: formData.name, type: formData.type }
      })
    } else {
      const { data: newRule } = await supabase
        .from('alert_rules')
        .insert({
          user_id: user.id,
          name: formData.name,
          type: formData.type,
          store_id: formData.store_id || null,
          condition,
          is_active: true,
        })
        .select()
        .single()
      
      if (newRule) {
        await logAudit({
          action: AuditActions.RULE_CREATED,
          entity_type: EntityTypes.RULE,
          entity_id: newRule.id,
          metadata: { name: formData.name, type: formData.type }
        })
      }
    }

    setDialogOpen(false)
    setEditingRule(null)
    setFormData({ name: '', type: 'stock_low', store_id: '', threshold: '10' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return

    const rule = rules.find(r => r.id === id)
    const supabase = createClient()
    await supabase.from('alert_rules').delete().eq('id', id)
    
    if (rule) {
      await logAudit({
        action: AuditActions.RULE_DELETED,
        entity_type: EntityTypes.RULE,
        entity_id: id,
        metadata: { name: rule.name }
      })
    }
    
    loadData()
  }

  const toggleActive = async (rule: AlertRule) => {
    const supabase = createClient()
    await supabase
      .from('alert_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id)
    
    await logAudit({
      action: AuditActions.RULE_TOGGLED,
      entity_type: EntityTypes.RULE,
      entity_id: rule.id,
      metadata: { name: rule.name, is_active: !rule.is_active }
    })
    
    loadData()
  }

  const openEditDialog = (rule: AlertRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      type: rule.type,
      store_id: rule.store_id || '',
      threshold: rule.condition.threshold?.toString() || '10',
    })
    setDialogOpen(true)
  }

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'stock_low':
        return <Package className="h-4 w-4" />
      case 'downtime':
        return <Clock className="h-4 w-4" />
      case 'sales_drop':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      stock_low: 'Estoque Baixo',
      downtime: 'Loja Offline',
      sales_drop: 'Queda nas Vendas',
      price_change: 'Mudança de Preço',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando regras...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Regras de Alerta</h1>
            <p className="text-muted-foreground">
              Configure alertas personalizados para suas lojas
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open: boolean) => {
            setDialogOpen(open)
            if (!open) {
              setEditingRule(null)
              setFormData({ name: '', type: 'stock_low', store_id: '', threshold: '10' })
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Editar Regra' : 'Nova Regra de Alerta'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure quando e como você deseja ser alertado
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Regra</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Estoque crítico"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Alerta</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: string) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock_low">Estoque Baixo</SelectItem>
                        <SelectItem value="downtime">Loja Offline</SelectItem>
                        <SelectItem value="sales_drop">Queda nas Vendas</SelectItem>
                        <SelectItem value="price_change">Mudança de Preço</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store">Loja (Opcional)</Label>
                    <Select
                      value={formData.store_id}
                      onValueChange={(value: string) => setFormData({ ...formData, store_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as lojas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as lojas</SelectItem>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.type === 'stock_low' || formData.type === 'sales_drop') && (
                    <div className="space-y-2">
                      <Label htmlFor="threshold">
                        {formData.type === 'stock_low' ? 'Quantidade Mínima' : 'Porcentagem de Queda (%)'}
                      </Label>
                      <Input
                        id="threshold"
                        type="number"
                        value={formData.threshold}
                        onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                        placeholder="10"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.type === 'stock_low'
                          ? 'Alertar quando o estoque estiver abaixo desta quantidade'
                          : 'Alertar quando as vendas caírem mais que esta porcentagem'}
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="submit">
                    {editingRule ? 'Salvar Alterações' : 'Criar Regra'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {rules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma regra configurada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie regras personalizadas para receber alertas específicos
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Regra
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${rule.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        {getRuleIcon(rule.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <span>{getRuleTypeLabel(rule.type)}</span>
                          {rule.stores && (
                            <span className="text-xs">• {rule.stores.name}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(rule)}
                      >
                        {rule.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {rule.type === 'stock_low' && (
                      <p>Alertar quando estoque {'<'} {rule.condition.threshold} unidades</p>
                    )}
                    {rule.type === 'sales_drop' && (
                      <p>Alertar quando vendas caírem {'>'} {rule.condition.threshold}%</p>
                    )}
                    {rule.type === 'downtime' && (
                      <p>Alertar quando a loja ficar offline</p>
                    )}
                    {rule.type === 'price_change' && (
                      <p>Alertar quando houver mudança de preço</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
