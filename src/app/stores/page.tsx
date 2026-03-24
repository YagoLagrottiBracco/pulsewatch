'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'
import type { PlatformDetectionResult } from '@/services/platform-detector'

async function detectPlatformViaApi(domain: string): Promise<PlatformDetectionResult> {
  const res = await fetch('/api/stores/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  })
  if (!res.ok) {
    return { platform: null, confidence: 0, indicators: ['Erro ao detectar plataforma'] }
  }
  return res.json()
}
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Store, Trash2, RefreshCw, Edit, TrendingDown, Clock } from 'lucide-react'
import { logAudit, AuditActions, EntityTypes } from '@/lib/audit-logger'

function maskBRL(value: string): string {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  // Trata como centavos: "15000" → 150,00
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

function parseBRL(masked: string): number | null {
  // "R$ 1.500,00" → 1500.00
  const cleaned = masked.replace(/[R$\s.]/g, '').replace(',', '.')
  const value = parseFloat(cleaned)
  return isNaN(value) ? null : value
}

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStore, setEditingStore] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    revenuePerHour: '',
    shopifyApiKey: '',
    shopifyPassword: '',
    wooConsumerKey: '',
    wooConsumerSecret: '',
    nuvemshopStoreId: '',
    nuvemshopAccessToken: '',
    trayAccessToken: '',
    vtexAccountName: '',
    vtexAppKey: '',
    vtexAppToken: '',
  })
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [detectedPlatform, setDetectedPlatform] = useState<any>(null)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)
  const [onboardingStep, setOnboardingStep] = useState<number>(0)
  const [profile, setProfile] = useState<any | null>(null)
  const [onboardingLoading, setOnboardingLoading] = useState<boolean>(true)
  const [financialSummary, setFinancialSummary] = useState<{
    total_incidents: number
    total_downtime_minutes: number
    total_estimated_loss: number
  } | null>(null)

  const currentPlatform = selectedPlatform || detectedPlatform?.platform || null

  useEffect(() => {
    loadStores()
    loadOnboardingStatus()
    loadFinancialSummary()
  }, [])

  useRealtimeSubscription({
    channel: 'stores-page-stores',
    table: 'stores',
    onChange: () => {
      loadStores()
      loadFinancialSummary()
    },
  })

  useRealtimeSubscription({
    channel: 'stores-page-incidents',
    table: 'downtime_incidents',
    onChange: () => loadFinancialSummary(),
  })

  useEffect(() => {
    if (onboardingLoading) return

    if (profile?.onboarding_completed) {
      setShowOnboarding(false)
    } else {
      setShowOnboarding(true)
      setOnboardingStep(0)
    }
  }, [profile, onboardingLoading])

  useEffect(() => {
    if (onboardingLoading) return

    if (!profile?.onboarding_completed && stores.length === 0) {
      setOnboardingStep(0)
    }
  }, [stores, profile, onboardingLoading])

  const loadOnboardingStatus = async () => {
    setOnboardingLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setProfile(null)
        setShowOnboarding(false)
        setOnboardingLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, email, onboarding_completed, onboarding_completed_at, plan, subscription_tier, trial_ends_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar perfil do usuário:', error)
      }

      let profileRecord = data || null
      const localCompleted =
        typeof window !== 'undefined' &&
        localStorage.getItem('pulsewatch_onboarding_completed') === 'true'

      if (localCompleted && !profileRecord?.onboarding_completed) {
        const completionData = {
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        }

        const { data: syncedProfile, error: syncError } = await supabase
          .from('user_profiles')
          .upsert(
            {
              id: profileRecord?.id,
              user_id: user.id,
              email: profileRecord?.email || user.email,
              ...completionData,
            },
            { onConflict: 'user_id' }
          )
          .select('id, user_id, email, onboarding_completed, onboarding_completed_at, plan, subscription_tier, trial_ends_at')
          .single()

        if (syncError) {
          console.error('Erro ao sincronizar status de onboarding:', syncError)
        }

        profileRecord = syncedProfile || {
          id: profileRecord?.id,
          user_id: user.id,
          email: profileRecord?.email || user.email,
          plan: profileRecord?.plan || 'free',
          subscription_tier: profileRecord?.subscription_tier || 'free',
          trial_ends_at: profileRecord?.trial_ends_at || null,
          ...completionData,
        }
      }

      setProfile(profileRecord)
      setShowOnboarding(!profileRecord?.onboarding_completed)
    } catch (error) {
      console.error('Erro ao verificar status de onboarding:', error)
      setProfile(null)
      setShowOnboarding(true)
    } finally {
      setOnboardingLoading(false)
    }
  }

  const completeOnboarding = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulsewatch_onboarding_completed', 'true')
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setShowOnboarding(false)
        return
      }

      const completionData = {
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            id: profile?.id,
            user_id: user.id,
            email: profile?.email || user.email,
            ...completionData,
          },
          { onConflict: 'user_id' }
        )
        .select('id, user_id, email, onboarding_completed, onboarding_completed_at, plan, subscription_tier, trial_ends_at')
        .single()

      if (error) {
        console.error('Erro ao atualizar status de onboarding:', error)
      }

      setProfile(
        data || {
          ...(profile || {}),
          user_id: user.id,
          email: profile?.email || user.email,
          ...completionData,
        }
      )
      setShowOnboarding(false)
    } catch (error) {
      console.error('Erro ao completar onboarding:', error)
      setShowOnboarding(false)
    }
  }

  const onboardingSteps = [
    {
      title: '1. Cadastre sua primeira loja',
      description:
        'Clique em “Adicionar Loja”, informe o domínio e deixe que detectemos a plataforma automaticamente. Você também pode selecionar manualmente.',
    },
    {
      title: '2. Configure as credenciais',
      description:
        'Preencha os tokens/chaves de API para habilitar a sincronização (Shopify, WooCommerce, Nuvemshop, Tray ou VTEX).',
    },
    {
      title: '3. Ative o monitoramento',
      description:
        'Depois de salvar, a loja entra em “Verificando…”. Assim que o cron rodar, você verá produtos e alertas em tempo real.',
    },
    {
      title: '4. Revise os alertas',
      description:
        'Use a aba “Alertas” para ajustar regras (estoque baixo, loja offline etc.) e garantir que as notificações cheguem por e-mail/Telegram.',
    },
  ]

  const currentOnboarding = onboardingSteps[onboardingStep]

  const loadFinancialSummary = async () => {
    try {
      const res = await fetch('/api/stores/financial-loss?period=30')
      if (!res.ok) return
      const data = await res.json()
      setFinancialSummary(data.summary)
    } catch {
      // silencioso — widget não crítico
    }
  }

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
      const result = await detectPlatformViaApi(formData.domain)
      setDetectedPlatform(result)
    } catch (error) {
      console.error('Erro na detecção:', error)
    } finally {
      setDetecting(false)
    }
  }

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault()

    const isPremiumOrUltimate = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'ultimate'
    const isUltimate = profile?.subscription_tier === 'ultimate'
    
    if (!isPremiumOrUltimate && stores.length >= 1) {
      alert('Seu plano Free permite monitorar apenas 1 loja. Faça upgrade para Premium ou Ultimate para adicionar mais lojas.')
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Determinar plataforma (manual > detectada > auto)
    let platformKey = selectedPlatform || detectedPlatform?.platform || null
    
    // Verificar se plataforma avançada requer Ultimate
    const advancedPlatforms = ['magento', 'bigcommerce', 'prestashop', 'spree']
    if (platformKey && advancedPlatforms.includes(platformKey) && !isUltimate) {
      alert(`A plataforma ${platformKey} está disponível apenas no plano Ultimate. Faça upgrade para usar esta integração.`)
      return
    }

    if (!platformKey) {
      const detected = await detectPlatformViaApi(formData.domain)
      platformKey = detected.platform
      setDetectedPlatform(detected)
    }

    let platformConfig: any = null
    if (platformKey === 'shopify' && formData.shopifyApiKey && formData.shopifyPassword) {
      const cleanDomainForValidation = formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      const validationRes = await fetch('/api/stores/validate-shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleanDomainForValidation, accessToken: formData.shopifyPassword }),
      })
      const validation = await validationRes.json()
      if (!validation.valid) {
        alert(`Erro ao validar credenciais Shopify: ${validation.error}`)
        return
      }
      platformConfig = {
        apiKey: formData.shopifyApiKey,
        accessToken: formData.shopifyPassword,
      }
    } else if (platformKey === 'woocommerce' && formData.wooConsumerKey && formData.wooConsumerSecret) {
      platformConfig = {
        consumerKey: formData.wooConsumerKey,
        consumerSecret: formData.wooConsumerSecret,
      }
    } else if (platformKey === 'nuvemshop' && formData.nuvemshopStoreId && formData.nuvemshopAccessToken) {
      platformConfig = {
        storeId: formData.nuvemshopStoreId,
        accessToken: formData.nuvemshopAccessToken,
      }
    } else if (platformKey === 'tray' && formData.trayAccessToken) {
      platformConfig = {
        accessToken: formData.trayAccessToken,
      }
    } else if (
      platformKey === 'vtex' &&
      formData.vtexAccountName &&
      formData.vtexAppKey &&
      formData.vtexAppToken
    ) {
      platformConfig = {
        accountName: formData.vtexAccountName,
        appKey: formData.vtexAppKey,
        appToken: formData.vtexAppToken,
        environment: 'vtexcommercestable',
      }
    }

    // Normalizar domain (remover https:// ou http://)
    const cleanDomain = formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

    // Verificar se já existe uma loja com o mesmo domínio para este usuário
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .eq('domain', cleanDomain)
      .maybeSingle()

    if (existingStore) {
      alert(`Você já possui uma loja cadastrada com o domínio "${cleanDomain}".`)
      return
    }

    const { data: newStore, error } = await supabase.from('stores').insert({
      user_id: user.id,
      name: formData.name,
      domain: cleanDomain,
      platform: platformKey ?? 'unknown',
      platform_config: platformConfig,
      status: 'checking',
      is_active: true,
      revenue_per_hour: formData.revenuePerHour ? parseBRL(formData.revenuePerHour) : null,
    }).select().single()

    if (!error && newStore) {
      await logAudit({
        action: AuditActions.STORE_CREATED,
        entity_type: EntityTypes.STORE,
        entity_id: newStore.id,
        metadata: { name: formData.name, domain: cleanDomain, platform: platformKey }
      })
      
      setFormData({
        name: '',
        domain: '',
        revenuePerHour: '',
        shopifyApiKey: '',
        shopifyPassword: '',
        wooConsumerKey: '',
        wooConsumerSecret: '',
        nuvemshopStoreId: '',
        nuvemshopAccessToken: '',
        trayAccessToken: '',
        vtexAccountName: '',
        vtexAppKey: '',
        vtexAppToken: '',
      })
      setSelectedPlatform(null)
      setDetectedPlatform(null)
      setShowAddForm(false)
      loadStores()
    }
  }

  const handleEditStore = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingStore) return

    const supabase = createClient()

    // Normalizar domain (remover https:// ou http://)
    const cleanDomain = formData.domain.replace(/^https?:\/\//, '')

    let platformConfig: any = editingStore.platform_config
    if (currentPlatform === 'shopify' && (formData.shopifyApiKey || formData.shopifyPassword)) {
      if (formData.shopifyPassword) {
        const cleanDomainForValidation = formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
        const validationRes = await fetch('/api/stores/validate-shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: cleanDomainForValidation, accessToken: formData.shopifyPassword }),
        })
        const validation = await validationRes.json()
        if (!validation.valid) {
          alert(`Erro ao validar credenciais Shopify: ${validation.error}`)
          return
        }
      }
      platformConfig = {
        ...platformConfig,
        ...(formData.shopifyApiKey && { apiKey: formData.shopifyApiKey }),
        ...(formData.shopifyPassword && { accessToken: formData.shopifyPassword }),
      }
    }

    if (currentPlatform === 'woocommerce' && (formData.wooConsumerKey || formData.wooConsumerSecret)) {
      platformConfig = {
        ...platformConfig,
        ...(formData.wooConsumerKey && { consumerKey: formData.wooConsumerKey }),
        ...(formData.wooConsumerSecret && { consumerSecret: formData.wooConsumerSecret }),
      }
    }

    if (currentPlatform === 'nuvemshop' && (formData.nuvemshopStoreId || formData.nuvemshopAccessToken)) {
      platformConfig = {
        ...platformConfig,
        ...(formData.nuvemshopStoreId && { storeId: formData.nuvemshopStoreId }),
        ...(formData.nuvemshopAccessToken && { accessToken: formData.nuvemshopAccessToken }),
      }
    }

    if (currentPlatform === 'tray' && formData.trayAccessToken) {
      platformConfig = {
        ...platformConfig,
        accessToken: formData.trayAccessToken,
      }
    }

    if (
      currentPlatform === 'vtex' &&
      (formData.vtexAccountName || formData.vtexAppKey || formData.vtexAppToken)
    ) {
      platformConfig = {
        ...platformConfig,
        ...(formData.vtexAccountName && { accountName: formData.vtexAccountName }),
        ...(formData.vtexAppKey && { appKey: formData.vtexAppKey }),
        ...(formData.vtexAppToken && { appToken: formData.vtexAppToken }),
      }
    }

    if (detectedPlatform?.platform === 'tray' && formData.trayAccessToken) {
      platformConfig = {
        ...platformConfig,
        accessToken: formData.trayAccessToken,
      }
    }

    const { error } = await supabase
      .from('stores')
      .update({
        name: formData.name,
        domain: cleanDomain,
        platform_config: platformConfig,
        revenue_per_hour: formData.revenuePerHour ? parseBRL(formData.revenuePerHour) : null,
      })
      .eq('id', editingStore.id)

    if (!error) {
      await logAudit({
        action: AuditActions.STORE_UPDATED,
        entity_type: EntityTypes.STORE,
        entity_id: editingStore.id,
        metadata: { name: formData.name, domain: cleanDomain }
      })
      
      setFormData({
        name: '',
        domain: '',
        revenuePerHour: '',
        shopifyApiKey: '',
        shopifyPassword: '',
        wooConsumerKey: '',
        wooConsumerSecret: '',
        nuvemshopStoreId: '',
        nuvemshopAccessToken: '',
        trayAccessToken: '',
        vtexAccountName: '',
        vtexAppKey: '',
        vtexAppToken: '',
      })
      setSelectedPlatform(null)
      setDetectedPlatform(null)
      setEditingStore(null)
      setShowAddForm(false)
      loadStores()
    }
  }

  const startEdit = (store: any) => {
    setEditingStore(store)
    setFormData({
      name: store.name,
      domain: store.domain,
      revenuePerHour: store.revenue_per_hour != null ? maskBRL(String(Math.round(store.revenue_per_hour * 100))) : '',
      shopifyApiKey: '',
      shopifyPassword: '',
      wooConsumerKey: '',
      wooConsumerSecret: '',
      nuvemshopStoreId: '',
      nuvemshopAccessToken: '',
      trayAccessToken: '',
      vtexAccountName: '',
      vtexAppKey: '',
      vtexAppToken: '',
    })
    setSelectedPlatform(store.platform)
    setDetectedPlatform({ platform: store.platform })
    setShowAddForm(true)
  }

  const cancelEdit = () => {
    setEditingStore(null)
    setFormData({
      name: '',
      domain: '',
      revenuePerHour: '',
      shopifyApiKey: '',
      shopifyPassword: '',
      wooConsumerKey: '',
      wooConsumerSecret: '',
      nuvemshopStoreId: '',
      nuvemshopAccessToken: '',
      trayAccessToken: '',
      vtexAccountName: '',
      vtexAppKey: '',
      vtexAppToken: '',
    })
    setSelectedPlatform(null)
    setDetectedPlatform(null)
    setShowAddForm(false)
  }

  const handleDeleteStore = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta loja?')) return

    const store = stores.find(s => s.id === id)
    const supabase = createClient()
    const { error } = await supabase.from('stores').delete().eq('id', id)

    if (!error) {
      if (store) {
        await logAudit({
          action: AuditActions.STORE_DELETED,
          entity_type: EntityTypes.STORE,
          entity_id: id,
          metadata: { name: store.name, domain: store.domain }
        })
      }
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

  const getPlatformBadge = (platform: string | null | undefined) => {
    const colors: any = {
      shopify: 'bg-green-600',
      woocommerce: 'bg-purple-600',
      nuvemshop: 'bg-blue-600',
      tray: 'bg-orange-600',
      vtex: 'bg-red-600',
      unknown: 'bg-gray-600',
    }

    if (!platform) {
      return <Badge className={colors.unknown}>Desconhecido</Badge>
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
        {financialSummary && financialSummary.total_incidents > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                    Perda estimada (últimos 30 dias)
                  </span>
                </div>
                <div className="flex items-center gap-6 ml-auto flex-wrap">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {financialSummary.total_estimated_loss.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">impacto financeiro</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                        {Math.floor(financialSummary.total_downtime_minutes / 60)}h{' '}
                        {financialSummary.total_downtime_minutes % 60}min
                      </p>
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400">tempo offline</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                      {financialSummary.total_incidents}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {financialSummary.total_incidents === 1 ? 'incidente' : 'incidentes'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showOnboarding && currentOnboarding && (
          <div className="border border-primary/40 bg-primary/5 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 text-primary text-7xl font-black pr-4 pt-2">
              PW
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <p className="text-sm uppercase tracking-[0.2em] text-primary font-semibold mb-1">
                  Onboarding PulseWatch
                </p>
                <h2 className="text-2xl font-bold mb-1">{currentOnboarding.title}</h2>
                <p className="text-muted-foreground">{currentOnboarding.description}</p>
                <div className="flex items-center gap-2 mt-4">
                  {onboardingSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index <= onboardingStep ? 'w-8 bg-primary' : 'w-4 bg-primary/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  disabled={onboardingStep === 0}
                  onClick={() => setOnboardingStep((prev) => Math.max(prev - 1, 0))}
                >
                  Passo anterior
                </Button>
                {onboardingStep < onboardingSteps.length - 1 ? (
                  <Button onClick={() => setOnboardingStep((prev) => Math.min(prev + 1, onboardingSteps.length - 1))}>
                    Próximo passo
                  </Button>
                ) : (
                  <Button onClick={completeOnboarding} className="bg-green-600 hover:bg-green-700">
                    Começar agora
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lojas</h1>
            <p className="text-muted-foreground">
              Gerencie suas lojas monitoradas
            </p>
          </div>
          {(() => {
            const isPremiumOrUltimate = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'ultimate'
            const atFreeLimit = !isPremiumOrUltimate && stores.length >= 1

            if (atFreeLimit) {
              return (
                <div className="flex items-center gap-2">
                  <Button disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Limite do Free
                  </Button>
                  <Link href="/settings">
                    <Button variant="outline">Upgrade</Button>
                  </Link>
                </div>
              )
            }

            return (
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Loja
              </Button>
            )
          })()}
        </div>

        {(() => {
          const isPremiumOrUltimate = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'ultimate'
          const atFreeLimit = !isPremiumOrUltimate && stores.length >= 1

          if (!atFreeLimit) return null

          return (
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle>Você atingiu o limite do plano Free</CardTitle>
                <CardDescription>
                  Faça upgrade para o Premium e monitore quantas lojas quiser.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/settings">
                  <Button className="w-full">⚡ Upgrade para PRO</Button>
                </Link>
              </CardContent>
            </Card>
          )
        })()}

        {/* Add/Edit Store Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingStore ? 'Editar Loja' : 'Nova Loja'}</CardTitle>
              <CardDescription>
                {editingStore 
                  ? 'Atualize as informações da loja' 
                  : 'Adicione uma nova loja para monitoramento'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingStore ? handleEditStore : handleAddStore} className="space-y-4">
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
                        onBlur={handleDetectPlatform}
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
                    <p className="text-xs text-muted-foreground">
                      A plataforma será detectada automaticamente
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenuePerHour">Receita média por hora</Label>
                  <Input
                    id="revenuePerHour"
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={formData.revenuePerHour}
                    onChange={(e) =>
                      setFormData({ ...formData, revenuePerHour: maskBRL(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado para estimar perdas durante quedas. Deixe vazio para cálculo automático.
                  </p>
                </div>

                {detectedPlatform && detectedPlatform.platform && (
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

                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma (opcional)</Label>
                  <select
                    id="platform"
                    className="w-full border rounded-md px-2 py-2 text-sm bg-background"
                    value={currentPlatform || ''}
                    onChange={(e) =>
                      setSelectedPlatform(e.target.value ? e.target.value : null)
                    }
                  >
                    <option value="">Automática</option>
                    <option value="shopify">Shopify</option>
                    <option value="woocommerce">WooCommerce</option>
                    <option value="nuvemshop">Nuvemshop</option>
                    <option value="tray">Tray</option>
                    <option value="vtex">VTEX</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Se preferir, selecione manualmente a plataforma. Se deixar em branco, usaremos a detecção automática.
                  </p>
                </div>

                {currentPlatform === 'tray' && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <p className="text-sm font-medium">
                      Credenciais da API Tray
                      {editingStore && (
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          (Deixe vazio para manter as atuais)
                        </span>
                      )}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="trayAccessToken">Access Token</Label>
                        <Input
                          id="trayAccessToken"
                          type="password"
                          placeholder={editingStore ? 'Manter atual' : 'access_token...'}
                          value={formData.trayAccessToken}
                          onChange={(e) =>
                            setFormData({ ...formData, trayAccessToken: e.target.value })
                          }
                          required={!editingStore}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentPlatform === 'shopify' && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <p className="text-sm font-medium">
                      Credenciais da API Shopify
                      {editingStore && (
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          (Deixe vazio para manter as atuais)
                        </span>
                      )}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="shopifyApiKey">API Key</Label>
                        <Input
                          id="shopifyApiKey"
                          type="password"
                          placeholder={editingStore ? "Manter atual" : "shpat_..."}
                          value={formData.shopifyApiKey}
                          onChange={(e) =>
                            setFormData({ ...formData, shopifyApiKey: e.target.value })
                          }
                          required={!editingStore}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopifyPassword">Admin API Access Token</Label>
                        <Input
                          id="shopifyPassword"
                          type="password"
                          placeholder={editingStore ? "Manter atual" : "shpat_..."}
                          value={formData.shopifyPassword}
                          onChange={(e) =>
                            setFormData({ ...formData, shopifyPassword: e.target.value })
                          }
                          required={!editingStore}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      📝 Você pode obter essas credenciais em: Shopify Admin → Settings → Apps and sales channels → Develop apps
                    </p>
                  </div>
                )}

                {currentPlatform === 'woocommerce' && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <p className="text-sm font-medium">
                      Credenciais da API WooCommerce
                      {editingStore && (
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          (Deixe vazio para manter as atuais)
                        </span>
                      )}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="wooConsumerKey">Consumer Key</Label>
                        <Input
                          id="wooConsumerKey"
                          type="password"
                          placeholder={editingStore ? "Manter atual" : "ck_..."}
                          value={formData.wooConsumerKey}
                          onChange={(e) =>
                            setFormData({ ...formData, wooConsumerKey: e.target.value })
                          }
                          required={!editingStore}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wooConsumerSecret">Consumer Secret</Label>
                        <Input
                          id="wooConsumerSecret"
                          type="password"
                          placeholder={editingStore ? "Manter atual" : "cs_..."}
                          value={formData.wooConsumerSecret}
                          onChange={(e) =>
                            setFormData({ ...formData, wooConsumerSecret: e.target.value })
                          }
                          required={!editingStore}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentPlatform === 'nuvemshop' && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <p className="text-sm font-medium">
                      Credenciais da API Nuvemshop
                      {editingStore && (
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          (Deixe vazio para manter as atuais)
                        </span>
                      )}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nuvemshopStoreId">Store ID</Label>
                        <Input
                          id="nuvemshopStoreId"
                          placeholder={editingStore ? "Manter atual" : "123456"}
                          value={formData.nuvemshopStoreId}
                          onChange={(e) =>
                            setFormData({ ...formData, nuvemshopStoreId: e.target.value })
                          }
                          required={!editingStore}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nuvemshopAccessToken">Access Token</Label>
                        <Input
                          id="nuvemshopAccessToken"
                          type="password"
                          placeholder={editingStore ? "Manter atual" : "token..."}
                          value={formData.nuvemshopAccessToken}
                          onChange={(e) =>
                            setFormData({ ...formData, nuvemshopAccessToken: e.target.value })
                          }
                          required={!editingStore}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingStore ? 'Atualizar' : 'Adicionar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
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
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(store)}
                      >
                        <Edit className="h-4 w-4" />
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
