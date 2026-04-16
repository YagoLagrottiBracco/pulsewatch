import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAgencyDashboard,
  createWorkspace,
  deleteWorkspace,
  assignStoreToWorkspace,
} from '@/services/agency'
import { captureError } from '@/lib/sentry'

async function requireAgency() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single()

  if (profile?.subscription_tier !== 'agency') {
    return { error: NextResponse.json({ error: 'Recurso exclusivo do plano Agency' }, { status: 403 }) }
  }

  return { user }
}

// GET /api/agency — dashboard consolidado
export async function GET() {
  const auth = await requireAgency()
  if (auth.error) return auth.error

  try {
    const data = await getAgencyDashboard(auth.user!.id)
    return NextResponse.json(data)
  } catch (error) {
    captureError(error, { module: 'api/agency' })
    console.error('Erro ao buscar dashboard agência:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/agency — criar workspace ou atribuir loja
export async function POST(request: NextRequest) {
  const auth = await requireAgency()
  if (auth.error) return auth.error

  try {
    const body = await request.json()

    if (body.action === 'assign-store') {
      const result = await assignStoreToWorkspace(auth.user!.id, body.storeId, body.workspaceId)
      return NextResponse.json(result)
    }

    // Default: criar workspace
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'name e slug são obrigatórios' }, { status: 400 })
    }

    const result = await createWorkspace(auth.user!.id, body)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ workspace: result.workspace })
  } catch (error) {
    captureError(error, { module: 'api/agency' })
    console.error('Erro na API de agência:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/agency?workspaceId=xxx — remover workspace
export async function DELETE(request: NextRequest) {
  const auth = await requireAgency()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId é obrigatório' }, { status: 400 })
    }

    const result = await deleteWorkspace(auth.user!.id, workspaceId)
    return NextResponse.json(result)
  } catch (error) {
    captureError(error, { module: 'api/agency' })
    console.error('Erro ao remover workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
