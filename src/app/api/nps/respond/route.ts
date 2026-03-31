import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public endpoint for NPS email responses (no auth required, uses token)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const score = parseInt(searchParams.get('score') || '-1')
  const token = searchParams.get('token')

  if (score < 0 || score > 10) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect to dashboard with NPS modal
  const redirectUrl = new URL('/dashboard', request.url)
  redirectUrl.searchParams.set('nps_score', score.toString())
  redirectUrl.searchParams.set('nps_feedback', 'true')

  return NextResponse.redirect(redirectUrl)
}
