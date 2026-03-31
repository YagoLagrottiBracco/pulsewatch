'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Trash2, Link2, Store, AlertTriangle, Copy, Check } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  slug: string
  clientEmail: string | null
  clientName: string | null
  storeCount: number
  alertCount: number
  createdAt: string
}

export default function AgencyPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [totalStores, setTotalStores] = useState(0)
  const [totalAlertsToday, setTotalAlertsToday] = useState(0)
  const [overallUptime, setOverallUptime] = useState(100)
  const [loading, setLoading] = useState(true)

  // Create workspace form
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formClientName, setFormClientName] = useState('')
  const [formClientEmail, setFormClientEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')

  // Portal link
  const [portalLinks, setPortalLinks] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agency')
      if (res.ok) {
        const json = await res.json()
        setWorkspaces(json.workspaces)
        setTotalStores(json.totalStores)
        setTotalAlertsToday(json.totalAlertsToday)
        setOverallUptime(json.overallUptimePercent)
      }
    } catch {
      // silently ignore
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setMessage('')

    try {
      const res = await fetch('/api/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          clientName: formClientName || undefined,
          clientEmail: formClientEmail || undefined,
        }),
      })

      if (res.ok) {
        setFormName('')
        setFormSlug('')
        setFormClientName('')
        setFormClientEmail('')
        setShowForm(false)
        loadDashboard()
      } else {
        const json = await res.json()
        setMessage(json.error || 'Erro ao criar workspace')
      }
    } catch {
      setMessage('Erro de conexão')
    }
    setCreating(false)
  }

  const handleDelete = async (workspaceId: string) => {
    try {
      await fetch(`/api/agency?workspaceId=${workspaceId}`, { method: 'DELETE' })
      loadDashboard()
    } catch {
      // silently ignore
    }
  }

  const handleGeneratePortal = async (workspaceId: string) => {
    try {
      const res = await fetch('/api/agency/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      })

      if (res.ok) {
        const json = await res.json()
        setPortalLinks(prev => ({ ...prev, [workspaceId]: json.portalUrl }))
      }
    } catch {
      // silently ignore
    }
  }

  const handleCopy = (workspaceId: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(workspaceId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando painel de agência...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Painel da Agência
            </h1>
            <p className="text-muted-foreground">
              Gerencie workspaces e clientes da sua agência
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Workspace
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspaces.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lojas Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStores}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alertas Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAlertsToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Uptime Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overallUptime >= 99 ? 'text-green-600' : overallUptime >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                {overallUptime}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Novo Workspace</CardTitle>
              <CardDescription>Crie um workspace isolado para um cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ws-name">Nome do Workspace *</Label>
                  <Input id="ws-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Loja do João" required />
                </div>
                <div>
                  <Label htmlFor="ws-slug">Slug</Label>
                  <Input id="ws-slug" value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="loja-do-joao" />
                </div>
                <div>
                  <Label htmlFor="ws-client-name">Nome do Cliente</Label>
                  <Input id="ws-client-name" value={formClientName} onChange={e => setFormClientName(e.target.value)} placeholder="João Silva" />
                </div>
                <div>
                  <Label htmlFor="ws-client-email">Email do Cliente</Label>
                  <Input id="ws-client-email" type="email" value={formClientEmail} onChange={e => setFormClientEmail(e.target.value)} placeholder="joao@email.com" />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit" disabled={creating}>{creating ? 'Criando...' : 'Criar Workspace'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
                {message && <p className="sm:col-span-2 text-sm text-red-600">{message}</p>}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Workspaces List */}
        {workspaces.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum workspace criado ainda.</p>
              <p className="text-sm text-muted-foreground">Crie um workspace para organizar lojas por cliente.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <Card key={ws.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{ws.name}</CardTitle>
                      <CardDescription>
                        {ws.clientName || ws.clientEmail || ws.slug}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(ws.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span>{ws.storeCount} loja{ws.storeCount !== 1 ? 's' : ''}</span>
                    </div>
                    {ws.alertCount > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span>{ws.alertCount} alerta{ws.alertCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleGeneratePortal(ws.id)}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Gerar Link do Portal
                    </Button>

                    {portalLinks[ws.id] && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                        <span className="truncate flex-1">{portalLinks[ws.id]}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopy(ws.id, portalLinks[ws.id])}
                        >
                          {copiedId === ws.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
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
