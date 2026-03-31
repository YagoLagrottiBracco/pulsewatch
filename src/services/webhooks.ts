/**
 * Serviço de webhooks outgoing.
 *
 * Dispara webhooks para ferramentas externas (n8n, Zapier, Make)
 * quando eventos ocorrem no PulseWatch.
 * Gate: business+
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export type WebhookEvent = 'alert.created' | 'store.status_changed' | 'store.speed_alert' | 'checkout.offline'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Dispara webhooks para um evento específico de um usuário.
 */
export async function triggerWebhooks(userId: string, event: WebhookEvent, data: Record<string, unknown>) {
  const supabase = getSupabase()

  // Buscar webhooks ativos do usuário que escutam este evento
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [event])

  if (!webhooks || webhooks.length === 0) return

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  const promises = webhooks.map(webhook => deliverWebhook(supabase, webhook, payload))
  await Promise.allSettled(promises)
}

async function deliverWebhook(supabase: any, webhook: any, payload: WebhookPayload) {
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'PulseWatch-Webhook/1.0',
  }

  // Assinar payload com secret (HMAC-SHA256)
  if (webhook.secret) {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex')
    headers['X-PulseWatch-Signature'] = `sha256=${signature}`
  }

  let statusCode: number | null = null
  let responseBody = ''
  let success = false

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    statusCode = response.status
    responseBody = await response.text().catch(() => '')
    success = response.ok
  } catch (error: any) {
    responseBody = error.message || 'Connection error'
  }

  // Registrar entrega
  await supabase.from('webhook_deliveries').insert({
    webhook_id: webhook.id,
    event: payload.event,
    payload,
    status_code: statusCode,
    response_body: responseBody.slice(0, 1000), // truncar
    success,
  })

  // Atualizar webhook com último status
  await supabase
    .from('webhooks')
    .update({
      last_triggered_at: new Date().toISOString(),
      last_status_code: statusCode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', webhook.id)
}

/**
 * CRUD de webhooks
 */
export async function listWebhooks(userId: string) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function createWebhook(userId: string, webhook: {
  name: string; url: string; secret?: string; events?: string[]
}) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      user_id: userId,
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret || null,
      events: webhook.events || ['alert.created', 'store.status_changed'],
    })
    .select()
    .single()

  return { success: !error, webhook: data, error: error?.message }
}

export async function deleteWebhook(userId: string, webhookId: string) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', webhookId)
    .eq('user_id', userId)
  return { success: !error }
}

export async function getWebhookDeliveries(userId: string, webhookId: string) {
  const supabase = getSupabase()

  // Verificar ownership
  const { data: webhook } = await supabase
    .from('webhooks')
    .select('id')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  if (!webhook) return []

  const { data } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('delivered_at', { ascending: false })
    .limit(20)

  return data || []
}
