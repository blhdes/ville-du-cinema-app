import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AVATAR_COUNT } from '@/constants/avatars'

interface UpdateAvatarRequest {
  avatar_index: number
}

// GET - Fetch user's avatar index
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
    .select('avatar_index')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching avatar:', error)
    return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 })
  }

  return NextResponse.json({
    avatar_index: data?.avatar_index ?? 0,
  })
}

// PATCH - Update user's avatar
export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: UpdateAvatarRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { avatar_index } = body

  if (typeof avatar_index !== 'number') {
    return NextResponse.json({ error: 'avatar_index is required' }, { status: 400 })
  }

  if (avatar_index < 0 || avatar_index >= AVATAR_COUNT) {
    return NextResponse.json(
      { error: `avatar_index must be between 0 and ${AVATAR_COUNT - 1}` },
      { status: 400 }
    )
  }

  // Upsert user_data with new avatar_index
  const { error: upsertError } = await supabase.from('user_data').upsert(
    {
      user_id: user.id,
      avatar_index,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (upsertError) {
    console.error('Error updating avatar:', upsertError)
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
  }

  return NextResponse.json({ avatar_index })
}
