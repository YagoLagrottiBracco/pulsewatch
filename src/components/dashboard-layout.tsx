'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Bell, Store, Package, AlertTriangle, Settings, LogOut, Menu } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadUnreadCount = async (userId: string) => {
    const supabase = createClient()
    
    // Buscar lojas do usuário
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', userId)
    
    if (!stores || stores.length === 0) {
      setUnreadCount(0)
      return
    }
    
    const storeIds = stores.map(s => s.id)
    
    // Contar alertas não lidos dessas lojas
    const { count } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .in('store_id', storeIds)
      .eq('is_read', false)
    
    setUnreadCount(count || 0)
  }

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        
        // Carregar perfil do usuário
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        // Se perfil não existe, criar
        if (error && error.code === 'PGRST116') {
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              email_notifications: true,
              telegram_notifications: false,
            })
            .select()
            .single()
          
          if (newProfile) {
            setProfile(newProfile)
          }
        } else if (profileData) {
          setProfile(profileData)
        }
        
        // Carregar contagem de alertas não lidos
        await loadUnreadCount(user.id)
        
        setLoading(false)
      }
    })
    
    // Atualizar contagem a cada 30 segundos
    const interval = setInterval(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) loadUnreadCount(user.id)
      })
    }, 30000)
    
    return () => clearInterval(interval)
  }, [router])
  
  // Recarregar contagem quando a rota mudar (ex: após marcar alerta como lido)
  useEffect(() => {
    if (user) {
      loadUnreadCount(user.id)
    }
  }, [pathname, user])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Bell className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Bell },
    { name: 'Lojas', href: '/stores', icon: Store },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Alertas', href: '/alerts', icon: AlertTriangle },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-card border-r transition-all duration-300 flex flex-col fixed h-screen`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            {sidebarOpen && <span className="font-bold text-lg">PulseWatch</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isAlerts = item.href === '/alerts'
            const hasUnread = isAlerts && unreadCount > 0
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {hasUnread && !sidebarOpen && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
                  )}
                </div>
                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1">
                    <span>{item.name}</span>
                    {hasUnread && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className={`${sidebarOpen ? 'mb-3' : 'mb-2'}`}>
            {sidebarOpen && user && (
              <div className="text-sm">
                <p className="font-medium truncate">
                  {profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email || 'Sem email'}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${
        sidebarOpen ? 'ml-64' : 'ml-20'
      } transition-all duration-300`}>
        <div className="container py-8">{children}</div>
      </main>
    </div>
  )
}
