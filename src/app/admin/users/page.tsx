'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Eye, Search, Trash2, Store, Shield, UserPlus, UserMinus } from 'lucide-react'

interface UserProfile {
  user_id: string
  full_name: string | null
  email: string
  created_at: string
  subscription_tier: string
  subscription_status: string
  store_count?: number
  is_admin?: boolean
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const loadUsers = async () => {
    try {
      const supabase = createClient()

      // Get all users from auth
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Get all admins
      const { data: admins } = await supabase
        .from('admin_users')
        .select('user_id')

      const adminUserIds = new Set(admins?.map(a => a.user_id) || [])

      // Get store count for each user
      const usersWithData = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('stores')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)

          return {
            ...profile,
            store_count: count || 0,
            is_admin: adminUserIds.has(profile.user_id),
          }
        })
      )

      setUsers(usersWithData)
      setFilteredUsers(usersWithData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${email}? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const supabase = createClient()

      // Delete user profile (cascade will handle related data)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      alert('Usuário deletado com sucesso!')
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Erro ao deletar usuário')
    }
  }

  const handlePromoteToAdmin = async (userId: string, email: string, fullName: string | null) => {
    if (!confirm(`Tem certeza que deseja promover ${fullName || email} a administrador?`)) {
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('admin_users')
        .insert({
          user_id: userId,
          email: email,
          role: 'admin',
        })

      if (error) throw error

      alert('Usuário promovido a admin com sucesso!')
      loadUsers()
    } catch (error) {
      console.error('Error promoting user:', error)
      alert('Erro ao promover usuário')
    }
  }

  const handleRemoveAdmin = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja remover privilégios de admin de ${email}?`)) {
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      alert('Privilégios de admin removidos com sucesso!')
      loadUsers()
    } catch (error) {
      console.error('Error removing admin:', error)
      alert('Erro ao remover admin')
    }
  }

  const getSubscriptionBadge = (tier: string, status: string) => {
    if (status !== 'active') {
      return <Badge variant="outline" className="text-gray-600">Inativo</Badge>
    }

    switch (tier) {
      case 'pro':
        return <Badge className="bg-purple-600">Pro</Badge>
      case 'free':
        return <Badge variant="outline">Free</Badge>
      default:
        return <Badge variant="outline">{tier}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando usuários...</p>
      </div>
    )
  }

  const adminUsers = filteredUsers.filter(u => u.is_admin)
  const normalUsers = filteredUsers.filter(u => !u.is_admin)

  const renderUserCard = (user: UserProfile, isAdminSection: boolean) => (
    <Card key={user.user_id}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">
                {user.full_name || 'Sem nome'}
              </h3>
              {isAdminSection && (
                <Badge className="bg-blue-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {getSubscriptionBadge(user.subscription_tier, user.subscription_status)}
            </div>
            <p className="text-sm text-gray-600 mb-3">{user.email}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Store className="h-4 w-4" />
                {user.store_count} loja(s)
              </div>
              <span>•</span>
              <span>
                Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/users/${user.user_id}`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
            
            {isAdminSection ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveAdmin(user.user_id, user.email)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <UserMinus className="h-4 w-4 mr-1" />
                Remover Admin
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePromoteToAdmin(user.user_id, user.email, user.full_name)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Tornar Admin
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteUser(user.user_id, user.email)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <p className="text-gray-500 mt-2">
          {adminUsers.length} admin(s) • {normalUsers.length} usuário(s) normal(is)
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* Admins Section */}
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Administradores ({adminUsers.length})
              </CardTitle>
              <CardDescription>
                Usuários com acesso total ao painel administrativo
              </CardDescription>
            </CardHeader>
          </Card>
          
          <div className="space-y-4">
            {adminUsers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">Nenhum administrador encontrado</p>
                </CardContent>
              </Card>
            ) : (
              adminUsers.map((user) => renderUserCard(user, true))
            )}
          </div>
        </div>

        {/* Normal Users Section */}
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Usuários Normais ({normalUsers.length})
              </CardTitle>
              <CardDescription>
                Usuários com acesso padrão à plataforma
              </CardDescription>
            </CardHeader>
          </Card>
          
          <div className="space-y-4">
            {normalUsers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">Nenhum usuário encontrado</p>
                </CardContent>
              </Card>
            ) : (
              normalUsers.map((user) => renderUserCard(user, false))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
