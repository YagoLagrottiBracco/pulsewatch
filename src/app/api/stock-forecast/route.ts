import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStockForecast } from '@/services/stock-forecast'
import { captureError } from '@/lib/sentry'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Gate: business+ apenas
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['business', 'agency'].includes(profile.subscription_tier)) {
      return NextResponse.json(
        { error: 'Recurso disponível apenas para planos Business e Agency' },
        { status: 403 }
      )
    }

    const result = await generateStockForecast(user.id)

    return NextResponse.json(result)
  } catch (error) {
    captureError(error, { module: 'api/stock-forecast' })
    console.error('Erro ao gerar previsão de estoque:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
