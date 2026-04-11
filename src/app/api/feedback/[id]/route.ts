import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!adminData) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()
  const { status } = body

  const validStatuses = ['new', 'read', 'resolved']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_feedback')
    .update({ status })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar feedback' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
