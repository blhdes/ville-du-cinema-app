import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const USERNAME_REGEX = /^[a-z][a-z0-9-]{2,29}$/
const RESERVED = ['admin', 'settings', 'profile', 'login', 'signup', 'api', 'u', 'app', 'help', 'support', 'about']

// GET - Check username availability
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.toLowerCase()

  if (!username) {
    return NextResponse.json({ available: false, error: 'Username is required' })
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ available: false, error: 'invalid' })
  }

  if (RESERVED.includes(username)) {
    return NextResponse.json({ available: false, error: 'reserved' })
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('user_data')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
