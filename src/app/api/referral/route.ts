import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReferralStats, createReferralInvite, getOrCreateReferralCode } from '@/services/referral'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const stats = await getReferralStats(supabase, user.id)
  return NextResponse.json(stats)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
  }

  const result = await createReferralInvite(supabase, user.id, email)

  if (!result.success) {
    return NextResponse.json({ error: 'Erro ao criar indicação' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    referralCode: result.code,
    referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth?ref=${result.code}`,
  })
}
