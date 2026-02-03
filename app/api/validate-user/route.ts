import { NextResponse } from 'next/server'
import { validateLetterboxdUser } from '@/lib/letterboxd/validate'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json(
      { error: 'Username parameter is required' },
      { status: 400 }
    )
  }

  const result = await validateLetterboxdUser(username)

  return NextResponse.json(
    {
      exists: result.exists,
      username: username.trim().toLowerCase(),
      ...(result.error && { error: result.error }),
    },
    { status: 200 }
  )
}
