import { NextRequest, NextResponse } from 'next/server'
import { sendReengagementEmails } from '@/services/reengagement'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendReengagementEmails()

  return NextResponse.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  })
}
