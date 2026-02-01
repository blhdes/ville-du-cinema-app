import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { routing } from './i18n/routing'

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // Step 1: Run i18n middleware first
  const intlResponse = intlMiddleware(request)

  // Step 2: Update Supabase session only if env vars exist
  const hasSupabaseConfig =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!hasSupabaseConfig) {
    // Return early if Supabase is not configured
    return intlResponse
  }

  try {
    const { supabaseResponse } = await updateSession(request)

    // Merge the responses
    const response = intlResponse || supabaseResponse

    // Add Supabase cookies to the response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie)
    })

    return response
  } catch (error) {
    // If Supabase fails, continue with just i18n
    console.error('Supabase session update failed:', error)
    return intlResponse
  }
}

export const config = {
  matcher: ['/', '/(fr|en|es)/:path*', '/api/:path*'],
}
