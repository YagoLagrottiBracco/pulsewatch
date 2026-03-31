'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Gift, Copy, Send, Users, Check, Link2 } from 'lucide-react'

interface ReferralStats {
  totalReferrals: number
  signedUp: number
  converted: number
  totalBonusDays: number
  referralCode: string
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleInvite = async () => {
    if (!email) return
    setSending(true)
    setMessage('')

    const res = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    if (data.success) {
      setMessage('Indicacao criada com sucesso!')
      setEmail('')
      // Refresh stats
      const statsRes = await fetch('/api/referral')
      setStats(await statsRes.json())
    } else {
      setMessage('Erro ao criar indicacao. Tente novamente.')
    }
    setSending(false)
  }

  const copyLink = () => {
    if (!stats) return
    const link = `${window.location.origin}/auth?ref=${stats.referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Programa de Indicacao</h1>
          <p className="text-gray-500">Indique amigos e ganhe dias extras de trial!</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Send className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
                  <p className="text-sm text-gray-500">Indicacoes enviadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.signedUp || 0}</p>
                  <p className="text-sm text-gray-500">Cadastrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Check className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.converted || 0}</p>
                  <p className="text-sm text-gray-500">Convertidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">+{stats?.totalBonusDays || 0}</p>
                  <p className="text-sm text-gray-500">Dias bonus ganhos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Seu Link de Indicacao
            </CardTitle>
            <CardDescription>
              Compartilhe este link com amigos. Quando eles assinarem, voce ganha +7 dias de trial!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                readOnly
                value={stats ? `${window.location.origin}/auth?ref=${stats.referralCode}` : 'Carregando...'}
                className="font-mono text-sm"
              />
              <Button onClick={copyLink} variant="outline" className="flex-shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            {stats?.referralCode && (
              <p className="text-xs text-gray-400 mt-2">
                Codigo: <span className="font-mono font-bold">{stats.referralCode}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Invite by email */}
        <Card>
          <CardHeader>
            <CardTitle>Indicar por Email</CardTitle>
            <CardDescription>
              Envie um convite diretamente para o email do seu contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
              <Button onClick={handleInvite} disabled={sending || !email}>
                <Send className="h-4 w-4 mr-1" />
                {sending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
            {message && (
              <p className={`text-sm mt-2 ${message.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-1">1. Compartilhe</h4>
                <p className="text-sm text-gray-500">Envie seu link ou convide por email</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-1">2. Amigo assina</h4>
                <p className="text-sm text-gray-500">Seu amigo cria conta e faz upgrade</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-1">3. Ganhe bonus</h4>
                <p className="text-sm text-gray-500">Voce recebe +7 dias de trial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
