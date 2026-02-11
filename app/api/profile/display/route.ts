import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH - Update display preferences only
export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    hide_userlist_main?: boolean
    feed_grid_columns?: 1 | 2 | 3
    hide_watch_notifications?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { hide_userlist_main, feed_grid_columns, hide_watch_notifications } = body

  // Validate feed_grid_columns
  if (feed_grid_columns !== undefined && ![1, 2, 3].includes(feed_grid_columns)) {
    return NextResponse.json(
      { error: 'feed_grid_columns must be 1, 2, or 3' },
      { status: 400 }
    )
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
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

  const { data, error } = await supabase
    .from('user_data')
    .upsert(updateData, { onConflict: 'user_id' })
    .select('hide_userlist_main, feed_grid_columns, hide_watch_notifications')
    .single()

  if (error) {
    console.error('Error updating display preferences:', error)
    return NextResponse.json({ error: 'Failed to update display preferences' }, { status: 500 })
  }

  return NextResponse.json({
    preferences: {
      hide_userlist_main: data.hide_userlist_main ?? false,
      feed_grid_columns: (data.feed_grid_columns ?? 1) as 1 | 2 | 3,
      hide_watch_notifications: data.hide_watch_notifications ?? false,
    },
  })
}
