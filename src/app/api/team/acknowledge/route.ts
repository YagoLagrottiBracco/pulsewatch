import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { acknowledgeAlert, getAlertAcknowledgments } from '@/services/team'

// POST /api/team/acknowledge — reconhecer alerta
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { alertId, note } = await request.json()

    if (!alertId) {
      return NextResponse.json({ error: 'alertId é obrigatório' }, { status: 400 })
    }

    const result = await acknowledgeAlert(alertId, user.id, note)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao reconhecer alerta:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/team/acknowledge?alertId=xxx — listar reconhecimentos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('alertId')

    if (!alertId) {
      return NextResponse.json({ error: 'alertId é obrigatório' }, { status: 400 })
    }

    const acknowledgments = await getAlertAcknowledgments(alertId)
    return NextResponse.json({ acknowledgments })
  } catch (error) {
    console.error('Erro ao listar reconhecimentos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
