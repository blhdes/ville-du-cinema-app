import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { routing } from './i18n/routing'

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is an API route - skip i18n middleware for API routes
  const isApiRoute = pathname.startsWith('/api')

  // Step 1: Run i18n middleware only for non-API routes
  let response: Response | NextResponse | null = null

  if (!isApiRoute) {
    response = intlMiddleware(request)
  }

  // Step 2: Update Supabase session only if env vars exist
  const hasSupabaseConfig =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!hasSupabaseConfig) {
    // Return early if Supabase is not configured
    return response || NextResponse.next()
  }

  try {
    const { supabaseResponse } = await updateSession(request)

    // For API routes, just return the Supabase response (pass through)
    if (isApiRoute) {
      return supabaseResponse
    }

    // For non-API routes, merge i18n response with Supabase cookies
    // Use supabaseResponse as base and copy Supabase cookies to intl response
    if (response) {
      // Copy Supabase cookies to the intl response
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.headers.append('Set-Cookie', `${cookie.name}=${cookie.value}`)
      })
      return response
    }

    return supabaseResponse
  } catch (error) {
    // If Supabase fails, continue with just i18n response (or next)
    console.error('Supabase session update failed:', error)
    return response || NextResponse.next()
  }
}

export const config = {
  matcher: ['/', '/(fr|en|es)/:path*', '/api/:path*'],
}
