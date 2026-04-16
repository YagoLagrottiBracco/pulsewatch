import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { captureError } from '@/lib/sentry'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: salva o username e remove webhook para liberar getUpdates
export async function POST(request: NextRequest) {
  try {
    const { userId, username } = await request.json()

    if (!userId || !username) {
      return NextResponse.json({ error: 'userId e username são obrigatórios' }, { status: 400 })
    }

    const cleanUsername = username.replace(/^@/, '').toLowerCase()

    // Salva username e limpa conexão anterior (best-effort — ignora erro de coluna inexistente)
    try {
      await supabase
        .from('user_profiles')
        .update({
          telegram_username: cleanUsername,
          telegram_chat_id: null,
          telegram_notifications: false,
        })
        .eq('user_id', userId)
    } catch {
      // Coluna telegram_username pode não existir ainda — tenta só limpar o chat_id
      await supabase
        .from('user_profiles')
        .update({ telegram_chat_id: null, telegram_notifications: false })
        .eq('user_id', userId)
    }

    // Remove webhook para que getUpdates funcione
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, { method: 'POST' })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    captureError(error, { module: 'api/telegram/connect' })
    console.error('Erro ao salvar username Telegram:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET: faz polling no getUpdates e tenta encontrar mensagem do username informado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const username = searchParams.get('username')

    if (!userId || !username) {
      return NextResponse.json({ error: 'userId e username são obrigatórios' }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ error: 'Bot não configurado' }, { status: 500 })
    }

    // Verifica se já está conectado no banco
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('telegram_chat_id')
      .eq('user_id', userId)
      .single()

    if (profile?.telegram_chat_id) {
      return NextResponse.json({ connected: true })
    }

    // Busca os últimos 100 updates do Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=100`
    )
    const data = await response.json()

    if (!data.ok || !data.result?.length) {
      return NextResponse.json({ connected: false })
    }

    // Procura mensagem do username informado
    const pendingUsername = username.replace(/^@/, '').toLowerCase()
    const match = data.result.find((update: any) => {
      const from = update.message?.from
      return from?.username?.toLowerCase() === pendingUsername
    })

    if (!match) {
      return NextResponse.json({ connected: false })
    }

    const chatId = String(match.message.chat.id)

    // Salva o chat_id e ativa notificações
    await supabase
      .from('user_profiles')
      .update({
        telegram_chat_id: chatId,
        telegram_notifications: true,
      })
      .eq('user_id', userId)

    // Mensagem de boas-vindas
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ <b>Telegram conectado com sucesso!</b>\n\nVocê agora receberá alertas do PulseWatch aqui. 🔔`,
        parse_mode: 'HTML',
      }),
    })

    return NextResponse.json({ connected: true, chatId })
  } catch (error) {
    captureError(error, { module: 'api/telegram/connect' })
    console.error('Erro ao verificar conexão Telegram:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
