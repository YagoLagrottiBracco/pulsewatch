import { NextRequest, NextResponse } from 'next/server'
import { sendWeeklyReports } from '@/services/weekly-report'

// Vercel Cron: toda segunda-feira às 8h (horário de Brasília = 11h UTC)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sendWeeklyReports()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro no cron de relatório semanal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
