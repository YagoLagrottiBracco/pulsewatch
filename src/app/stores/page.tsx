'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { detectPlatform } from '@/services/platform-detector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Store, Trash2, RefreshCw } from 'lucide-react'

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    shopifyApiKey: '',
    shopifyPassword: '',
  })
  const [detecting, setDetecting] = useState(false)
  const [detectedPlatform, setDetectedPlatform] = useState<any>(null)

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setStores(data)
    }
    setLoading(false)
  }

  const handleDetectPlatform = async () => {
    if (!formData.domain) return

    setDetecting(true)
    try {
      const result = await detectPlatform(formData.domain)
      setDetectedPlatform(result)
    } catch (error) {
      console.error('Erro na detecção:', error)
    } finally {
      setDetecting(false)
    }
  }

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault()

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Detectar plataforma se não foi detectada ainda
    let platform = detectedPlatform
    if (!platform) {
      platform = await detectPlatform(formData.domain)
    }

    let platformConfig = null
    if (platform.platform === 'shopify' && formData.shopifyApiKey && formData.shopifyPassword) {
      platformConfig = {
        apiKey: formData.shopifyApiKey,
        accessToken: formData.shopifyPassword,
      }
    }

    const { error } = await supabase.from('stores').insert({
      user_id: user.id,
      name: formData.name,
      domain: formData.domain,
      platform: platform.platform,
      platform_config: platformConfig,
      status: 'checking',
      is_active: true,
    })

    if (!error) {
      setFormData({ name: '', domain: '', shopifyApiKey: '', shopifyPassword: '' })
      setDetectedPlatform(null)
      setShowAddForm(false)
      loadStores()
    }
  }

  const handleDeleteStore = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta loja?')) return

    const supabase = createClient()
    const { error } = await supabase.from('stores').delete().eq('id', id)

    if (!error) {
      loadStores()
    }
  }

  const handleToggleStore = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('stores')
      .update({ is_active: !isActive })
      .eq('id', id)

    if (!error) {
      loadStores()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>
      case 'checking':
        return <Badge variant="secondary">Verificando...</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getPlatformBadge = (platform: string) => {
    const colors: any = {
      shopify: 'bg-green-600',
      woocommerce: 'bg-purple-600',
      nuvemshop: 'bg-blue-600',
      unknown: 'bg-gray-600',
    }

    return (
      <Badge className={colors[platform] || colors.unknown}>
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando lojas...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lojas</h1>
            <p className="text-muted-foreground">
              Gerencie suas lojas monitoradas
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Loja
          </Button>
        </div>

        {/* Add Store Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Nova Loja</CardTitle>
              <CardDescription>
                Adicione uma nova loja para monitoramento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStore} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Loja</Label>
                    <Input
                      id="name"
                      placeholder="Minha Loja"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain">Domínio</Label>
                    <div className="flex gap-2">
                      <Input
                        id="domain"
                        placeholder="minhaloja.com.br"
                        value={formData.domain}
                        onChange={(e) =>
                          setFormData({ ...formData, domain: e.target.value })
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDetectPlatform}
                        disabled={detecting || !formData.domain}
                      >
                        <RefreshCw className={`h-4 w-4 ${detecting ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>

                {detectedPlatform && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-2">Plataforma Detectada:</p>
                    <div className="flex items-center gap-2">
                      {getPlatformBadge(detectedPlatform.platform)}
                      <span className="text-sm text-muted-foreground">
                        Confiança: {detectedPlatform.confidence}%
                      </span>
                    </div>
                  </div>
                )}

                {detectedPlatform?.platform === 'shopify' && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <p className="text-sm font-medium">Credenciais da API Shopify</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="shopifyApiKey">API Key</Label>
                        <Input
                          id="shopifyApiKey"
                          type="password"
                          placeholder="shpat_..."
                          value={formData.shopifyApiKey}
                          onChange={(e) =>
                            setFormData({ ...formData, shopifyApiKey: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopifyPassword">Admin API Access Token</Label>
                        <Input
                          id="shopifyPassword"
                          type="password"
                          placeholder="shpat_..."
                          value={formData.shopifyPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, shopifyPassword: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      📝 Você pode obter essas credenciais em: Shopify Admin → Settings → Apps and sales channels → Develop apps
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit">Adicionar</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormData({ name: '', domain: '', shopifyApiKey: '', shopifyPassword: '' })
                      setDetectedPlatform(null)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stores List */}
        {stores.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma loja cadastrada</p>
              <p className="text-muted-foreground mb-4">
                Adicione sua primeira loja para começar o monitoramento
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Loja
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Card key={store.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <CardDescription>{store.domain}</CardDescription>
                    </div>
                    {getStatusBadge(store.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plataforma:</span>
                      {getPlatformBadge(store.platform)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={store.is_active ? 'default' : 'secondary'}>
                        {store.is_active ? 'Ativa' : 'Pausada'}
                      </Badge>
                    </div>

                    {store.last_check && (
                      <div className="text-xs text-muted-foreground">
                        Última verificação:{' '}
                        {new Date(store.last_check).toLocaleString('pt-BR')}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggleStore(store.id, store.is_active)}
                      >
                        {store.is_active ? 'Pausar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStore(store.id)}
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
      </div>
    </DashboardLayout>
  )
}
