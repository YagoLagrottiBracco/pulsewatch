'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageSquare, User, Save, ExternalLink } from 'lucide-react'
import { logAudit, AuditActions, EntityTypes } from '@/lib/audit-logger'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    email_notifications: true,
    telegram_notifications: false,
    telegram_chat_id: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    console.log('User data:', user)

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('Profile data:', data, 'Error:', error)

    // Se o perfil não existe, criar um
    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
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

      console.log('Created new profile:', newProfile)

      if (!createError && newProfile) {
        setProfile(newProfile)
        setFormData({
          full_name: newProfile.full_name || '',
          email: user.email || '',
          email_notifications: newProfile.email_notifications ?? true,
          telegram_notifications: newProfile.telegram_notifications ?? false,
          telegram_chat_id: newProfile.telegram_chat_id || '',
        })
      } else {
        // Fallback: mesmo com erro, mostrar email do usuário
        setFormData({
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
          email_notifications: true,
          telegram_notifications: false,
          telegram_chat_id: '',
        })
      }
    } else if (data) {
      setProfile(data)
      setFormData({
        full_name: data.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '', // Email vem do auth, não do perfil
        email_notifications: data.email_notifications ?? true,
        telegram_notifications: data.telegram_notifications ?? false,
        telegram_chat_id: data.telegram_chat_id || '',
      })
    } else {
      // Fallback final: sempre mostrar pelo menos o email
      setFormData({
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        email_notifications: true,
        telegram_notifications: false,
        telegram_chat_id: '',
      })
    }

    console.log('Final formData:', formData)
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          email_notifications: formData.email_notifications,
          telegram_notifications: formData.telegram_notifications,
          telegram_chat_id: formData.telegram_chat_id,
        })
        .eq('user_id', user.id)

      if (error) throw error

      await logAudit({
        action: AuditActions.SETTINGS_UPDATED,
        entity_type: EntityTypes.USER_PROFILE,
        entity_id: user.id,
        metadata: { 
          email_notifications: formData.email_notifications,
          telegram_notifications: formData.telegram_notifications
        }
      })

      setMessage('Configurações salvas com sucesso!')
      loadProfile()
    } catch (error: any) {
      setMessage('Erro ao salvar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const getTelegramLink = () => {
    return 'https://t.me/PulseWatch_Bot'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e notificações
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-md ${
              message.includes('sucesso')
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Perfil</CardTitle>
              </div>
              <CardDescription>Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Notificações por Email</CardTitle>
              </div>
              <CardDescription>
                Receba alertas por email quando eventos importantes acontecerem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ativar notificações por email</p>
                  <p className="text-sm text-muted-foreground">
                    Você receberá emails sobre alertas críticos
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.email_notifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email_notifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {formData.email_notifications && (
                <div className="p-4 bg-green-500/10 rounded-md">
                  <p className="text-sm text-green-600 font-medium">
                    ✓ Notificações por email ativadas
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enviando para: {formData.email}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Telegram Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <CardTitle>Notificações por Telegram</CardTitle>
              </div>
              <CardDescription>
                Receba alertas instantâneos no Telegram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ativar notificações por Telegram</p>
                  <p className="text-sm text-muted-foreground">
                    Mensagens instantâneas no seu celular
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.telegram_notifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telegram_notifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {formData.telegram_notifications && (
                <>
                  {!formData.telegram_chat_id ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md space-y-3">
                      <p className="text-sm font-medium">
                        Configure seu Telegram
                      </p>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Abra o Telegram no seu celular</li>
                        <li>Procure pelo bot @PulseWatchBot</li>
                        <li>Envie o comando /start</li>
                        <li>Copie o código que o bot enviar</li>
                        <li>Cole abaixo e salve</li>
                      </ol>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={getTelegramLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir Telegram
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/10 rounded-md">
                      <p className="text-sm text-green-600 font-medium">
                        ✓ Telegram configurado
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Chat ID: {formData.telegram_chat_id}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="telegram_chat_id">
                      Chat ID do Telegram
                    </Label>
                    <Input
                      id="telegram_chat_id"
                      value={formData.telegram_chat_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          telegram_chat_id: e.target.value,
                        })
                      }
                      placeholder="123456789"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtenha este código enviando /start para o bot
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>

        {/* Account Info & Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Plano & Assinatura</CardTitle>
            <CardDescription>
              Gerencie sua assinatura do PulseWatch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Plano Atual</p>
                <div className="flex items-center gap-2">
                  {profile?.plan === 'pro' ? (
                    <>
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        PRO
                      </Badge>
                      {profile?.subscription_status === 'active' && (
                        <span className="text-xs text-green-600">✓ Ativo</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Badge variant="outline">FREE</Badge>
                      {profile?.trial_ends_at && 
                        new Date(profile.trial_ends_at) > new Date() && (
                        <span className="text-xs text-blue-600">
                          Trial até {new Date(profile.trial_ends_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {profile?.trial_ends_at &&
                        new Date(profile.trial_ends_at) <= new Date() && (
                        <span className="text-xs text-red-600">
                          Trial expirado
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {profile?.plan !== 'pro' && (
                <Button
                  onClick={async () => {
                    setSaving(true)
                    try {
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()
                      
                      const response = await fetch('/api/stripe/create-checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user?.id }),
                      })
                      
                      const { url } = await response.json()
                      if (url) window.location.href = url
                    } catch (error) {
                      console.error('Checkout error:', error)
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  ⚡ Upgrade para PRO
                </Button>
              )}
            </div>

            {profile?.plan === 'pro' && profile?.subscription_ends_at && (
              <div className="text-sm text-muted-foreground">
                Renovação em: {new Date(profile.subscription_ends_at).toLocaleDateString('pt-BR')}
              </div>
            )}

            {profile?.plan === 'pro' && profile?.stripe_customer_id && (
              <Button
                variant="outline"
                onClick={async () => {
                  setSaving(true)
                  try {
                    const response = await fetch('/api/stripe/create-portal', {
                      method: 'POST',
                    })
                    const { url } = await response.json()
                    if (url) window.location.href = url
                  } catch (error) {
                    console.error('Portal error:', error)
                    setMessage('Erro ao abrir portal de gerenciamento')
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
              >
                Gerenciar Assinatura
              </Button>
            )}

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Membro desde:</span>
                <span className="font-medium">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </span>
              </div>
            </div>

            {profile?.plan !== 'pro' && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="font-semibold mb-2">💎 Benefícios do Plano PRO:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Lojas ilimitadas</li>
                  <li>✓ Produtos ilimitados</li>
                  <li>✓ Alertas em tempo real</li>
                  <li>✓ Notificações por Email e Telegram</li>
                  <li>✓ Suporte prioritário</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
