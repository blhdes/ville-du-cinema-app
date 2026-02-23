import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/types/database'

// GET - Fetch user's profile
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  // Return default profile if no data exists
  const profile: UserProfile = data
    ? {
        user_id: data.user_id,
        avatar_url: data.avatar_url,
        bio: data.bio ?? '',
        display_name: data.display_name,
        followed_users: data.followed_users ?? [],
        language: data.language ?? 'en',
        hide_userlist_main: data.hide_userlist_main ?? false,
        feed_grid_columns: (data.feed_grid_columns ?? 1) as 1 | 2 | 3,
        hide_watch_notifications: data.hide_watch_notifications ?? false,
        username: data.username ?? null,
        updated_at: data.updated_at,
      }
    : {
        user_id: user.id,
        avatar_url: null,
        bio: '',
        display_name: null,
        followed_users: [],
        language: 'en',
        hide_userlist_main: false,
        feed_grid_columns: 1,
        hide_watch_notifications: false,
        username: null,
        updated_at: new Date().toISOString(),
      }

  return NextResponse.json({ profile })
}

// PATCH - Update user's profile
export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    bio?: string
    display_name?: string
    avatar_url?: string
    username?: string
    hide_userlist_main?: boolean
    feed_grid_columns?: 1 | 2 | 3
    hide_watch_notifications?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { bio, display_name, avatar_url, username, hide_userlist_main, feed_grid_columns, hide_watch_notifications } = body

  // Validate bio length
  if (bio !== undefined && bio.length > 500) {
    return NextResponse.json(
      { error: 'Bio must be 500 characters or less' },
      { status: 400 }
    )
  }

  // Validate display_name length
  if (display_name !== undefined && display_name.length > 50) {
    return NextResponse.json(
      { error: 'Display name must be 50 characters or less' },
      { status: 400 }
    )
  }

  // Validate feed_grid_columns
  if (feed_grid_columns !== undefined && ![1, 2, 3].includes(feed_grid_columns)) {
    return NextResponse.json(
      { error: 'feed_grid_columns must be 1, 2, or 3' },
      { status: 400 }
    )
  }

  // Validate username
  if (username !== undefined) {
    const usernameRegex = /^[a-z][a-z0-9-]{2,29}$/
    const reserved = ['admin', 'settings', 'profile', 'login', 'signup', 'api', 'u', 'app', 'help', 'support', 'about']

    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      )
    }

    if (reserved.includes(username)) {
      return NextResponse.json(
        { error: 'Username is reserved' },
        { status: 400 }
      )
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }

  if (bio !== undefined) {
    updateData.bio = bio
  }

  if (display_name !== undefined) {
    updateData.display_name = display_name || null
  }

  if (avatar_url !== undefined) {
    updateData.avatar_url = avatar_url || null
  }

  if (hide_userlist_main !== undefined) {
    updateData.hide_userlist_main = hide_userlist_main
  }

  if (feed_grid_columns !== undefined) {
    updateData.feed_grid_columns = feed_grid_columns
  }

  if (hide_watch_notifications !== undefined) {
    updateData.hide_watch_notifications = hide_watch_notifications
  }

  if (username !== undefined) {
    updateData.username = username
  }

  const { data, error } = await supabase
    .from('user_data')
    .upsert(updateData, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    // Handle unique constraint violation for username
    if (error.code === '23505' && error.message?.includes('username')) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
    }
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  const profile: UserProfile = {
    user_id: data.user_id,
    avatar_url: data.avatar_url,
    bio: data.bio ?? '',
    display_name: data.display_name,
    followed_users: data.followed_users ?? [],
    language: data.language ?? 'en',
    hide_userlist_main: data.hide_userlist_main ?? false,
    feed_grid_columns: (data.feed_grid_columns ?? 1) as 1 | 2 | 3,
    hide_watch_notifications: data.hide_watch_notifications ?? false,
    username: data.username ?? null,
    updated_at: data.updated_at,
  }

  return NextResponse.json({ profile })
}
