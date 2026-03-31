import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/services/api-keys'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/v1/stores — Public API: list stores
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

  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, domain, platform, status, last_check, last_response_time_ms')
    .eq('user_id', auth.userId)
    .eq('is_active', true)

  return NextResponse.json({ stores: stores || [] })
}
