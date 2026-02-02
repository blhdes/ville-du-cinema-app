import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FollowedUser, ReorderRequest } from '@/types/database'

// PUT - Reorder the followed list
export async function PUT(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: ReorderRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { order } = body

  if (!order || !Array.isArray(order)) {
    return NextResponse.json(
      { error: 'Order must be an array of usernames' },
      { status: 400 }
    )
  }

  // Normalize usernames
  const normalizedOrder = order.map((u) => u.toLowerCase().trim())

  // Get current followed_users
  const { data: existingData, error: fetchError } = await supabase
    .from('user_data')
    .select('followed_users')
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existingData) {
    return NextResponse.json({ error: 'User data not found' }, { status: 404 })
  }

  const currentList = (existingData.followed_users as FollowedUser[]) || []

  // Validate that all usernames in order exist in the current list
  const currentUsernames = currentList.map((u) => u.username)
  const invalidUsernames = normalizedOrder.filter(
    (u) => !currentUsernames.includes(u)
  )

  if (invalidUsernames.length > 0) {
    return NextResponse.json(
      { error: `Unknown usernames: ${invalidUsernames.join(', ')}` },
      { status: 400 }
    )
  }

  // Create a map for quick lookup
  const userMap = new Map<string, FollowedUser>()
  currentList.forEach((u) => userMap.set(u.username, u))

  // Build reordered list
  const reorderedList: FollowedUser[] = []

  // First, add users in the specified order
  normalizedOrder.forEach((username) => {
    const user = userMap.get(username)
    if (user) {
      reorderedList.push(user)
      userMap.delete(username)
    }
  })

  // Then, add any remaining users that weren't in the order array
  // (preserving their relative order)
  userMap.forEach((user) => {
    reorderedList.push(user)
  })

  const { error: updateError } = await supabase
    .from('user_data')
    .update({
      followed_users: reorderedList,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error reordering list:', updateError)
    return NextResponse.json(
      { error: 'Failed to reorder list' },
      { status: 500 }
    )
  }

  return NextResponse.json({ followed_users: reorderedList })
}
