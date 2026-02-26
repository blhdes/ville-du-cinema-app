import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const locale = searchParams.get('locale') || 'fr'

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        // Redirect to home with the correct locale
        return NextResponse.redirect(`${origin}/${locale}`)
      }
    } catch {
      // Fall through to error redirect
    }
  }

  // Redirect to login on error
  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`)
}
