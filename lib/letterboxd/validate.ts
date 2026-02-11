/**
 * Validate that a Letterboxd username exists by checking their RSS feed
 */
export async function validateLetterboxdUser(
  username: string
): Promise<{ exists: boolean; error?: string }> {
  const normalizedUsername = username.trim().toLowerCase()

  if (!normalizedUsername) {
    return { exists: false, error: 'Username is required' }
  }

  try {
    const response = await fetch(
      `https://letterboxd.com/${normalizedUsername}/rss/`,
      {
        method: 'HEAD',
        // Add timeout to avoid hanging requests
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      return {
        exists: false,
        error: response.status === 404 ? 'User not found' : 'Failed to validate user',
      }
    }

    return { exists: true }
  } catch (error) {
    console.error('Letterboxd validation error:', error)
    return {
      exists: false,
      error: 'Failed to validate user',
    }
  }
}
