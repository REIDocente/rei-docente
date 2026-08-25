import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const isOnboarding = req.nextUrl.pathname.startsWith('/onboarding')
  const isAuth = req.nextUrl.pathname.startsWith('/login') ||
                 req.nextUrl.pathname.startsWith('/register')

  // Support local mock development sandbox
  const isMockAuth = req.cookies.get('use_mock_auth')?.value === 'true'
  if (isMockAuth) {
    if (isOnboarding || isAuth) {
      return res
    }
    const isCompleted = req.cookies.get('perfil_completado')?.value === 'true'
    if (!isCompleted) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
    return res
  }

  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && !isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && !isOnboarding && !isAuth) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('perfil_completado')
      .eq('id', session.user.id)
      .single()

    if (profile && !profile.perfil_completado) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-rei.png).*)'],
}
