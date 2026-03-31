import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listWebhooks, createWebhook, deleteWebhook, getWebhookDeliveries } from '@/services/webhooks'

const WEBHOOK_TIERS = ['business', 'agency']

async function requireWebhookTier() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single()

  if (!profile || !WEBHOOK_TIERS.includes(profile.subscription_tier)) {
    return { error: NextResponse.json({ error: 'Recurso disponível apenas para Business e Agency' }, { status: 403 }) }
  }

  return { user }
}

export async function GET(request: NextRequest) {
  const auth = await requireWebhookTier()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const webhookId = searchParams.get('deliveries')

  if (webhookId) {
    const deliveries = await getWebhookDeliveries(auth.user!.id, webhookId)
    return NextResponse.json({ deliveries })
  }

  const webhooks = await listWebhooks(auth.user!.id)
  return NextResponse.json({ webhooks })
}

export async function POST(request: NextRequest) {
  const auth = await requireWebhookTier()
  if (auth.error) return auth.error

  const body = await request.json()
  if (!body.name || !body.url) {
    return NextResponse.json({ error: 'name e url são obrigatórios' }, { status: 400 })
  }

  const result = await createWebhook(auth.user!.id, body)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ webhook: result.webhook })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireWebhookTier()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const webhookId = searchParams.get('id')
  if (!webhookId) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  const result = await deleteWebhook(auth.user!.id, webhookId)
  return NextResponse.json(result)
}
