import nodemailer from 'nodemailer'

export interface EmailConfig {
  to: string
  subject: string
  html: string
}

export interface EmailAlertData {
  storeName: string
  alertType: string
  message: string
  timestamp: string
}

// Criar transporter SMTP do Supabase
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.supabase.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
  })
}

// Enviar email genérico
export async function sendEmail({ to, subject, html }: EmailConfig): Promise<boolean> {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'PulseWatch'} <${process.env.SMTP_FROM_EMAIL || 'noreply@pulsewatch.com'}>`,
      to,
      subject,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email enviado:', info.messageId)
    return true
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return false
  }
}

// Template de alerta
export function generateAlertEmailHTML(data: EmailAlertData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta PulseWatch</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .alert-type { font-weight: bold; color: #92400e; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
    .alert-message { color: #78350f; margin-top: 10px; line-height: 1.6; }
    .store-info { background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .timestamp { color: #6b7280; font-size: 14px; margin-top: 20px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 PulseWatch Alert</h1>
    </div>
    <div class="content">
      <div class="store-info">
        <strong>Loja:</strong> ${data.storeName}
      </div>
      
      <div class="alert-box">
        <div class="alert-type">${data.alertType}</div>
        <div class="alert-message">${data.message}</div>
      </div>
      
      <div class="timestamp">
        <strong>Horário:</strong> ${new Date(data.timestamp).toLocaleString('pt-BR')}
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Acessar Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>Você está recebendo este email porque ativou alertas no PulseWatch</p>
      <p>© ${new Date().getFullYear()} PulseWatch - Monitoramento de E-commerce</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Enviar alerta por email
export async function sendEmailAlert(to: string, data: EmailAlertData): Promise<boolean> {
  const subject = `🔔 Alerta: ${data.alertType} - ${data.storeName}`
  const html = generateAlertEmailHTML(data)

  return sendEmail({ to, subject, html })
}

// Email de boas-vindas
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const subject = 'Bem-vindo ao PulseWatch! 🎉'
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao PulseWatch</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; line-height: 1.6; color: #374151; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .features { margin: 30px 0; }
    .feature { margin: 15px 0; padding-left: 30px; position: relative; }
    .feature:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 20px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Bem-vindo ao PulseWatch!</h1>
    </div>
    <div class="content">
      <h2>Olá, ${name}!</h2>
      <p>Estamos felizes em ter você conosco. O PulseWatch vai ajudar você a monitorar sua loja de e-commerce 24/7.</p>
      
      <div class="features">
        <div class="feature">Monitoramento em tempo real da sua loja</div>
        <div class="feature">Alertas instantâneos via Email e Telegram</div>
        <div class="feature">Detecção automática de plataforma (Shopify, WooCommerce, Nuvemshop)</div>
        <div class="feature">Dashboard completo com métricas e histórico</div>
      </div>
      
      <p><strong>Próximos passos:</strong></p>
      <ol>
        <li>Adicione sua primeira loja</li>
        <li>Configure suas preferências de alerta</li>
        <li>Conecte seu Telegram (opcional)</li>
      </ol>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Acessar Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PulseWatch - Monitoramento de E-commerce</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return sendEmail({ to, subject, html })
}
