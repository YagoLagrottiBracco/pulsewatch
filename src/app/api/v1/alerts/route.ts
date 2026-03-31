import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/services/api-keys'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/v1/alerts — Public API: list recent alerts
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required. Pass via X-API-Key header.' }, { status: 401 })
  }

  const auth = await validateApiKey(apiKey)
  if (!auth.valid || !auth.userId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const storeId = searchParams.get('store_id')

  // Buscar lojas do usuário
  const { data: stores } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', auth.userId)

  const storeIds = stores?.map(s => s.id) || []
  if (storeIds.length === 0) {
    return NextResponse.json({ alerts: [] })
  }

  let query = supabase
    .from('alerts')
    .select('id, store_id, type, severity, title, message, is_read, created_at, stores(name)')
    .in('store_id', storeIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (storeId && storeIds.includes(storeId)) {
    query = query.eq('store_id', storeId)
  }

  const { data: alerts } = await query

  return NextResponse.json({ alerts: alerts || [] })
}
