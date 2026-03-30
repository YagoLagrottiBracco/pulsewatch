'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Store, 
  Edit, 
  Globe,
  Mail,
  Calendar,
  CreditCard,
  AlertCircle
} from 'lucide-react'

interface UserProfile {
  user_id: string
  full_name: string | null
  email: string
  created_at: string
  subscription_tier: string
  subscription_status: string
  telegram_chat_id: string | null
}

interface StoreData {
  id: string
  name: string
  url: string
  platform: string
  check_frequency: number
  is_active: boolean
  last_check: string | null
  created_at: string
  product_count?: number
  alert_count?: number
}

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    subscription_tier: 'free',
    subscription_status: 'active',
  })

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      const supabase = createClient()

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError) throw profileError

      setUser(profile)
      setFormData({
        full_name: profile.full_name || '',
        subscription_tier: profile.subscription_tier,
        subscription_status: profile.subscription_status,
      })

      // Load user stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (storesError) throw storesError

      // Get product and alert counts for each store
      const storesWithCounts = await Promise.all(
        (storesData || []).map(async (store) => {
          const [productsRes, alertsRes] = await Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
            supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
          ])

          return {
            ...store,
            product_count: productsRes.count || 0,
            alert_count: alertsRes.count || 0,
          }
        })
      )

      setStores(storesWithCounts)
    } catch (error) {
      console.error('Error loading user data:', error)
      alert('Erro ao carregar dados do usuário')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUser = async () => {
    setSaving(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          subscription_tier: formData.subscription_tier,
          subscription_status: formData.subscription_status,
        })
        .eq('user_id', userId)

      if (error) throw error

      alert('Usuário atualizado com sucesso!')
      setEditMode(false)
      loadUserData()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Erro ao atualizar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a loja "${storeName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId)

      if (error) throw error

      alert('Loja deletada com sucesso!')
      loadUserData()
    } catch (error) {
      console.error('Error deleting store:', error)
      alert('Erro ao deletar loja')
    }
  }

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('stores')
        .update({ is_active: !currentStatus })
        .eq('id', storeId)

      if (error) throw error

      loadUserData()
    } catch (error) {
      console.error('Error toggling store status:', error)
      alert('Erro ao alterar status da loja')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8">
        <p>Usuário não encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Usuários
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Detalhes do Usuário</h1>
        <p className="text-gray-500 mt-2">Gerencie informações e lojas do usuário</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informações</CardTitle>
                {!editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div>
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="subscription_tier">Plano</Label>
                    <select
                      id="subscription_tier"
                      value={formData.subscription_tier}
                      onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="business">Business</option>
                      <option value="agency">Agency</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="subscription_status">Status</Label>
                    <select
                      id="subscription_status"
                      value={formData.subscription_status}
                      onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="active">Ativo</option>
                      <option value="canceled">Cancelado</option>
                      <option value="past_due">Vencido</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveUser} disabled={saving} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false)
                        setFormData({
                          full_name: user.full_name || '',
                          subscription_tier: user.subscription_tier,
                          subscription_status: user.subscription_status,
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium">{user.full_name || 'Não informado'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="font-medium text-sm">{user.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> Plano
                    </p>
                    <Badge
                      className={
                        user.subscription_tier === 'pro'
                          ? 'bg-purple-600'
                          : user.subscription_tier === 'business'
                            ? 'bg-blue-700'
                            : user.subscription_tier === 'agency'
                              ? 'bg-slate-700'
                              : ''
                      }
                    >
                      {user.subscription_tier?.toUpperCase() || 'FREE'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge variant={user.subscription_status === 'active' ? 'default' : 'outline'}>
                      {user.subscription_status || 'inactive'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Cadastro
                    </p>
                    <p className="text-sm">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stores List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Lojas ({stores.length})
              </CardTitle>
              <CardDescription>Todas as lojas monitoradas pelo usuário</CardDescription>
            </CardHeader>
            <CardContent>
              {stores.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma loja cadastrada</p>
              ) : (
                <div className="space-y-4">
                  {stores.map((store) => (
                    <div key={store.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{store.name}</h4>
                            <Badge variant={store.is_active ? 'default' : 'outline'}>
                              {store.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Badge variant="outline">{store.platform}</Badge>
                          </div>
                          <a
                            href={store.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            {store.url}
                          </a>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStoreStatus(store.id, store.is_active)}
                          >
                            {store.is_active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStore(store.id, store.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="text-xs text-gray-500">Produtos</p>
                          <p className="font-medium">{store.product_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Alertas
                          </p>
                          <p className="font-medium">{store.alert_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Frequência</p>
                          <p className="font-medium">{store.check_frequency}min</p>
                        </div>
                      </div>

                      {store.last_check && (
                        <p className="text-xs text-gray-500 mt-2">
                          Última verificação: {new Date(store.last_check).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
