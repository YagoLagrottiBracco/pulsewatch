'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Palette, Save } from 'lucide-react'

export default function WhitelabelPage() {
  const [config, setConfig] = useState({
    brandName: '',
    logoUrl: '',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    customDomain: '',
    faviconUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/agency/whitelabel')
      if (res.ok) {
        const json = await res.json()
        setConfig({
          brandName: json.brandName || '',
          logoUrl: json.logoUrl || '',
          primaryColor: json.primaryColor || '#667eea',
          secondaryColor: json.secondaryColor || '#764ba2',
          customDomain: json.customDomain || '',
          faviconUrl: json.faviconUrl || '',
        })
      }
    } catch {
      // silently ignore
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/agency/whitelabel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (res.ok) {
        setMessage('Configurações salvas com sucesso!')
      } else {
        setMessage('Erro ao salvar configurações')
      }
    } catch {
      setMessage('Erro de conexão')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8" />
            White-label
          </h1>
          <p className="text-muted-foreground">
            Personalize a marca do portal de clientes
          </p>
        </div>

        <form onSubmit={handleSave}>
          <Card>
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>Essas configurações serão aplicadas no portal do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brandName">Nome da Marca</Label>
                <Input id="brandName" value={config.brandName} onChange={e => setConfig(c => ({ ...c, brandName: e.target.value }))} placeholder="Nome que aparece no portal" />
              </div>

              <div>
                <Label htmlFor="logoUrl">URL do Logo</Label>
                <Input id="logoUrl" value={config.logoUrl} onChange={e => setConfig(c => ({ ...c, logoUrl: e.target.value }))} placeholder="https://..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <input type="color" id="primaryColor" value={config.primaryColor} onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))} className="h-10 w-12 rounded border cursor-pointer" />
                    <Input value={config.primaryColor} onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <input type="color" id="secondaryColor" value={config.secondaryColor} onChange={e => setConfig(c => ({ ...c, secondaryColor: e.target.value }))} className="h-10 w-12 rounded border cursor-pointer" />
                    <Input value={config.secondaryColor} onChange={e => setConfig(c => ({ ...c, secondaryColor: e.target.value }))} className="flex-1" />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="customDomain">Domínio Customizado</Label>
                <Input id="customDomain" value={config.customDomain} onChange={e => setConfig(c => ({ ...c, customDomain: e.target.value }))} placeholder="monitor.suaagencia.com.br" />
                <p className="text-xs text-muted-foreground mt-1">Configure um CNAME apontando para o PulseWatch</p>
              </div>

              <div>
                <Label htmlFor="faviconUrl">URL do Favicon</Label>
                <Input id="faviconUrl" value={config.faviconUrl} onChange={e => setConfig(c => ({ ...c, faviconUrl: e.target.value }))} placeholder="https://..." />
              </div>

              {/* Preview */}
              <div className="mt-6">
                <Label>Preview</Label>
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <div style={{ background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)` }} className="text-white py-4 px-6">
                    <p className="font-bold text-lg">{config.brandName || 'PulseWatch'}</p>
                    <p className="text-sm opacity-80">Portal do Cliente</p>
                  </div>
                  <div className="bg-background p-4 text-sm text-muted-foreground">
                    Conteúdo do portal aparecerá aqui...
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 mt-4">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            {message && <p className="text-sm text-green-600">{message}</p>}
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
