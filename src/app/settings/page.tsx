'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageSquare, User, Save, Phone, MessageCircle } from 'lucide-react'
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
    telegram_username: '',
    whatsapp_notifications: false,
    whatsapp_number: '',
    sms_notifications: false,
    sms_number: '',
  })
  const [telegramInput, setTelegramInput] = useState('')
  const [telegramState, setTelegramState] = useState<'idle' | 'waiting' | 'connected'>('idle')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  // Polling + Realtime para detectar conexão do Telegram
  useEffect(() => {
    if (telegramState !== 'waiting' || !currentUserId) return

    // Realtime: escuta mudanças no telegram_chat_id
    const supabase = createClient()
    const channel = supabase
      .channel('telegram-connect')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload: any) => {
          if (payload.new?.telegram_chat_id) {
            setTelegramState('connected')
            setFormData((prev) => ({
              ...prev,
              telegram_chat_id: payload.new.telegram_chat_id,
              telegram_notifications: true,
            }))
          }
        }
      )
      .subscribe()

    // Polling a cada 3 segundos como fallback
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/telegram/connect?userId=${currentUserId}&username=${encodeURIComponent(telegramInput)}`
        )
        const data = await res.json()
        if (data.connected) {
          setTelegramState('connected')
          clearInterval(interval)
        }
      } catch {}
    }, 3000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [telegramState, currentUserId])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    setCurrentUserId(user.id)
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
          telegram_username: newProfile.telegram_username || '',
          whatsapp_notifications: newProfile.whatsapp_notifications ?? false,
          whatsapp_number: newProfile.whatsapp_number || '',
          sms_notifications: newProfile.sms_notifications ?? false,
          sms_number: newProfile.sms_number || '',
        })
      } else {
        setFormData({
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
          email_notifications: true,
          telegram_notifications: false,
          telegram_chat_id: '',
          telegram_username: '',
          whatsapp_notifications: false,
          whatsapp_number: '',
          sms_notifications: false,
          sms_number: '',
        })
      }
    } else if (data) {
      setProfile(data)
      setFormData({
        full_name: data.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        email_notifications: data.email_notifications ?? true,
        telegram_notifications: data.telegram_notifications ?? false,
        telegram_chat_id: data.telegram_chat_id || '',
        telegram_username: data.telegram_username || '',
        whatsapp_notifications: data.whatsapp_notifications ?? false,
        whatsapp_number: data.whatsapp_number || '',
        sms_notifications: data.sms_notifications ?? false,
        sms_number: data.sms_number || '',
      })
      if (data.telegram_chat_id) {
        setTelegramState('connected')
        setTelegramInput(data.telegram_username || '')
      } else if (data.telegram_username) {
        setTelegramInput(data.telegram_username)
      }
    } else {
      setFormData({
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        email_notifications: true,
        telegram_notifications: false,
        telegram_chat_id: '',
        telegram_username: '',
        whatsapp_notifications: false,
        whatsapp_number: '',
        sms_notifications: false,
        sms_number: '',
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
          whatsapp_notifications: formData.whatsapp_notifications,
          whatsapp_number: formData.whatsapp_number,
          sms_notifications: formData.sms_notifications,
          sms_number: formData.sms_number,
        })
        .eq('user_id', user.id)

      if (error) throw error

      await logAudit({
        action: AuditActions.SETTINGS_UPDATED,
        entity_type: EntityTypes.USER_PROFILE,
        entity_id: user.id,
        metadata: { 
          email_notifications: formData.email_notifications,
          telegram_notifications: formData.telegram_notifications,
          whatsapp_notifications: formData.whatsapp_notifications,
          sms_notifications: formData.sms_notifications
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

  const handleTelegramConnect = async () => {
    if (!telegramInput.trim() || !currentUserId) return

    await fetch('/api/telegram/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, username: telegramInput.trim() }),
    })

    setTelegramState('waiting')
  }

  const handleTelegramDisconnect = async () => {
    if (!currentUserId) return
    const supabase = createClient()
    await supabase
      .from('user_profiles')
      .update({ telegram_chat_id: null, telegram_username: null, telegram_notifications: false })
      .eq('user_id', currentUserId)

    setTelegramState('idle')
    setTelegramInput('')
    setFormData((prev) => ({ ...prev, telegram_chat_id: '', telegram_username: '', telegram_notifications: false }))
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
              {telegramState === 'connected' ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-500/10 rounded-md flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        Telegram conectado
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        @{formData.telegram_username || telegramInput}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTelegramDisconnect}
                    >
                      Desconectar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notificações ativas</p>
                      <p className="text-sm text-muted-foreground">
                        Você receberá mensagens diretas no Telegram
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.telegram_notifications}
                        onChange={(e) =>
                          setFormData({ ...formData, telegram_notifications: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              ) : telegramState === 'waiting' ? (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-md space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-sm font-medium">Aguardando conexão...</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Abra o Telegram e envie qualquer mensagem para{' '}
                    <a
                      href="https://t.me/PulseWatchClick_Bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline font-medium"
                    >
                      @PulseWatchClick_Bot
                    </a>
                    . A conexão será feita automaticamente.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTelegramState('idle')}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="telegram_username">Seu usuário do Telegram</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <Input
                          id="telegram_username"
                          value={telegramInput}
                          onChange={(e) => setTelegramInput(e.target.value.replace(/^@/, ''))}
                          placeholder="seuusuario"
                          className="pl-7"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleTelegramConnect}
                        disabled={!telegramInput.trim()}
                      >
                        Conectar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Digite seu @username do Telegram e clique em Conectar
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <CardTitle>Notificações por WhatsApp</CardTitle>
              </div>
              <CardDescription>
                Receba alertas via WhatsApp no seu celular
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ativar notificações por WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Mensagens instantâneas via WhatsApp
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.whatsapp_notifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp_notifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {formData.whatsapp_notifications && (
                <>
                  {!formData.whatsapp_number ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md space-y-3">
                      <p className="text-sm font-medium">
                        Configure seu WhatsApp
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Digite seu número no formato internacional para receber alertas
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/10 rounded-md">
                      <p className="text-sm text-green-600 font-medium">
                        ✓ WhatsApp configurado
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Número: {formData.whatsapp_number}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_number">
                      Número WhatsApp (formato internacional)
                    </Label>
                    <Input
                      id="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whatsapp_number: e.target.value,
                        })
                      }
                      placeholder="+5511999999999"
                    />
                    <p className="text-xs text-muted-foreground">
                      Exemplo: +55 11 99999-9999 → +5511999999999
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* SMS Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <CardTitle>Notificações por SMS</CardTitle>
              </div>
              <CardDescription>
                Receba alertas via mensagem de texto (SMS)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ativar notificações por SMS</p>
                  <p className="text-sm text-muted-foreground">
                    Mensagens de texto instantâneas
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sms_notifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sms_notifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {formData.sms_notifications && (
                <>
                  {!formData.sms_number ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md space-y-3">
                      <p className="text-sm font-medium">
                        Configure seu número de celular
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Digite seu número no formato internacional para receber SMS
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/10 rounded-md">
                      <p className="text-sm text-green-600 font-medium">
                        ✓ SMS configurado
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Número: {formData.sms_number}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="sms_number">
                      Número de celular (formato internacional)
                    </Label>
                    <Input
                      id="sms_number"
                      value={formData.sms_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sms_number: e.target.value,
                        })
                      }
                      placeholder="+5511999999999"
                    />
                    <p className="text-xs text-muted-foreground">
                      Exemplo: +55 11 99999-9999 → +5511999999999
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
                  {profile?.subscription_tier === 'pro' ? (
                    <>
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        PRO
                      </Badge>
                      {profile?.subscription_status === 'active' && (
                        <span className="text-xs text-green-600">✓ Ativo</span>
                      )}
                    </>
                  ) : profile?.subscription_tier === 'business' ? (
                    <>
                      <Badge className="bg-gradient-to-r from-blue-700 to-cyan-600 text-white">
                        BUSINESS
                      </Badge>
                      {profile?.subscription_status === 'active' && (
                        <span className="text-xs text-green-600">✓ Ativo</span>
                      )}
                    </>
                  ) : profile?.subscription_tier === 'agency' ? (
                    <>
                      <Badge className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                        AGENCY
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
              
              {profile?.subscription_tier === 'free' && (
                <Button
                  onClick={async () => {
                    setSaving(true)
                    try {
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()

                      const response = await fetch('/api/stripe/create-checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user?.id, plan: 'pro' }),
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
                  ⚡ Upgrade para Pro
                </Button>
              )}
            </div>

            {(['pro', 'business', 'agency'].includes(profile?.subscription_tier || '')) && profile?.subscription_ends_at && (
              <div className="text-sm text-muted-foreground">
                Renovação em: {new Date(profile.subscription_ends_at).toLocaleDateString('pt-BR')}
              </div>
            )}

            {(['pro', 'business', 'agency'].includes(profile?.subscription_tier || '')) && profile?.stripe_customer_id && (
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

            {profile?.subscription_tier === 'free' && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="font-semibold mb-2">💎 Benefícios do Plano Pro (R$ 39,90/mês):</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Até 5 lojas monitoradas</li>
                  <li>✓ Verificação a cada 5 minutos</li>
                  <li>✓ Alertas por Email, Telegram e WhatsApp</li>
                  <li>✓ Regras personalizadas por loja</li>
                  <li>✓ 7 dias grátis para testar</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
