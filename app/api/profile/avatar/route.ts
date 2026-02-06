import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

// POST - Upload avatar image
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('avatar') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: jpg, png, gif, webp' },
      { status: 400 }
    )
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size: 2MB' },
      { status: 400 }
    )
  }

  // Get file extension
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `avatar.${ext}`
  const filePath = `${user.id}/${fileName}`

  // Delete existing avatar if exists
  const { data: existingFiles } = await supabase.storage
    .from('avatars')
    .list(user.id)

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`)
    await supabase.storage.from('avatars').remove(filesToDelete)
  }

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath)

  // Update user_data with avatar_url
  const { error: updateError } = await supabase.from('user_data').upsert(
    {
      user_id: user.id,
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (updateError) {
    console.error('Error updating avatar_url:', updateError)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: publicUrl })
}

// DELETE - Remove avatar image
export async function DELETE() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // List and delete all files in user's folder
  const { data: existingFiles } = await supabase.storage
    .from('avatars')
    .list(user.id)

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`)
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove(filesToDelete)

    if (deleteError) {
      console.error('Error deleting avatar:', deleteError)
      return NextResponse.json({ error: 'Failed to delete avatar' }, { status: 500 })
    }
  }

  // Set avatar_url to null
  const { error: updateError } = await supabase.from('user_data').upsert(
    {
      user_id: user.id,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (updateError) {
    console.error('Error updating avatar_url:', updateError)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
