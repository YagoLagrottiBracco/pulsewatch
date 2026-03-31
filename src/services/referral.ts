import { SupabaseClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

export interface Referral {
  id: string
  referralCode: string
  referredEmail: string | null
  status: 'pending' | 'signed_up' | 'converted' | 'rewarded'
  rewardDays: number
  rewardApplied: boolean
  createdAt: string
  convertedAt: string | null
}

export interface ReferralStats {
  totalReferrals: number
  signedUp: number
  converted: number
  totalBonusDays: number
  referralCode: string
}

function generateReferralCode(): string {
  return `PW-${nanoid(8).toUpperCase()}`
}

export async function getOrCreateReferralCode(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Check existing
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('referral_code')
    .eq('user_id', userId)
    .single()

  if (profile?.referral_code) return profile.referral_code

  // Generate new
  const code = generateReferralCode()
  await supabase
    .from('user_profiles')
    .update({ referral_code: code })
    .eq('user_id', userId)

  return code
}

export async function getReferralStats(
  supabase: SupabaseClient,
  userId: string
): Promise<ReferralStats> {
  const referralCode = await getOrCreateReferralCode(supabase, userId)

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_user_id', userId)

  const list = referrals || []

  return {
    totalReferrals: list.length,
    signedUp: list.filter(r => r.status !== 'pending').length,
    converted: list.filter(r => ['converted', 'rewarded'].includes(r.status)).length,
    totalBonusDays: list
      .filter(r => r.reward_applied)
      .reduce((sum, r) => sum + (r.reward_days || 0), 0),
    referralCode,
  }
}

export async function createReferralInvite(
  supabase: SupabaseClient,
  userId: string,
  email: string
): Promise<{ success: boolean; code: string }> {
  const referralCode = await getOrCreateReferralCode(supabase, userId)

  const { error } = await supabase.from('referrals').insert({
    referrer_user_id: userId,
    referral_code: referralCode,
    referred_email: email,
    status: 'pending',
    reward_type: 'trial_extension',
    reward_days: 7,
  })

  if (error) {
    console.error('Erro ao criar indicação:', error)
    return { success: false, code: referralCode }
  }

  return { success: true, code: referralCode }
}

export async function processReferralSignup(
  supabase: SupabaseClient,
  referralCode: string,
  newUserId: string,
  newUserEmail: string
): Promise<boolean> {
  // Find referral by code
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('referral_code', referralCode)
    .eq('status', 'pending')
    .limit(1)
    .single()

  if (!referral) return false

  // Update referral
  await supabase
    .from('referrals')
    .update({
      referred_user_id: newUserId,
      referred_email: newUserEmail,
      status: 'signed_up',
    })
    .eq('id', referral.id)

  // Mark new user as referred
  await supabase
    .from('user_profiles')
    .update({ referred_by: referralCode })
    .eq('user_id', newUserId)

  return true
}

export async function processReferralConversion(
  supabase: SupabaseClient,
  referredUserId: string
): Promise<boolean> {
  // Find referral for this user
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_user_id', referredUserId)
    .eq('status', 'signed_up')
    .single()

  if (!referral) return false

  // Mark as converted
  await supabase
    .from('referrals')
    .update({
      status: 'converted',
      converted_at: new Date().toISOString(),
    })
    .eq('id', referral.id)

  // Apply reward to referrer (extend trial by reward_days)
  const { data: referrerProfile } = await supabase
    .from('user_profiles')
    .select('trial_bonus_days')
    .eq('user_id', referral.referrer_user_id)
    .single()

  const currentBonus = referrerProfile?.trial_bonus_days || 0

  await supabase
    .from('user_profiles')
    .update({ trial_bonus_days: currentBonus + (referral.reward_days || 7) })
    .eq('user_id', referral.referrer_user_id)

  await supabase
    .from('referrals')
    .update({ status: 'rewarded', reward_applied: true })
    .eq('id', referral.id)

  return true
}
