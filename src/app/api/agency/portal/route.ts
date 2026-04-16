import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePortalToken, validatePortalToken } from '@/services/agency'
import { captureError } from '@/lib/sentry'

// POST /api/agency/portal — gerar token de portal
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single()

  if (profile?.subscription_tier !== 'agency') {
    return NextResponse.json({ error: 'Recurso exclusivo do plano Agency' }, { status: 403 })
  }

  try {
    const { workspaceId } = await request.json()
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId é obrigatório' }, { status: 400 })
    }

    const result = await generatePortalToken(user.id, workspaceId)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${result.token}`
    return NextResponse.json({ token: result.token, portalUrl })
  } catch (error) {
    captureError(error, { module: 'api/agency/portal' })
    console.error('Erro ao gerar portal token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/agency/portal?token=xxx — validar token e buscar dados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
    }

    const result = await validatePortalToken(token)
    if (!result.valid) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    captureError(error, { module: 'api/agency/portal' })
    console.error('Erro ao validar portal token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
