import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { useProfile } from '@/hooks/useProfile'
import { useUser } from '@/hooks/useUser'
import type { UserProfile } from '@/types/database'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useUser')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUseUser = vi.mocked(useUser)

const MOCK_USER = { id: 'user-123', email: 'test@example.com' } as unknown as User

const BASE_PROFILE: UserProfile = {
  user_id: 'user-123',
  avatar_url: null,
  bio: '',
  display_name: null,
  followed_users: [],
  language: 'fr',
  hide_userlist_main: false,
  feed_grid_columns: 1,
  hide_watch_notifications: false,
  username: null,
  updated_at: '2024-01-01T00:00:00Z',
}

function makeUserReturn(user: User | null, isLoading = false) {
  return { user, isLoading, signOut: vi.fn() }
}

function makeFetchOk(body: object): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  }) as unknown as Promise<Response>
}

function makeFetchError(status: number, body: object = {}): Promise<Response> {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Promise<Response>
}

/**
 * Runs an async hook action inside act() and captures any thrown error
 * without causing the test to fail. Returns the error or null.
 */
async function catchFrom(fn: () => Promise<unknown>): Promise<Error | null> {
  let caught: Error | null = null
  await act(async () => {
    try {
      await fn()
    } catch (e) {
      caught = e as Error
    }
  })
  return caught
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: guest mode, no fetch responses set
  mockUseUser.mockReturnValue(makeUserReturn(null))
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// 1. fetchProfile — initial load
// ---------------------------------------------------------------------------

describe('fetchProfile', () => {
  it('does not fetch when there is no user (guest mode)', async () => {
    const { result } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.profile).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('remains in loading state while auth is still resolving', () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER, true))

    const { result } = renderHook(() => useProfile())

    // Effect returns early while isUserLoading; isLoading stays true
    expect(result.current.isLoading).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fetches /api/profile and sets profile on success', async () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
    vi.mocked(fetch).mockReturnValue(makeFetchOk({ profile: BASE_PROFILE }))

    const { result } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetch).toHaveBeenCalledWith('/api/profile')
    expect(result.current.profile).toEqual(BASE_PROFILE)
    expect(result.current.error).toBeNull()
  })

  it('sets error and null profile on 401 (session expired)', async () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
    vi.mocked(fetch).mockReturnValue(makeFetchError(401))

    const { result } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Session expired')
    expect(result.current.profile).toBeNull()
  })

  it('sets error and null profile on non-ok response', async () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
    vi.mocked(fetch).mockReturnValue(makeFetchError(500))

    const { result } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Failed to fetch profile')
    expect(result.current.profile).toBeNull()
  })

  it('sets error and null profile on network failure', async () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Network error')
    expect(result.current.profile).toBeNull()
  })

  it('clears profile when user logs out (user becomes null)', async () => {
    let userValue: User | null = MOCK_USER
    mockUseUser.mockImplementation(() => makeUserReturn(userValue))
    vi.mocked(fetch).mockReturnValue(makeFetchOk({ profile: BASE_PROFILE }))

    const { result, rerender } = renderHook(() => useProfile())

    await waitFor(() => expect(result.current.profile).toEqual(BASE_PROFILE))

    userValue = null
    rerender()

    await waitFor(() => expect(result.current.profile).toBeNull())
    expect(result.current.isLoading).toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('re-fetches when the user changes (e.g. switching accounts)', async () => {
    const USER_A = { id: 'user-a' } as unknown as User
    const USER_B = { id: 'user-b' } as unknown as User
    let userValue: User | null = USER_A
    mockUseUser.mockImplementation(() => makeUserReturn(userValue))
    vi.mocked(fetch).mockReturnValue(makeFetchOk({ profile: BASE_PROFILE }))

    const { result, rerender } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    userValue = USER_B
    rerender()

    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2))
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('/api/profile')
  })
})

// ---------------------------------------------------------------------------
// 2. updateProfile
// ---------------------------------------------------------------------------

describe('updateProfile', () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
  })

  it('sends PATCH to /api/profile with correct headers and body', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateProfile({ display_name: 'Alice', bio: 'Hello' })
    })

    const patchCall = vi.mocked(fetch).mock.calls[1]
    expect(patchCall[0]).toBe('/api/profile')
    expect(patchCall[1]?.method).toBe('PATCH')
    expect(patchCall[1]?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(patchCall[1]?.body as string)).toEqual({
      display_name: 'Alice',
      bio: 'Hello',
    })
  })

  it('updates profile state with the returned profile', async () => {
    const updatedProfile: UserProfile = { ...BASE_PROFILE, display_name: 'Alice' }
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchOk({ profile: updatedProfile }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateProfile({ display_name: 'Alice' })
    })

    expect(result.current.profile?.display_name).toBe('Alice')
    expect(result.current.error).toBeNull()
  })

  it('sets error on 401 and returns silently without throwing', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(401))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() => result.current.updateProfile({ bio: 'new bio' }))

    expect(thrown).toBeNull()
    expect(result.current.error).toBe('Session expired')
  })

  it('throws and sets error on API error response', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(422, { error: 'Username already taken' }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() => result.current.updateProfile({ username: 'taken' }))

    expect(thrown?.message).toBe('Username already taken')
    expect(result.current.error).toBe('Username already taken')
  })

  it('throws and sets error on network failure', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockRejectedValueOnce(new Error('Connection refused'))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() => result.current.updateProfile({ bio: 'test' }))

    expect(thrown?.message).toBe('Connection refused')
    expect(result.current.error).toBe('Connection refused')
  })

  it('falls back to "Failed to update profile" when the API returns no error message', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(500, {}))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() => result.current.updateProfile({ bio: 'test' }))

    expect(thrown?.message).toBe('Failed to update profile')
  })
})

// ---------------------------------------------------------------------------
// 3. updateDisplayPreferences
// ---------------------------------------------------------------------------

describe('updateDisplayPreferences', () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
  })

  it('sends PATCH to /api/profile/display with the provided data', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchOk({ preferences: { hide_userlist_main: true } }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateDisplayPreferences({ hide_userlist_main: true })
    })

    const patchCall = vi.mocked(fetch).mock.calls[1]
    expect(patchCall[0]).toBe('/api/profile/display')
    expect(patchCall[1]?.method).toBe('PATCH')
    expect(JSON.parse(patchCall[1]?.body as string)).toEqual({ hide_userlist_main: true })
  })

  it('merges returned preferences into the existing profile', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(
        makeFetchOk({ preferences: { hide_userlist_main: true, feed_grid_columns: 2 } })
      )

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateDisplayPreferences({
        hide_userlist_main: true,
        feed_grid_columns: 2,
      })
    })

    expect(result.current.profile?.hide_userlist_main).toBe(true)
    expect(result.current.profile?.feed_grid_columns).toBe(2)
    // Other profile fields are preserved
    expect(result.current.profile?.user_id).toBe(BASE_PROFILE.user_id)
  })

  it('sets error on 401 and returns silently without throwing', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(401))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() =>
      result.current.updateDisplayPreferences({ feed_grid_columns: 2 })
    )

    expect(thrown).toBeNull()
    expect(result.current.error).toBe('Session expired')
  })

  it('throws and sets error on API error', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(400, { error: 'Invalid column count' }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() =>
      result.current.updateDisplayPreferences({ feed_grid_columns: 3 })
    )

    expect(thrown?.message).toBe('Invalid column count')
    expect(result.current.error).toBe('Invalid column count')
  })
})

// ---------------------------------------------------------------------------
// 4. uploadAvatar
// ---------------------------------------------------------------------------

describe('uploadAvatar', () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
  })

  it('POSTs to /api/profile/avatar with FormData containing the file', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchOk({ avatar_url: 'https://example.com/avatar.jpg' }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })
    await act(async () => {
      await result.current.uploadAvatar(file)
    })

    const uploadCall = vi.mocked(fetch).mock.calls[1]
    expect(uploadCall[0]).toBe('/api/profile/avatar')
    expect(uploadCall[1]?.method).toBe('POST')
    const body = uploadCall[1]?.body as FormData
    expect(body.get('avatar')).toBe(file)
  })

  it('returns the avatar_url from the response', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchOk({ avatar_url: 'https://example.com/avatar.jpg' }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })
    let returnedUrl = ''
    await act(async () => {
      returnedUrl = await result.current.uploadAvatar(file)
    })

    expect(returnedUrl).toBe('https://example.com/avatar.jpg')
  })

  it('updates profile.avatar_url after successful upload', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchOk({ avatar_url: 'https://example.com/avatar.jpg' }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })
    await act(async () => {
      await result.current.uploadAvatar(file)
    })

    expect(result.current.profile?.avatar_url).toBe('https://example.com/avatar.jpg')
  })

  it('throws on 401 (unlike other mutations, uploadAvatar does not return silently)', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(401))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })
    const thrown = await catchFrom(() => result.current.uploadAvatar(file))

    expect(thrown?.message).toBe('Session expired')
    expect(result.current.error).toBe('Session expired')
  })

  it('throws and sets error on API error', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(413, { error: 'File too large' }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })
    const thrown = await catchFrom(() => result.current.uploadAvatar(file))

    expect(thrown?.message).toBe('File too large')
    expect(result.current.error).toBe('File too large')
  })
})

// ---------------------------------------------------------------------------
// 5. setAvatarUrl
// ---------------------------------------------------------------------------

describe('setAvatarUrl', () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
  })

  it('PATCHes /api/profile with avatar_url in the request body', async () => {
    const updatedProfile = { ...BASE_PROFILE, avatar_url: 'https://example.com/pic.jpg' }
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchOk({ profile: updatedProfile }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.setAvatarUrl('https://example.com/pic.jpg')
    })

    const patchCall = vi.mocked(fetch).mock.calls[1]
    expect(patchCall[0]).toBe('/api/profile')
    expect(patchCall[1]?.method).toBe('PATCH')
    expect(JSON.parse(patchCall[1]?.body as string)).toEqual({
      avatar_url: 'https://example.com/pic.jpg',
    })
  })

  it('updates profile state with the returned profile', async () => {
    const updatedProfile = { ...BASE_PROFILE, avatar_url: 'https://example.com/pic.jpg' }
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchOk({ profile: updatedProfile }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.setAvatarUrl('https://example.com/pic.jpg')
    })

    expect(result.current.profile?.avatar_url).toBe('https://example.com/pic.jpg')
  })

  it('sets error on 401 and returns silently without throwing', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(401))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() =>
      result.current.setAvatarUrl('https://example.com/pic.jpg')
    )

    expect(thrown).toBeNull()
    expect(result.current.error).toBe('Session expired')
  })

  it('throws and sets error on API error', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(422, { error: 'Invalid URL' }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() =>
      result.current.setAvatarUrl('https://example.com/pic.jpg')
    )

    expect(thrown?.message).toBe('Invalid URL')
    expect(result.current.error).toBe('Invalid URL')
  })
})

// ---------------------------------------------------------------------------
// 6. removeAvatar
// ---------------------------------------------------------------------------

describe('removeAvatar', () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
  })

  it('sends DELETE to /api/profile/avatar', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchOk({}))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.removeAvatar()
    })

    const deleteCall = vi.mocked(fetch).mock.calls[1]
    expect(deleteCall[0]).toBe('/api/profile/avatar')
    expect(deleteCall[1]?.method).toBe('DELETE')
  })

  it('sets profile.avatar_url to null after removal', async () => {
    const profileWithAvatar = { ...BASE_PROFILE, avatar_url: 'https://example.com/avatar.jpg' }
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: profileWithAvatar }))
      .mockReturnValueOnce(makeFetchOk({}))

    const { result } = renderHook(() => useProfile())
    await waitFor(() =>
      expect(result.current.profile?.avatar_url).toBe('https://example.com/avatar.jpg')
    )

    await act(async () => {
      await result.current.removeAvatar()
    })

    expect(result.current.profile?.avatar_url).toBeNull()
  })

  it('sets error on 401 and returns silently without throwing', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(401))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() => result.current.removeAvatar())

    expect(thrown).toBeNull()
    expect(result.current.error).toBe('Session expired')
  })

  it('throws and sets error on API error', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(500, { error: 'Storage error' }))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() => result.current.removeAvatar())

    expect(thrown?.message).toBe('Storage error')
    expect(result.current.error).toBe('Storage error')
  })

  it('falls back to "Failed to remove avatar" when the API returns no error message', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ profile: BASE_PROFILE }))
      .mockReturnValueOnce(makeFetchError(500, {}))

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const thrown = await catchFrom(() => result.current.removeAvatar())

    expect(thrown?.message).toBe('Failed to remove avatar')
  })
})
