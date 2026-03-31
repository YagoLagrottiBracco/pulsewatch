import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiKey, listApiKeys, revokeApiKey } from '@/services/api-keys'

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

export async function GET() {
  const auth = await requireAgency()
  if (auth.error) return auth.error

  const keys = await listApiKeys(auth.user!.id)
  return NextResponse.json({ keys })
}

export async function POST(request: NextRequest) {
  const auth = await requireAgency()
  if (auth.error) return auth.error

  const { name, scopes } = await request.json()
  if (!name) {
    return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 })
  }

  const result = await createApiKey(auth.user!.id, name, scopes)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ key: result.key, keyPrefix: result.keyPrefix })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAgency()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const keyId = searchParams.get('id')
  if (!keyId) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  const result = await revokeApiKey(auth.user!.id, keyId)
  return NextResponse.json(result)
}
