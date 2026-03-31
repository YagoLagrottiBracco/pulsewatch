import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWhitelabelConfig, updateWhitelabelConfig } from '@/services/agency'

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

// GET /api/agency/whitelabel
export async function GET() {
  const auth = await requireAgency()
  if (auth.error) return auth.error

  try {
    const config = await getWhitelabelConfig(auth.user!.id)
    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar whitelabel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/agency/whitelabel
export async function PUT(request: NextRequest) {
  const auth = await requireAgency()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const result = await updateWhitelabelConfig(auth.user!.id, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao atualizar whitelabel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
