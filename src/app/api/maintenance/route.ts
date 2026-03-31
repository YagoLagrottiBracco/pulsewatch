import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listMaintenanceWindows, createMaintenanceWindow, deleteMaintenanceWindow } from '@/services/maintenance'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const windows = await listMaintenanceWindows(user.id)
  return NextResponse.json({ windows })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.title || !body.startsAt || !body.endsAt) {
    return NextResponse.json({ error: 'title, startsAt e endsAt são obrigatórios' }, { status: 400 })
  }

  const result = await createMaintenanceWindow(user.id, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const windowId = searchParams.get('id')
  if (!windowId) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  const result = await deleteMaintenanceWindow(user.id, windowId)
  return NextResponse.json(result)
}
