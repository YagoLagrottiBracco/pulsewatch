import { SupabaseClient } from '@supabase/supabase-js'

export const ONBOARDING_STEPS = [
  { key: 'add_store', label: 'Adicionar sua primeira loja', points: 20 },
  { key: 'configure_alerts', label: 'Configurar alertas', points: 15 },
  { key: 'connect_telegram', label: 'Conectar Telegram', points: 15 },
  { key: 'invite_member', label: 'Convidar um membro', points: 20 },
  { key: 'view_report', label: 'Visualizar primeiro relatório', points: 15 },
  { key: 'configure_webhook', label: 'Configurar webhook', points: 15 },
] as const

export type OnboardingStepKey = typeof ONBOARDING_STEPS[number]['key']

export interface OnboardingProgress {
  steps: Array<{
    key: string
    label: string
    points: number
    completed: boolean
    completedAt: string | null
  }>
  totalPoints: number
  earnedPoints: number
  percentComplete: number
  trialBonusDays: number
}

export async function getOnboardingProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingProgress> {
  const { data: completedSteps } = await supabase
    .from('onboarding_steps')
    .select('step_key, completed, completed_at')
    .eq('user_id', userId)

  const completedMap = new Map(
    (completedSteps || []).map(s => [s.step_key, s])
  )

  const steps = ONBOARDING_STEPS.map(step => ({
    key: step.key,
    label: step.label,
    points: step.points,
    completed: completedMap.get(step.key)?.completed || false,
    completedAt: completedMap.get(step.key)?.completed_at || null,
  }))

  const totalPoints = ONBOARDING_STEPS.reduce((sum, s) => sum + s.points, 0)
  const earnedPoints = steps
    .filter(s => s.completed)
    .reduce((sum, s) => sum + s.points, 0)

  // Cada 2 steps completos = +1 dia de trial bonus
  const completedCount = steps.filter(s => s.completed).length
  const trialBonusDays = Math.floor(completedCount / 2)

  return {
    steps,
    totalPoints,
    earnedPoints,
    percentComplete: Math.round((earnedPoints / totalPoints) * 100),
    trialBonusDays,
  }
}

export async function completeOnboardingStep(
  supabase: SupabaseClient,
  userId: string,
  stepKey: OnboardingStepKey
): Promise<{ success: boolean; newBonusDays: number }> {
  const { error } = await supabase
    .from('onboarding_steps')
    .upsert({
      user_id: userId,
      step_key: stepKey,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,step_key' })

  if (error) {
    console.error('Erro ao completar step:', error)
    return { success: false, newBonusDays: 0 }
  }

  // Recalcular bonus
  const progress = await getOnboardingProgress(supabase, userId)

  // Atualizar trial_bonus_days no perfil
  await supabase
    .from('user_profiles')
    .update({ trial_bonus_days: progress.trialBonusDays })
    .eq('user_id', userId)

  return { success: true, newBonusDays: progress.trialBonusDays }
}
