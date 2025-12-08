import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verificar secret (recomendado em produção)
    const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extrair dados da mensagem
    const message = body.message || body.edited_message
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text || ''

    // Processar comandos
    if (text.startsWith('/start')) {
      // Enviar mensagem de boas-vindas com o chat_id
      await sendTelegramMessage(
        chatId,
        `🎉 <b>Bem-vindo ao PulseWatch!</b>\n\n` +
        `Seu Chat ID é: <code>${chatId}</code>\n\n` +
        `Para configurar as notificações:\n` +
        `1. Copie o código acima\n` +
        `2. Acesse as Configurações no dashboard\n` +
        `3. Cole o Chat ID no campo indicado\n` +
        `4. Ative as notificações por Telegram\n\n` +
        `Você começará a receber alertas sobre suas lojas! 🔔`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro no webhook do Telegram:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN não configurado')
    return
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro ao enviar mensagem Telegram:', error)
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem Telegram:', error)
  }
}
