'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, Trash2, Crown, Eye, Settings2, Lock } from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  role: 'owner' | 'manager' | 'viewer'
  status: 'pending' | 'active' | 'removed'
  fullName?: string | null
  invitedAt: string
  acceptedAt: string | null
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [limit, setLimit] = useState(0)
  const [tier, setTier] = useState('free')
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'viewer'>('viewer')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    loadTeam()
  }, [])

  const loadTeam = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/team')
      if (res.ok) {
        const json = await res.json()
        setMembers(json.members)
        setLimit(json.limit)
        setTier(json.tier)
      }
    } catch {
      // silently ignore
    }
    setLoading(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setMessage('')

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })

      const json = await res.json()

      if (res.ok) {
        setMessage('Convite enviado com sucesso!')
        setMessageType('success')
        setInviteEmail('')
        loadTeam()
      } else {
        setMessage(json.error || 'Erro ao enviar convite')
        setMessageType('error')
      }
    } catch {
      setMessage('Erro de conexão')
      setMessageType('error')
    }
    setInviting(false)
  }

  const handleRemove = async (memberId: string) => {
    try {
      const res = await fetch(`/api/team?memberId=${memberId}`, { method: 'DELETE' })
      if (res.ok) {
        loadTeam()
      }
    } catch {
      // silently ignore
    }
  }

  const handleRoleChange = async (memberId: string, newRole: 'manager' | 'viewer') => {
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      })
      if (res.ok) {
        loadTeam()
      }
    } catch {
      // silently ignore
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-purple-600 text-white"><Crown className="h-3 w-3 mr-1" />Owner</Badge>
      case 'manager':
        return <Badge className="bg-blue-600 text-white"><Settings2 className="h-3 w-3 mr-1" />Manager</Badge>
      case 'viewer':
        return <Badge variant="outline"><Eye className="h-3 w-3 mr-1" />Viewer</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 text-white">Ativo</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const isTeamEnabled = ['business', 'agency'].includes(tier)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando time...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Time
          </h1>
          <p className="text-muted-foreground">
            Gerencie os membros do seu time e defina papéis
          </p>
        </div>

        {!isTeamEnabled ? (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
            <CardContent className="flex items-center gap-4 py-6">
              <Lock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-400">
                  Recurso disponível nos planos Business e Agency
                </p>
                <p className="text-sm text-yellow-600/80 dark:text-yellow-400/70">
                  Faça upgrade para adicionar membros ao seu time.
                  Business: até 3 membros • Agency: ilimitado
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Invite Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Convidar Membro
                </CardTitle>
                <CardDescription>
                  {members.length} de {limit === 999 ? 'ilimitado' : limit} membro{limit !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'manager' | 'viewer')}
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={inviting}>
                    {inviting ? 'Enviando...' : 'Convidar'}
                  </Button>
                </form>

                {message && (
                  <p className={`mt-3 text-sm ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle>Membros</CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum membro no time ainda. Envie um convite acima.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.fullName || member.email}</p>
                            {getRoleBadge(member.role)}
                            {getStatusBadge(member.status)}
                          </div>
                          {member.fullName && (
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Convidado em {new Date(member.invitedAt).toLocaleDateString('pt-BR')}
                            {member.acceptedAt && ` • Aceito em ${new Date(member.acceptedAt).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role !== 'owner' && (
                            <>
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value as 'manager' | 'viewer')}
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              >
                                <option value="viewer">Viewer</option>
                                <option value="manager">Manager</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemove(member.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Roles Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Papéis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 font-medium">
                      <Crown className="h-4 w-4 text-purple-600" /> Owner
                    </div>
                    <p className="text-muted-foreground">
                      Acesso total. Gerencia membros, lojas, alertas e configurações.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 font-medium">
                      <Settings2 className="h-4 w-4 text-blue-600" /> Manager
                    </div>
                    <p className="text-muted-foreground">
                      Gerencia lojas e alertas. Pode reconhecer alertas e configurar monitoramento.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 font-medium">
                      <Eye className="h-4 w-4" /> Viewer
                    </div>
                    <p className="text-muted-foreground">
                      Visualiza lojas, alertas e métricas. Pode reconhecer alertas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
