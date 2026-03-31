'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'login-required'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    checkAuthAndAccept()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthAndAccept = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setStatus('login-required')
      return
    }

    acceptInvite()
  }

  const acceptInvite = async () => {
    setStatus('accepting')
    try {
      const res = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (res.ok) {
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        const json = await res.json()
        setErrorMsg(json.error || 'Erro ao aceitar convite')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Erro de conexão')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Convite PulseWatch</CardTitle>
          <CardDescription>Convite para participar de um time</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {(status === 'loading' || status === 'accepting') && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {status === 'loading' ? 'Verificando...' : 'Aceitando convite...'}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="font-medium text-green-700">Convite aceito com sucesso!</p>
              <p className="text-sm text-muted-foreground">Redirecionando para o dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-12 w-12 text-red-600" />
              <p className="font-medium text-red-700">{errorMsg}</p>
              <Button onClick={() => router.push('/dashboard')}>Ir para o Dashboard</Button>
            </div>
          )}

          {status === 'login-required' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-muted-foreground">
                Você precisa estar logado para aceitar este convite.
              </p>
              <Button onClick={() => router.push(`/login?redirect=/invite/${token}`)}>
                Fazer Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
