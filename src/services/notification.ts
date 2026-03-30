import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { sendWhatsAppAlert, type WhatsAppAlertData } from './whatsapp'
import { sendSMSAlert, type SMSAlertData } from './sms'

interface NotificationData {
  userId: string
  storeId: string
  storeName: string
  alertType: string
  alertTitle: string
  alertMessage: string
}

export async function sendNotifications(data: NotificationData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar preferências do usuário
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', data.userId)
    .single()

  if (!profile) return

  const results = {
    email: false,
    telegram: false,
    whatsapp: false,
    sms: false,
  }

  // Enviar email se habilitado
  if (profile.email_notifications) {
    try {
      await sendEmailNotification(profile.email, data)
      results.email = true
    } catch (error) {
      console.error('Erro ao enviar email:', error)
    }
  }

  // Enviar telegram se habilitado (apenas Premium e Ultimate)
  if (profile.telegram_notifications && profile.telegram_chat_id && ['premium', 'ultimate'].includes(profile.subscription_tier)) {
    try {
      await sendTelegramNotification(profile.telegram_chat_id, data)
      results.telegram = true
    } catch (error) {
      console.error('Erro ao enviar telegram:', error)
    }
  }

  // Enviar WhatsApp se habilitado (apenas Ultimate)
  if (profile.whatsapp_notifications && profile.whatsapp_number && profile.subscription_tier === 'ultimate') {
    try {
      const whatsappData: WhatsAppAlertData = {
        storeName: data.storeName,
        alertType: data.alertType,
        alertTitle: data.alertTitle,
        message: data.alertMessage,
        timestamp: new Date().toISOString(),
      }
      await sendWhatsAppAlert(profile.whatsapp_number, whatsappData)
      results.whatsapp = true
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error)
    }
  }

  // Enviar SMS se habilitado (apenas Ultimate)
  if (profile.sms_notifications && profile.sms_number && profile.subscription_tier === 'ultimate') {
    try {
      const smsData: SMSAlertData = {
        storeName: data.storeName,
        alertType: data.alertType,
        alertTitle: data.alertTitle,
        message: data.alertMessage,
        timestamp: new Date().toISOString(),
      }
      await sendSMSAlert(profile.sms_number, smsData)
      results.sms = true
    } catch (error) {
      console.error('Erro ao enviar SMS:', error)
    }
  }

  return results
}

async function sendEmailNotification(email: string, data: NotificationData) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  const severityEmoji = {
    ESTOQUE_ZERADO: '🔴',
    ESTOQUE_BAIXO: '⚠️',
    ESTOQUE_DISPONIVEL: '✅',
    LOJA_OFFLINE: '❌',
    LOJA_ONLINE: '✅',
  }

  const emoji = severityEmoji[data.alertType as keyof typeof severityEmoji] || '🔔'

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: `${emoji} PulseWatch: ${data.alertTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} ${data.alertTitle}</h1>
            </div>
            <div class="content">
              <div class="alert">
                <h2>Loja: ${data.storeName}</h2>
                <p><strong>${data.alertMessage}</strong></p>
                <p>Este alerta foi gerado automaticamente pelo sistema de monitoramento PulseWatch.</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/alerts" class="button">Ver Todos os Alertas</a>
            </div>
            <div class="footer">
              <p>Você está recebendo este email porque habilitou notificações no PulseWatch.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Gerenciar Notificações</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

async function sendTelegramNotification(chatId: string, data: NotificationData) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return

  const severityEmoji = {
    ESTOQUE_ZERADO: '🔴',
    ESTOQUE_BAIXO: '⚠️',
    ESTOQUE_DISPONIVEL: '✅',
    LOJA_OFFLINE: '❌',
    LOJA_ONLINE: '✅',
  }

  const emoji = severityEmoji[data.alertType as keyof typeof severityEmoji] || '🔔'

  const message = `
${emoji} *${data.alertTitle}*

*Loja:* ${data.storeName}

${data.alertMessage}

🔗 [Ver no PulseWatch](${process.env.NEXT_PUBLIC_APP_URL}/alerts)
  `.trim()

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  })
}
