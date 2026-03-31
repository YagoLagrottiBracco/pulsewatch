import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: surveys } = await supabase
    .from('nps_surveys')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ surveys: surveys || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { score, feedback } = await request.json()

  if (score === undefined || score < 0 || score > 10) {
    return NextResponse.json({ error: 'Score deve ser entre 0 e 10' }, { status: 400 })
  }

  const { error } = await supabase.from('nps_surveys').insert({
    user_id: user.id,
    score,
    feedback: feedback || null,
    trigger_type: 'manual',
  })

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar NPS' }, { status: 500 })
  }

  // Mark NPS as completed
  await supabase
    .from('user_profiles')
    .update({ nps_completed: true })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
