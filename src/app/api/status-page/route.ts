import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// GET /api/status-page?slug=xxx — public status page data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: config } = await supabase
    .from('status_page_config')
    .select('*, status_page_stores(store_id, display_name, sort_order)')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!config) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const storeEntries = config.status_page_stores || []
  const storeIds = storeEntries.map((s: any) => s.store_id)

  let stores: any[] = []
  if (storeIds.length > 0) {
    const { data } = await supabase
      .from('stores')
      .select('id, name, status, last_check, last_response_time_ms')
      .in('id', storeIds)

    stores = (data || []).map(s => {
      const entry = storeEntries.find((e: any) => e.store_id === s.id)
      return { ...s, displayName: entry?.display_name || s.name, sortOrder: entry?.sort_order || 0 }
    }).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
  }

  // Recent incidents (last 7 days)
  let incidents: any[] = []
  if (storeIds.length > 0 && config.show_incidents) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data } = await supabase
      .from('alerts')
      .select('id, type, severity, title, message, created_at, stores(name)')
      .in('store_id', storeIds)
      .in('severity', ['high', 'critical'])
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)
    incidents = data || []
  }

  return NextResponse.json({
    title: config.title,
    description: config.description,
    stores,
    incidents,
    customCss: config.custom_css,
  })
}

// POST /api/status-page — create/update config (pro+)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['pro', 'business', 'agency'].includes(profile.subscription_tier)) {
    return NextResponse.json({ error: 'Recurso disponível para Pro+' }, { status: 403 })
  }

  const body = await request.json()

  const { data: existing } = await serviceClient
    .from('status_page_config')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await serviceClient.from('status_page_config').update({
      slug: body.slug, title: body.title, description: body.description,
      is_public: body.isPublic !== false, show_incidents: body.showIncidents !== false,
      custom_css: body.customCss || null, updated_at: new Date().toISOString(),
    }).eq('id', existing.id)

    // Update stores
    if (body.storeIds) {
      await serviceClient.from('status_page_stores').delete().eq('status_page_id', existing.id)
      if (body.storeIds.length > 0) {
        await serviceClient.from('status_page_stores').insert(
          body.storeIds.map((sid: string, i: number) => ({
            status_page_id: existing.id, store_id: sid, sort_order: i,
          }))
        )
      }
    }
  } else {
    const { data: created } = await serviceClient.from('status_page_config').insert({
      user_id: user.id, slug: body.slug, title: body.title || 'Status',
      description: body.description, is_public: true,
    }).select().single()

    if (created && body.storeIds?.length > 0) {
      await serviceClient.from('status_page_stores').insert(
        body.storeIds.map((sid: string, i: number) => ({
          status_page_id: created.id, store_id: sid, sort_order: i,
        }))
      )
    }
  }

  return NextResponse.json({ success: true })
}
