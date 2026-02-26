import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PublicProfile } from '@/types/database'

// GET - Fetch public profile by username (no auth required)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.toLowerCase()

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Select ONLY public columns
  const { data, error } = await supabase
    .from('user_data')
    .select('username, display_name, avatar_url, bio, followed_users')
    .eq('username', username)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const profile: PublicProfile = {
    username: data.username,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    bio: data.bio ?? '',
    followed_users: data.followed_users ?? [],
  }

  return NextResponse.json({ profile })
}
