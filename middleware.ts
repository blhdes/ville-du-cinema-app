import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { routing } from './i18n/routing'

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect old locale-prefixed profile URLs → /u/username (301)
  const localeProfileMatch = pathname.match(/^\/(fr|en|es)\/u\/(.+)$/)
  if (localeProfileMatch) {
    const username = localeProfileMatch[2]
    const url = request.nextUrl.clone()
    url.pathname = `/u/${username}`
    return NextResponse.redirect(url, 301)
  }

  const isApiRoute = pathname.startsWith('/api')
  const isPublicProfile = pathname.startsWith('/u/')

  // Step 1: Run i18n middleware only for locale-prefixed routes (skip API and /u/ paths)
  let response: Response | NextResponse | null = null

  if (!isApiRoute && !isPublicProfile) {
    response = intlMiddleware(request)
  }

  // Step 2: Update Supabase session only if env vars exist
  const hasSupabaseConfig =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!hasSupabaseConfig) {
    return response || NextResponse.next()
  }

  try {
    const { supabaseResponse } = await updateSession(request)

    // For API routes, just return the Supabase response (pass through)
    if (isApiRoute) {
      return supabaseResponse
    }

    // For non-API routes, merge i18n response with Supabase cookies
    if (response) {
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.headers.append('Set-Cookie', `${cookie.name}=${cookie.value}`)
      })
      return response
    }

    return supabaseResponse
  } catch (error) {
    console.error('Supabase session update failed:', error)
    return response || NextResponse.next()
  }
}

export const config = {
  matcher: ['/', '/(fr|en|es)/:path*', '/api/:path*', '/u/:path*'],
}
