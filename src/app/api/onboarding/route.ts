import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingProgress, completeOnboardingStep, OnboardingStepKey } from '@/services/onboarding'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Update last_active_at
  await supabase
    .from('user_profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('user_id', user.id)

  const progress = await getOnboardingProgress(supabase, user.id)
  return NextResponse.json(progress)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { stepKey } = await request.json()

  if (!stepKey) {
    return NextResponse.json({ error: 'stepKey obrigatório' }, { status: 400 })
  }

  const result = await completeOnboardingStep(supabase, user.id, stepKey as OnboardingStepKey)

  if (!result.success) {
    return NextResponse.json({ error: 'Erro ao completar step' }, { status: 500 })
  }

  const progress = await getOnboardingProgress(supabase, user.id)
  return NextResponse.json({ ...progress, newBonusDays: result.newBonusDays })
}
