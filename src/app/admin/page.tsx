'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Store, FileText, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalPosts: 0,
    totalAlerts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const supabase = createClient()

      const [usersRes, storesRes, postsRes, alertsRes] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('stores').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('alerts').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        totalUsers: usersRes.count || 0,
        totalStores: storesRes.count || 0,
        totalPosts: postsRes.count || 0,
        totalAlerts: alertsRes.count || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Usuários',
      value: stats.totalUsers,
      icon: Users,
      description: 'Total de usuários cadastrados',
      color: 'text-blue-600',
    },
    {
      title: 'Lojas',
      value: stats.totalStores,
      icon: Store,
      description: 'Total de lojas monitoradas',
      color: 'text-green-600',
    },
    {
      title: 'Posts do Blog',
      value: stats.totalPosts,
      icon: FileText,
      description: 'Total de posts publicados',
      color: 'text-purple-600',
    },
    {
      title: 'Alertas',
      value: stats.totalAlerts,
      icon: AlertCircle,
      description: 'Total de alertas gerados',
      color: 'text-orange-600',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando estatísticas...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500 mt-2">Visão geral da plataforma PulseWatch</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acessos rápidos para gerenciamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/users"
              className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Gerenciar Usuários</p>
                  <p className="text-sm text-gray-500">Ver, editar e deletar usuários</p>
                </div>
              </div>
            </a>
            <a
              href="/admin/blog"
              className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Gerenciar Blog</p>
                  <p className="text-sm text-gray-500">Criar e editar posts</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>Status da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Versão</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ambiente</span>
                <span className="text-sm font-medium">Produção</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
