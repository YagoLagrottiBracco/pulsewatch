import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  listTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateMemberRole,
  getMemberLimit,
} from '@/services/team'

// GET /api/team — lista membros do time
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    const tier = profile?.subscription_tier || 'free'
    const members = await listTeamMembers(user.id)
    const limit = getMemberLimit(tier)

    return NextResponse.json({ members, limit, tier })
  } catch (error) {
    console.error('Erro ao listar time:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/team — convidar membro
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    const tier = profile?.subscription_tier || 'free'
    const body = await request.json()
    const { email, role } = body

    if (!email || !['manager', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Email e role (manager/viewer) são obrigatórios' }, { status: 400 })
    }

    const result = await inviteTeamMember(user.id, tier, email, role)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ member: result.member })
  } catch (error) {
    console.error('Erro ao convidar membro:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/team — atualizar role
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { memberId, role } = body

    if (!memberId || !['manager', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'memberId e role são obrigatórios' }, { status: 400 })
    }

    const result = await updateMemberRole(user.id, memberId, role)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao atualizar membro:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/team — remover membro
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'memberId é obrigatório' }, { status: 400 })
    }

    const result = await removeTeamMember(user.id, memberId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao remover membro:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
