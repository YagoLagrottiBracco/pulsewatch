'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Webhook, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react'

const ALL_EVENTS = [
  { value: 'alert.created', label: 'Alerta criado' },
  { value: 'store.status_changed', label: 'Status da loja mudou' },
  { value: 'store.speed_alert', label: 'Alerta de velocidade' },
  { value: 'checkout.offline', label: 'Checkout offline' },
]

interface WebhookItem {
  id: string
  name: string
  url: string
  secret: string | null
  events: string[]
  is_active: boolean
  last_triggered_at: string | null
  last_status_code: number | null
  created_at: string
}

interface Delivery {
  id: string
  event: string
  success: boolean
  status_code: number | null
  delivered_at: string
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Form
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formSecret, setFormSecret] = useState('')
  const [formEvents, setFormEvents] = useState<string[]>(['alert.created', 'store.status_changed'])
  const [saving, setSaving] = useState(false)

  // Deliveries
  const [deliveriesOpen, setDeliveriesOpen] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({})

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/webhooks')
      if (res.ok) {
        const json = await res.json()
        setWebhooks(json.webhooks)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formUrl) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, url: formUrl, secret: formSecret || undefined, events: formEvents }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage('Erro: ' + (data.error || 'tente novamente'))
      } else {
        setFormName('')
        setFormUrl('')
        setFormSecret('')
        setFormEvents(['alert.created', 'store.status_changed'])
        setShowForm(false)
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este webhook?')) return
    await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' })
    await load()
  }

  const toggleDeliveries = async (id: string) => {
    if (deliveriesOpen === id) {
      setDeliveriesOpen(null)
      return
    }
    setDeliveriesOpen(id)
    if (!deliveries[id]) {
      const res = await fetch(`/api/webhooks?deliveries=${id}`)
      if (res.ok) {
        const json = await res.json()
        setDeliveries(prev => ({ ...prev, [id]: json.deliveries }))
      }
    }
  }

  const toggleEvent = (event: string) => {
    setFormEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">Receba eventos do PulseWatch em ferramentas externas</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Webhook
          </Button>
        </div>

        {message && (
          <div className="p-4 rounded-md bg-red-500/10 text-red-500">{message}</div>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Novo Webhook</CardTitle>
              <CardDescription>Configure a URL e os eventos que deseja receber</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="ex: n8n alertas" required />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://..." type="url" required />
                </div>
                <div className="space-y-2">
                  <Label>Secret (opcional)</Label>
                  <Input value={formSecret} onChange={e => setFormSecret(e.target.value)} placeholder="Usado para assinar o payload com HMAC-SHA256" />
                </div>
                <div className="space-y-2">
                  <Label>Eventos</Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_EVENTS.map(ev => (
                      <button
                        key={ev.value}
                        type="button"
                        onClick={() => toggleEvent(ev.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          formEvents.includes(ev.value)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border text-muted-foreground'
                        }`}
                      >
                        {ev.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar Webhook'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum webhook configurado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {webhooks.map(wh => (
              <Card key={wh.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{wh.name}</p>
                        <Badge variant={wh.is_active ? 'default' : 'outline'} className="text-xs">
                          {wh.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{wh.url}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {wh.events.map(ev => (
                          <span key={ev} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {ALL_EVENTS.find(e => e.value === ev)?.label || ev}
                          </span>
                        ))}
                      </div>
                      {wh.last_triggered_at && (
                        <p className="text-xs text-muted-foreground">
                          Último disparo: {new Date(wh.last_triggered_at).toLocaleString('pt-BR')}
                          {wh.last_status_code && (
                            <span className={`ml-2 font-medium ${wh.last_status_code < 300 ? 'text-green-600' : 'text-red-500'}`}>
                              HTTP {wh.last_status_code}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => toggleDeliveries(wh.id)}>
                        {deliveriesOpen === wh.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Entregas
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(wh.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {deliveriesOpen === wh.id && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-sm font-medium">Últimas entregas</p>
                      {!deliveries[wh.id] ? (
                        <p className="text-xs text-muted-foreground">Carregando...</p>
                      ) : deliveries[wh.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhuma entrega ainda.</p>
                      ) : (
                        deliveries[wh.id].map(d => (
                          <div key={d.id} className="flex items-center gap-2 text-xs">
                            {d.success
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                            <span className="text-muted-foreground">{new Date(d.delivered_at).toLocaleString('pt-BR')}</span>
                            <span className="font-medium">{ALL_EVENTS.find(e => e.value === d.event)?.label || d.event}</span>
                            {d.status_code && (
                              <span className={d.success ? 'text-green-600' : 'text-red-500'}>HTTP {d.status_code}</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
