import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/sentry'

const ADVANCED_MONITORING_TIERS = ['pro', 'business', 'agency']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { storeId, speedThresholdMs, checkoutMonitorEnabled } = body

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
    }

    // Verify store belongs to user
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Verify user is pro+
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    const tier = profile?.subscription_tier || 'free'

    if (!ADVANCED_MONITORING_TIERS.includes(tier)) {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
    }

    // Validate speedThresholdMs: must be between 1000 and 10000
    const updateData: Record<string, any> = {}

    if (speedThresholdMs !== undefined) {
      const threshold = Number(speedThresholdMs)
      if (isNaN(threshold) || threshold < 1000 || threshold > 10000) {
        return NextResponse.json({ error: 'speedThresholdMs must be between 1000 and 10000' }, { status: 400 })
      }
      updateData.speed_threshold_ms = threshold
    }

    if (checkoutMonitorEnabled !== undefined) {
      updateData.checkout_monitor_enabled = Boolean(checkoutMonitorEnabled)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', storeId)

    if (updateError) {
      console.error('Error updating monitor settings:', updateError)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: updateData })
  } catch (error) {
    captureError(error, { module: 'api/stores/update-monitors' })
    console.error('Error in update-monitors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
