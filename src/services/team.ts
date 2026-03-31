/**
 * Serviço de gerenciamento de times.
 *
 * Gerencia membros, convites, limites por tier e roteamento de alertas.
 * Gate: business+ (3 membros), agency (ilimitado).
 */

import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './email'

const TIER_MEMBER_LIMITS: Record<string, number> = {
  free: 0,
  pro: 0,
  business: 3,
  agency: 999,
}

export interface TeamMember {
  id: string
  email: string
  role: 'owner' | 'manager' | 'viewer'
  status: 'pending' | 'active' | 'removed'
  fullName?: string | null
  invitedAt: string
  acceptedAt: string | null
}

export interface InviteResult {
  success: boolean
  error?: string
  member?: TeamMember
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Retorna o limite de membros para o tier do usuário.
 */
export function getMemberLimit(tier: string): number {
  return TIER_MEMBER_LIMITS[tier] || 0
}

/**
 * Lista membros do time de um owner.
 */
export async function listTeamMembers(ownerId: string): Promise<TeamMember[]> {
  const supabase = getSupabase()

  const { data: members } = await supabase
    .from('account_members')
    .select('*')
    .eq('account_owner_id', ownerId)
    .neq('status', 'removed')
    .order('created_at', { ascending: true })

  if (!members) return []

  // Enriquecer com nomes dos usuários ativos
  const userIds = members.filter(m => m.user_id).map(m => m.user_id)
  let profileMap: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .in('user_id', userIds)

    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map(p => [p.user_id, p.full_name])
      )
    }
  }

  return members.map(m => ({
    id: m.id,
    email: m.email,
    role: m.role,
    status: m.status,
    fullName: m.user_id ? profileMap[m.user_id] || null : null,
    invitedAt: m.invited_at,
    acceptedAt: m.accepted_at,
  }))
}

/**
 * Envia convite para um novo membro.
 */
export async function inviteTeamMember(
  ownerId: string,
  ownerTier: string,
  email: string,
  role: 'manager' | 'viewer'
): Promise<InviteResult> {
  const supabase = getSupabase()

  // Verificar limite de membros
  const limit = getMemberLimit(ownerTier)
  if (limit === 0) {
    return { success: false, error: 'Seu plano não permite adicionar membros ao time.' }
  }

  const { data: existingMembers } = await supabase
    .from('account_members')
    .select('id')
    .eq('account_owner_id', ownerId)
    .neq('status', 'removed')

  const currentCount = existingMembers?.length || 0
  if (currentCount >= limit) {
    return {
      success: false,
      error: `Limite de ${limit} membro${limit > 1 ? 's' : ''} atingido. Faça upgrade para adicionar mais.`,
    }
  }

  // Verificar se já foi convidado
  const { data: existing } = await supabase
    .from('account_members')
    .select('id, status')
    .eq('account_owner_id', ownerId)
    .eq('email', email)
    .single()

  if (existing) {
    if (existing.status === 'removed') {
      // Re-ativar membro removido
      const { data: updated } = await supabase
        .from('account_members')
        .update({
          status: 'pending',
          role,
          invite_token: crypto.randomUUID(),
          invited_at: new Date().toISOString(),
          accepted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updated) {
        await sendInviteEmail(email, updated.invite_token, ownerId)
        return {
          success: true,
          member: {
            id: updated.id,
            email: updated.email,
            role: updated.role,
            status: updated.status,
            invitedAt: updated.invited_at,
            acceptedAt: null,
          },
        }
      }
    }
    return { success: false, error: 'Este email já foi convidado para o time.' }
  }

  // Verificar se o email pertence a um usuário existente
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('email', email)
    .single()

  // Criar membro
  const { data: member, error } = await supabase
    .from('account_members')
    .insert({
      account_owner_id: ownerId,
      user_id: existingUser?.user_id || null,
      email,
      role,
    })
    .select()
    .single()

  if (error || !member) {
    return { success: false, error: 'Erro ao criar convite.' }
  }

  // Enviar email de convite
  await sendInviteEmail(email, member.invite_token, ownerId)

  return {
    success: true,
    member: {
      id: member.id,
      email: member.email,
      role: member.role,
      status: member.status,
      invitedAt: member.invited_at,
      acceptedAt: null,
    },
  }
}

/**
 * Aceita um convite via token.
 */
export async function acceptInvite(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()

  const { data: member } = await supabase
    .from('account_members')
    .select('*')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single()

  if (!member) {
    return { success: false, error: 'Convite inválido ou expirado.' }
  }

  const { error } = await supabase
    .from('account_members')
    .update({
      user_id: userId,
      status: 'active',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', member.id)

  if (error) {
    return { success: false, error: 'Erro ao aceitar convite.' }
  }

  return { success: true }
}

/**
 * Remove um membro do time.
 */
export async function removeTeamMember(ownerId: string, memberId: string): Promise<{ success: boolean }> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('account_members')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('account_owner_id', ownerId)

  return { success: !error }
}

/**
 * Atualiza o papel de um membro.
 */
export async function updateMemberRole(
  ownerId: string,
  memberId: string,
  role: 'manager' | 'viewer'
): Promise<{ success: boolean }> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('account_members')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .eq('account_owner_id', ownerId)

  return { success: !error }
}

/**
 * Busca os owners cujo time inclui o userId (para membros verem dados do owner).
 */
export async function getTeamOwnersForUser(userId: string): Promise<string[]> {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('account_members')
    .select('account_owner_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  return data?.map(d => d.account_owner_id) || []
}

/**
 * Reconhece um alerta.
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string,
  note?: string
): Promise<{ success: boolean }> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('alert_acknowledgments')
    .upsert({
      alert_id: alertId,
      user_id: userId,
      note: note || null,
      acknowledged_at: new Date().toISOString(),
    }, {
      onConflict: 'alert_id,user_id',
    })

  return { success: !error }
}

/**
 * Lista reconhecimentos de um alerta.
 */
export async function getAlertAcknowledgments(alertId: string) {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('alert_acknowledgments')
    .select('*, user_profiles:user_id(full_name, email)')
    .eq('alert_id', alertId)
    .order('acknowledged_at', { ascending: true })

  return data || []
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function sendInviteEmail(email: string, token: string, ownerId: string) {
  const supabase = getSupabase()

  const { data: ownerProfile } = await supabase
    .from('user_profiles')
    .select('full_name, email')
    .eq('user_id', ownerId)
    .single()

  const ownerName = ownerProfile?.full_name || ownerProfile?.email || 'Um usuário'
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

  await sendEmail({
    to: email,
    subject: `Convite para o time no PulseWatch`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; line-height: 1.6; color: #374151; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 22px;">Convite para o Time</h1>
    </div>
    <div class="content">
      <p><strong>${ownerName}</strong> convidou você para fazer parte do time no PulseWatch.</p>
      <p>Ao aceitar, você poderá visualizar lojas, alertas e métricas da conta.</p>
      <div style="text-align: center;">
        <a href="${inviteUrl}" class="button">Aceitar Convite</a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">Se você não esperava este convite, ignore este email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PulseWatch - Monitoramento de E-commerce</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })
}
