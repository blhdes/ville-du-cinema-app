import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  FollowedUser,
  AddUserRequest,
  UpdateUserRequest,
  DeleteUserRequest,
} from '@/types/database'

// GET - Fetch user's followed list
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
    .select('followed_users')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (new user)
    console.error('Error fetching lists:', error)
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
  }

  return NextResponse.json({
    followed_users: (data?.followed_users as FollowedUser[]) || [],
  })
}

// POST - Add a user to the followed list
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: AddUserRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { username, display_name } = body

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const normalizedUsername = username.toLowerCase().trim()

  // Validate username exists on Letterboxd
  try {
    const validateResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/validate-user?username=${normalizedUsername}`
    )
    const validateData = await validateResponse.json()

    if (!validateData.exists) {
      return NextResponse.json(
        { error: `User ${normalizedUsername} not found on Letterboxd` },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate username' },
      { status: 500 }
    )
  }

  // Get current followed_users
  const { data: existingData } = await supabase
    .from('user_data')
    .select('followed_users')
    .eq('user_id', user.id)
    .single()

  const currentList = (existingData?.followed_users as FollowedUser[]) || []

  // Check for duplicates
  if (currentList.some((u) => u.username === normalizedUsername)) {
    return NextResponse.json(
      { error: `User ${normalizedUsername} is already in your list` },
      { status: 409 }
    )
  }

  // Create new followed user
  const newUser: FollowedUser = {
    username: normalizedUsername,
    ...(display_name && { display_name }),
    added_at: new Date().toISOString(),
  }

  const updatedList = [...currentList, newUser]

  // Upsert user_data
  const { error: upsertError } = await supabase.from('user_data').upsert(
    {
      user_id: user.id,
      followed_users: updatedList,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (upsertError) {
    console.error('Error adding user:', upsertError)
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 })
  }

  return NextResponse.json({ user: newUser }, { status: 201 })
}

// DELETE - Remove a user from the followed list
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: DeleteUserRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { username } = body

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const normalizedUsername = username.toLowerCase().trim()

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

  // Check if username exists in list
  const userIndex = currentList.findIndex(
    (u) => u.username === normalizedUsername
  )

  if (userIndex === -1) {
    return NextResponse.json(
      { error: `User ${normalizedUsername} not found in your list` },
      { status: 404 }
    )
  }

  // Remove user from list
  const updatedList = currentList.filter(
    (u) => u.username !== normalizedUsername
  )

  const { error: updateError } = await supabase
    .from('user_data')
    .update({
      followed_users: updatedList,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error removing user:', updateError)
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// PATCH - Update a user's display_name
export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: UpdateUserRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { username, display_name } = body

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const normalizedUsername = username.toLowerCase().trim()

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

  // Find user in list
  const userIndex = currentList.findIndex(
    (u) => u.username === normalizedUsername
  )

  if (userIndex === -1) {
    return NextResponse.json(
      { error: `User ${normalizedUsername} not found in your list` },
      { status: 404 }
    )
  }

  // Update user
  const updatedUser: FollowedUser = {
    ...currentList[userIndex],
    display_name: display_name || undefined,
  }

  // Remove display_name if empty
  if (!display_name) {
    delete updatedUser.display_name
  }

  const updatedList = [...currentList]
  updatedList[userIndex] = updatedUser

  const { error: updateError } = await supabase
    .from('user_data')
    .update({
      followed_users: updatedList,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error updating user:', updateError)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }

  return NextResponse.json({ user: updatedUser })
}
