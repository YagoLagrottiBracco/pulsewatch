import { NextRequest, NextResponse } from 'next/server'
import { sendNpsSurveys } from '@/services/nps'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendNpsSurveys()

  return NextResponse.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  })
}
