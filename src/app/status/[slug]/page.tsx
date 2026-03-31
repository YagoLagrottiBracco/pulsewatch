'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'

interface StatusStore {
  id: string
  name: string
  displayName: string
  status: string
  last_check: string | null
  last_response_time_ms: number | null
}

interface StatusIncident {
  id: string
  type: string
  severity: string
  title: string
  message: string
  created_at: string
  stores: { name: string } | null
}

export default function StatusPage() {
  const params = useParams()
  const slug = params.slug as string
  const [data, setData] = useState<{ title: string; description: string; stores: StatusStore[]; incidents: StatusIncident[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/status-page?slug=${slug}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  if (error || !data) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Página não encontrada</p></div>

  const allOnline = data.stores.every(s => s.status === 'online')
  const someOffline = data.stores.some(s => s.status === 'offline')

  return (
    <div className="min-h-screen bg-background">
      <header className={`py-8 px-4 text-center text-white ${allOnline ? 'bg-green-600' : someOffline ? 'bg-red-600' : 'bg-yellow-600'}`}>
        <h1 className="text-3xl font-bold">{data.title}</h1>
        {data.description && <p className="mt-2 opacity-90">{data.description}</p>}
        <p className="mt-4 text-lg font-medium">
          {allOnline ? 'Todos os sistemas operacionais' : someOffline ? 'Alguns sistemas com problemas' : 'Verificando...'}
        </p>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6 mt-6">
        <Card>
          <CardHeader><CardTitle>Serviços</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.stores.map(store => (
                <div key={store.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    {store.status === 'online'
                      ? <CheckCircle className="h-5 w-5 text-green-600" />
                      : <XCircle className="h-5 w-5 text-red-600" />}
                    <span className="font-medium">{store.displayName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {store.last_response_time_ms && (
                      <span className="text-xs text-muted-foreground">{store.last_response_time_ms}ms</span>
                    )}
                    <Badge className={store.status === 'online' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                      {store.status === 'online' ? 'Operacional' : 'Indisponível'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {data.incidents.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Incidentes Recentes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.incidents.map(inc => (
                  <div key={inc.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={inc.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}>{inc.severity}</Badge>
                      <span className="font-medium text-sm">{inc.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{inc.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(inc.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="text-center text-xs text-muted-foreground py-8">
          Powered by PulseWatch
        </footer>
      </main>
    </div>
  )
}
