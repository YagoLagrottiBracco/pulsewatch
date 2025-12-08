export interface TelegramMessage {
  chatId: string
  message: string
  parseMode?: 'HTML' | 'Markdown'
}

export interface TelegramAlertData {
  storeName: string
  alertType: string
  message: string
  timestamp: string
}

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

// Enviar mensagem no Telegram
export async function sendTelegramMessage({
  chatId,
  message,
  parseMode = 'HTML',
}: TelegramMessage): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN não configurado')
      return false
    }

    const url = `${TELEGRAM_API_BASE}${botToken}/sendMessage`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('Erro ao enviar mensagem Telegram:', data)
      return false
    }

    console.log('Mensagem Telegram enviada com sucesso')
    return true
  } catch (error) {
    console.error('Erro ao enviar mensagem Telegram:', error)
    return false
  }
}

// Formatar mensagem de alerta
export function formatTelegramAlert(data: TelegramAlertData): string {
  const emoji = getAlertEmoji(data.alertType)
  const timestamp = new Date(data.timestamp).toLocaleString('pt-BR')

  return `
${emoji} <b>ALERTA PULSEWATCH</b>

🏪 <b>Loja:</b> ${data.storeName}
📋 <b>Tipo:</b> ${data.alertType}

💬 <b>Mensagem:</b>
${data.message}

🕒 <b>Horário:</b> ${timestamp}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Ver no Dashboard</a>
  `.trim()
}

// Obter emoji baseado no tipo de alerta
function getAlertEmoji(alertType: string): string {
  const emojiMap: Record<string, string> = {
    'LOJA_OFFLINE': '🔴',
    'ESTOQUE_BAIXO': '⚠️',
    'PRODUTO_ESGOTADO': '❌',
    'QUEDA_VENDAS': '📉',
    'NOVO_PEDIDO': '🛒',
    'ERRO_IMPORTACAO': '⚡',
    'LOJA_ONLINE': '✅',
  }

  return emojiMap[alertType] || '🔔'
}

// Enviar alerta via Telegram
export async function sendTelegramAlert(
  chatId: string,
  data: TelegramAlertData
): Promise<boolean> {
  const message = formatTelegramAlert(data)
  return sendTelegramMessage({ chatId, message })
}

// Verificar se bot está configurado
export async function verifyTelegramBot(): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return false

    const url = `${TELEGRAM_API_BASE}${botToken}/getMe`
    const response = await fetch(url)
    const data = await response.json()

    return data.ok
  } catch (error) {
    console.error('Erro ao verificar bot Telegram:', error)
    return false
  }
}

// Obter informações do bot
export async function getTelegramBotInfo(): Promise<any | null> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return null

    const url = `${TELEGRAM_API_BASE}${botToken}/getMe`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.ok) return null

    return data.result
  } catch (error) {
    console.error('Erro ao obter info do bot:', error)
    return null
  }
}

// Configurar webhook
export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return false

    const url = `${TELEGRAM_API_BASE}${botToken}/setWebhook`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      }),
    })

    const data = await response.json()
    return data.ok
  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
    return false
  }
}

// Deletar webhook
export async function deleteTelegramWebhook(): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return false

    const url = `${TELEGRAM_API_BASE}${botToken}/deleteWebhook`

    const response = await fetch(url, {
      method: 'POST',
    })

    const data = await response.json()
    return data.ok
  } catch (error) {
    console.error('Erro ao deletar webhook:', error)
    return false
  }
}
