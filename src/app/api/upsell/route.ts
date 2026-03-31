import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { featureKey, action } = await request.json()

  if (!featureKey || !action) {
    return NextResponse.json({ error: 'featureKey e action obrigatórios' }, { status: 400 })
  }

  const { error } = await supabase.from('upsell_events').insert({
    user_id: user.id,
    feature_key: featureKey,
    action,
  })

  if (error) {
    return NextResponse.json({ error: 'Erro ao registrar evento' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
