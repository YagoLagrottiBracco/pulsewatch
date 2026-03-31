import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './email'

export interface InactiveUser {
  userId: string
  email: string
  fullName: string | null
  lastActiveAt: string
  daysSinceActive: number
}

export async function findInactiveUsers(): Promise<InactiveUser[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('user_id, email, full_name, last_active_at, subscription_tier, reengagement_sent_at')
    .eq('subscription_tier', 'free')
    .lt('last_active_at', sevenDaysAgo.toISOString())
    .is('reengagement_sent_at', null)

  if (error) {
    console.error('Erro ao buscar inativos:', error)
    return []
  }

  return (users || []).map(u => ({
    userId: u.user_id,
    email: u.email,
    fullName: u.full_name,
    lastActiveAt: u.last_active_at,
    daysSinceActive: Math.floor(
      (Date.now() - new Date(u.last_active_at).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }))
}

export function generateReengagementEmailHTML(name: string | null, daysSinceActive: number): string {
  const greeting = name ? `Olá, ${name}!` : 'Olá!'

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sentimos sua falta!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; line-height: 1.6; color: #374151; }
    .highlight-box { background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .highlight-box h3 { margin: 0 0 10px; color: #92400e; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 36px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .features { margin: 20px 0; }
    .feature { margin: 10px 0; padding-left: 24px; position: relative; }
    .feature:before { content: "→"; position: absolute; left: 0; color: #667eea; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sentimos sua falta!</h1>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>Faz <strong>${daysSinceActive} dias</strong> que você não acessa o PulseWatch. Sua loja pode estar precisando de atenção!</p>

      <div class="highlight-box">
        <h3>Enquanto você esteve fora...</h3>
        <p>Suas lojas podem ter apresentado problemas que passaram despercebidos. Volte e confira o status!</p>
      </div>

      <p><strong>Você sabia?</strong> Usuários que monitoram suas lojas diariamente reduzem o tempo de inatividade em até 80%.</p>

      <div class="features">
        <div class="feature">Verifique o status das suas lojas em tempo real</div>
        <div class="feature">Configure alertas para nunca perder um problema</div>
        <div class="feature">Upgrade para Pro e desbloqueie monitoramento avançado</div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Voltar ao Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>Você está recebendo este email porque tem uma conta no PulseWatch</p>
      <p>&copy; ${new Date().getFullYear()} PulseWatch - Monitoramento de E-commerce</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendReengagementEmails(): Promise<{ sent: number; errors: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const inactiveUsers = await findInactiveUsers()
  let sent = 0
  let errors = 0

  for (const user of inactiveUsers) {
    const html = generateReengagementEmailHTML(user.fullName, user.daysSinceActive)
    const success = await sendEmail({
      to: user.email,
      subject: 'Sentimos sua falta no PulseWatch!',
      html,
    })

    if (success) {
      await supabase
        .from('user_profiles')
        .update({ reengagement_sent_at: new Date().toISOString() })
        .eq('user_id', user.userId)
      sent++
    } else {
      errors++
    }
  }

  return { sent, errors }
}
