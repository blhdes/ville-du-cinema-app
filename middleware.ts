import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { routing } from './i18n/routing'

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // Step 1: Handle i18n with next-intl
  const intlResponse = intlMiddleware(request)

  // Step 2: Update Supabase session
  const { supabaseResponse, user } = await updateSession(request)

  // Step 3: Merge responses - combine i18n response with Supabase cookies
  const response = intlResponse || NextResponse.next()

  // Copy all cookies from Supabase response to the final response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie)
  })

  // Optional: Add user info to response headers for debugging
  // (only in development if needed)
  if (process.env.NODE_ENV === 'development' && user) {
    response.headers.set('x-user-id', user.id)
  }

  return response
}

export const config = {
  // Match internationalized pathnames and API routes
  matcher: [
    '/',
    '/(fr|en|es)/:path*',
    '/api/:path*'
  ]
}
