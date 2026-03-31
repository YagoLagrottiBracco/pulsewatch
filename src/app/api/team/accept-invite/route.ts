import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { acceptInvite } from '@/services/team'

// POST /api/team/accept-invite — aceitar convite
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
    }

    const result = await acceptInvite(token, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao aceitar convite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
