import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateMonthlyUptime } from '@/services/uptime-sla'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await calculateMonthlyUptime(user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao calcular uptime/SLA:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
