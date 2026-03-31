import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './email'

export interface NpsSurvey {
  id: string
  userId: string
  score: number
  feedback: string | null
  triggerType: string
  createdAt: string
}

export interface NpsStats {
  totalResponses: number
  averageScore: number
  promoters: number
  passives: number
  detractors: number
  npsScore: number
}

export function calculateNpsStats(surveys: NpsSurvey[]): NpsStats {
  if (surveys.length === 0) {
    return { totalResponses: 0, averageScore: 0, promoters: 0, passives: 0, detractors: 0, npsScore: 0 }
  }

  const promoters = surveys.filter(s => s.score >= 9).length
  const passives = surveys.filter(s => s.score >= 7 && s.score <= 8).length
  const detractors = surveys.filter(s => s.score <= 6).length
  const total = surveys.length

  return {
    totalResponses: total,
    averageScore: Math.round((surveys.reduce((sum, s) => sum + s.score, 0) / total) * 10) / 10,
    promoters,
    passives,
    detractors,
    npsScore: Math.round(((promoters - detractors) / total) * 100),
  }
}

export function generateNpsEmailHTML(name: string | null): string {
  const greeting = name ? `Olá, ${name}!` : 'Olá!'

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Como estamos indo?</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; line-height: 1.6; color: #374151; text-align: center; }
    .nps-scale { display: flex; justify-content: center; gap: 6px; margin: 20px 0; flex-wrap: wrap; }
    .nps-btn { display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; border-radius: 8px; text-decoration: none; font-weight: bold; color: white; }
    .detractor { background-color: #ef4444; }
    .passive { background-color: #f59e0b; }
    .promoter { background-color: #10b981; }
    .scale-labels { display: flex; justify-content: space-between; margin: 0 10px; color: #6b7280; font-size: 12px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Como estamos indo?</h1>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>Faz 30 dias que voce usa o PulseWatch. Adorariamos saber sua opiniao!</p>
      <p><strong>De 0 a 10, qual a probabilidade de voce recomendar o PulseWatch?</strong></p>

      <div class="nps-scale">
        ${Array.from({ length: 11 }, (_, i) => {
          const cls = i <= 6 ? 'detractor' : i <= 8 ? 'passive' : 'promoter'
          return `<a href="${process.env.NEXT_PUBLIC_APP_URL}/api/nps/respond?score=${i}" class="nps-btn ${cls}">${i}</a>`
        }).join('\n        ')}
      </div>

      <div class="scale-labels">
        <span>Nada provavel</span>
        <span>Muito provavel</span>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} PulseWatch - Monitoramento de E-commerce</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendNpsSurveys(): Promise<{ sent: number; errors: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Users who subscribed ~30 days ago and haven't received NPS
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('user_id, email, full_name, subscription_tier, created_at')
    .neq('subscription_tier', 'free')
    .lt('created_at', thirtyDaysAgo.toISOString())
    .is('nps_sent_at', null)
    .eq('nps_completed', false)

  if (error) {
    console.error('Erro ao buscar usuarios para NPS:', error)
    return { sent: 0, errors: 0 }
  }

  let sent = 0
  let errors = 0

  for (const user of users || []) {
    const html = generateNpsEmailHTML(user.full_name)
    const success = await sendEmail({
      to: user.email,
      subject: 'Como estamos indo? Avalie o PulseWatch',
      html,
    })

    if (success) {
      await supabase
        .from('user_profiles')
        .update({ nps_sent_at: new Date().toISOString() })
        .eq('user_id', user.user_id)
      sent++
    } else {
      errors++
    }
  }

  return { sent, errors }
}
