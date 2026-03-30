import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

export async function GET(request: NextRequest) {
  // Proteção básica
  const secret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = request.nextUrl.searchParams.get('userId')
  const report: Record<string, any> = {}

  // 1. Verifica variáveis de ambiente
  report.env = {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.slice(0, 6)}...` : 'AUSENTE',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'presente' : 'AUSENTE',
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || 'AUSENTE',
  }

  // 2. Verifica credenciais Twilio
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch()
    report.twilio_account = { status: account.status, friendly_name: account.friendlyName }
  } catch (e: any) {
    report.twilio_account = { error: e.message }
  }

  // 3. Verifica perfil do usuário (se userId informado)
  if (userId) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, whatsapp_number, whatsapp_notifications, subscription_tier')
      .eq('user_id', userId)
      .single()

    report.profile = profile || 'não encontrado'

    if (profile) {
      report.whatsapp_would_send =
        !!profile.whatsapp_notifications &&
        !!profile.whatsapp_number &&
        profile.subscription_tier === 'ultimate'

      report.whatsapp_blocked_reason = !profile.whatsapp_notifications
        ? 'whatsapp_notifications está desativado'
        : !profile.whatsapp_number
        ? 'whatsapp_number não preenchido'
        : profile.subscription_tier !== 'ultimate'
        ? `subscription_tier é "${profile.subscription_tier}", precisa ser "ultimate"`
        : null
    }

    // 4. Tenta enviar mensagem de teste (se tiver número)
    if (profile?.whatsapp_number) {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
        const from = process.env.TWILIO_WHATSAPP_NUMBER!
        const formattedFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`
        const formattedTo = profile.whatsapp_number.startsWith('whatsapp:')
          ? profile.whatsapp_number
          : `whatsapp:${profile.whatsapp_number}`

        const msg = await client.messages.create({
          from: formattedFrom,
          to: formattedTo,
          body: '🧪 PulseWatch — teste de diagnóstico WhatsApp funcionando!',
        })

        report.test_message = { sid: msg.sid, status: msg.status, to: formattedTo }
      } catch (e: any) {
        report.test_message = { error: e.message, code: e.code }
      }
    }
  }

  return NextResponse.json(report, { status: 200 })
}
