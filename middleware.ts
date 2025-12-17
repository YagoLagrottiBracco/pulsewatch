import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedPaths = ['/dashboard', '/stores', '/products', '/alerts', '/settings', '/analytics', '/alert-rules', '/activity']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  const response = await updateSession(request)

  if (isProtectedPath) {
    // Check if user is authenticated
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Simple auth check via cookie
    const sessionCookie = request.cookies.get('sb-access-token')
    
    if (!sessionCookie) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
