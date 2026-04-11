import { createClient } from '@/lib/supabase/client'
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

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { type, message, rating } = body

  if (!type || !message) {
    return NextResponse.json({ error: 'Tipo e mensagem são obrigatórios' }, { status: 400 })
  }

  const validTypes = ['bug', 'suggestion', 'compliment', 'other']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  if (message.trim().length < 5) {
    return NextResponse.json({ error: 'Mensagem muito curta' }, { status: 400 })
  }

  const { error } = await supabase.from('user_feedback').insert({
    user_id: user.id,
    user_email: user.email,
    type,
    message: message.trim(),
    rating: rating || null,
  })

  if (error) {
    return NextResponse.json({ error: 'Erro ao enviar feedback' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
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

  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar feedbacks' }, { status: 500 })
  }

  return NextResponse.json({ feedbacks: data })
}
