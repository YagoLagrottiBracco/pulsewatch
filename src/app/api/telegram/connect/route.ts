import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: salva o username e limpa o chat_id antigo
export async function POST(request: NextRequest) {
  try {
    const { userId, username } = await request.json()

    if (!userId || !username) {
      return NextResponse.json({ error: 'userId e username são obrigatórios' }, { status: 400 })
    }

    const cleanUsername = username.replace(/^@/, '').toLowerCase()

    await supabase
      .from('user_profiles')
      .update({
        telegram_username: cleanUsername,
        telegram_chat_id: null,
        telegram_notifications: false,
      })
      .eq('user_id', userId)

    // Remove o webhook do Telegram (necessário para getUpdates funcionar)
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
        method: 'POST',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao salvar username Telegram:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET: faz polling no getUpdates do Telegram e tenta encontrar o username pendente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ error: 'Bot não configurado' }, { status: 500 })
    }

    // Busca o username pendente do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('telegram_username, telegram_chat_id')
      .eq('user_id', userId)
      .single()

    if (!profile?.telegram_username) {
      return NextResponse.json({ connected: false, reason: 'Nenhum username pendente' })
    }

    // Já está conectado
    if (profile.telegram_chat_id) {
      return NextResponse.json({ connected: true })
    }

    // Busca os últimos 100 updates do Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=100&allowed_updates=["message"]`
    )
    const data = await response.json()

    if (!data.ok || !data.result?.length) {
      return NextResponse.json({ connected: false })
    }

    // Procura por uma mensagem do username pendente
    const pendingUsername = profile.telegram_username.toLowerCase()
    const match = data.result.find((update: any) => {
      const from = update.message?.from
      return from?.username?.toLowerCase() === pendingUsername
    })

    if (!match) {
      return NextResponse.json({ connected: false })
    }

    const chatId = String(match.message.chat.id)

    // Salva o chat_id e ativa as notificações
    await supabase
      .from('user_profiles')
      .update({
        telegram_chat_id: chatId,
        telegram_notifications: true,
      })
      .eq('user_id', userId)

    // Envia mensagem de boas-vindas
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text:
          `✅ <b>Telegram conectado com sucesso!</b>\n\n` +
          `Você agora receberá alertas do PulseWatch aqui. 🔔`,
        parse_mode: 'HTML',
      }),
    })

    return NextResponse.json({ connected: true, chatId })
  } catch (error) {
    console.error('Erro ao verificar conexão Telegram:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
