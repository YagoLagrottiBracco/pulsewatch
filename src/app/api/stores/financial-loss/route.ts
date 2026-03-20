import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/stores/financial-loss?store_id=X&period=30
 *
 * Retorna incidentes de downtime e totais agregados de perda financeira.
 * `period` = número de dias para trás (padrão: 30).
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const storeId = searchParams.get('store_id')
  const periodParam = searchParams.get('period') ?? '30'

  const since = new Date()
  if (periodParam === 'month') {
    since.setDate(1)
    since.setHours(0, 0, 0, 0)
  } else {
    const period = parseInt(periodParam, 10)
    since.setDate(since.getDate() - period)
  }

  // Buscar lojas do usuário para validar acesso via RLS
  let query = supabase
    .from('downtime_incidents')
    .select(`
      id,
      store_id,
      started_at,
      recovered_at,
      duration_minutes,
      revenue_per_hour,
      estimated_loss,
      created_at,
      stores ( name, domain )
    `)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: false })

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data: incidents, error } = await query

  if (error) {
    console.error('Erro ao buscar incidentes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const totalLoss = incidents?.reduce((sum, i) => sum + Number(i.estimated_loss), 0) ?? 0
  const totalMinutes = incidents?.reduce((sum, i) => sum + i.duration_minutes, 0) ?? 0

  return NextResponse.json({
    period_days: periodParam === 'month' ? null : parseInt(periodParam, 10),
    incidents: incidents ?? [],
    summary: {
      total_incidents: incidents?.length ?? 0,
      total_downtime_minutes: totalMinutes,
      total_estimated_loss: totalLoss,
    },
  })
}

/**
 * PATCH /api/stores/financial-loss
 *
 * Configura a receita por hora de uma loja.
 * Body: { store_id: string, revenue_per_hour: number }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { store_id, revenue_per_hour } = body

  if (!store_id || revenue_per_hour == null || revenue_per_hour < 0) {
    return NextResponse.json({ error: 'store_id e revenue_per_hour são obrigatórios' }, { status: 400 })
  }

  const { error } = await supabase
    .from('stores')
    .update({ revenue_per_hour })
    .eq('id', store_id)
    .eq('user_id', user.id) // garante que o usuário é dono da loja

  if (error) {
    console.error('Erro ao atualizar revenue_per_hour:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
