'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store, AlertTriangle, Loader2, ShieldX } from 'lucide-react'

interface PortalData {
  workspace: { name: string; clientName: string | null }
  stores: Array<{ id: string; name: string; domain: string; platform: string; status: string; last_check: string | null }>
  alerts: Array<{ id: string; type: string; severity: string; title: string; message: string; created_at: string; stores: { name: string } | null }>
  whitelabel: { brandName: string | null; primaryColor: string; secondaryColor: string; logoUrl: string | null }
}

export default function PortalPage() {
  const params = useParams()
  const token = params.token as string
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadPortal()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPortal = async () => {
    try {
      const res = await fetch(`/api/agency/portal?token=${token}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <ShieldX className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="font-medium">Link inválido ou expirado</p>
            <p className="text-sm text-muted-foreground mt-2">Solicite um novo link ao seu gestor.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const brandName = data.whitelabel.brandName || 'PulseWatch'
  const primaryColor = data.whitelabel.primaryColor || '#667eea'
  const secondaryColor = data.whitelabel.secondaryColor || '#764ba2'

  const onlineCount = data.stores.filter(s => s.status === 'online').length
  const uptimePercent = data.stores.length > 0 ? Math.round((onlineCount / data.stores.length) * 100) : 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }} className="text-white py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold">{brandName}</h1>
          <p className="opacity-90 text-sm">
            Portal do Cliente — {data.workspace.clientName || data.workspace.name}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6 mt-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lojas Monitoradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stores.length}</div>
              <p className="text-xs text-muted-foreground">{onlineCount} online</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${uptimePercent >= 99 ? 'text-green-600' : uptimePercent >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                {uptimePercent}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.alerts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Stores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" /> Lojas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.stores.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">Nenhuma loja atribuída a este workspace.</p>
            ) : (
              <div className="space-y-3">
                {data.stores.map(store => (
                  <div key={store.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.domain}</p>
                    </div>
                    <Badge className={store.status === 'online' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                      {store.status === 'online' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Alertas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.alerts.map(alert => (
                  <div key={alert.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={
                        alert.severity === 'critical' ? 'bg-red-600 text-white' :
                        alert.severity === 'high' ? 'bg-red-500 text-white' :
                        alert.severity === 'medium' ? 'bg-yellow-600 text-white' :
                        'bg-green-600 text-white'
                      }>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium text-sm">{alert.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.stores?.name} • {new Date(alert.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="text-center text-xs text-muted-foreground py-8">
          Powered by {brandName}
        </footer>
      </main>
    </div>
  )
}
