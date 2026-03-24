'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/ui/logo'
import {
  Store,
  Package,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  BarChart3,
  Bell,
  Activity,
  Sparkles,
} from 'lucide-react'
import { RealtimeProvider } from '@/contexts/realtime-context'
import { NotificationPanel } from '@/components/notification-panel'

// ─── Navegação interna ────────────────────────────────────────────────────────

function SidebarNav({
  profile,
  expanded,
  onNavigate,
}: {
  profile: any
  expanded: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ...(profile?.subscription_tier === 'ultimate'
      ? [{ name: 'Insights IA', href: '/dashboard/insights', icon: Sparkles }]
      : []),
    { name: 'Lojas', href: '/stores', icon: Store },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Alertas', href: '/alerts', icon: AlertTriangle },
    { name: 'Regras', href: '/alert-rules', icon: Bell },
    { name: 'Atividades', href: '/activity', icon: Activity },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ]

  return (
    <nav className="flex-1 overflow-y-auto min-h-0 p-4 space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {expanded && <span>{item.name}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

// ─── Partes reutilizáveis do sidebar ─────────────────────────────────────────

function SidebarHeader({
  expanded,
  onToggle,
  isMobile,
}: {
  expanded: boolean
  onToggle: () => void
  isMobile?: boolean
}) {
  return (
    <div className="p-4 border-b flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <LogoIcon className="h-14 w-14 text-primary shrink-0" />
        {expanded && <span className="font-bold text-lg">PulseWatch</span>}
      </div>
      <Button variant="ghost" size="sm" onClick={onToggle}>
        {isMobile ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
    </div>
  )
}

function SidebarFooter({
  expanded,
  user,
  profile,
  onLogout,
}: {
  expanded: boolean
  user: any
  profile: any
  onLogout: () => void
}) {
  return (
    <div className="p-4 border-t shrink-0 mt-auto">
      {expanded && user && (
        <div className="mb-3 text-sm">
          <p className="font-medium truncate">
            {profile?.full_name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'Usuário'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user.email || 'Sem email'}
          </p>
        </div>
      )}
      <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
        <LogOut className="h-5 w-5 shrink-0" />
        {expanded && <span className="ml-3">Sair</span>}
      </Button>
    </div>
  )
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024)
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email || '',
            full_name:
              user.user_metadata?.full_name || user.user_metadata?.name || '',
            email_notifications: true,
            telegram_notifications: false,
          })
          .select()
          .single()

        if (newProfile) setProfile(newProfile)
      } else if (profileData) {
        setProfile(profileData)
      }

      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <LogoIcon className="h-24 w-24 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <RealtimeProvider userId={user?.id ?? ''}>
      <div className="flex min-h-screen bg-muted/30">

        {/* Overlay mobile */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar mobile — aside é o flex container diretamente */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-card border-r transition-transform duration-300 md:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarHeader expanded isMobile onToggle={() => setMobileOpen(false)} />
          <SidebarNav expanded profile={profile} onNavigate={() => setMobileOpen(false)} />
          <SidebarFooter expanded user={user} profile={profile} onLogout={handleLogout} />
        </aside>

        {/* Sidebar desktop — aside é o flex container diretamente */}
        <aside
          className={`hidden md:flex flex-col fixed inset-y-0 left-0 bg-card border-r transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          <SidebarHeader
            expanded={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <SidebarNav expanded={sidebarOpen} profile={profile} />
          <SidebarFooter
            expanded={sidebarOpen}
            user={user}
            profile={profile}
            onLogout={handleLogout}
          />
        </aside>

        {/* Conteúdo principal */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
            sidebarOpen ? 'md:ml-64' : 'md:ml-20'
          }`}
        >
          {/* Top bar mobile */}
          <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-card border-b shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <LogoIcon className="h-8 w-8 text-primary" />
            <span className="font-bold text-base">PulseWatch</span>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container py-8">{children}</div>
          </main>
        </div>

        {/* Painel de notificações flutuante */}
        <NotificationPanel />
      </div>
    </RealtimeProvider>
  )
}
