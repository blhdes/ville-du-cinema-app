import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useDisplayPreferences } from '@/hooks/useDisplayPreferences'
import { useProfile } from '@/hooks/useProfile'
import type { UserProfile } from '@/types/database'

vi.mock('@/hooks/useProfile')

const mockUseProfile = vi.mocked(useProfile)

// Minimal UserProfile fixture
const BASE_PROFILE: UserProfile = {
  user_id: 'test-user',
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

function makeProfileReturn(
  profile: UserProfile | null,
  updateDisplayPreferences = vi.fn().mockResolvedValue(undefined)
) {
  return {
    profile,
    isLoading: false,
    error: null,
    updateDisplayPreferences,
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    setAvatarUrl: vi.fn(),
    removeAvatar: vi.fn(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// 1. Defaults when no profile is loaded
// ---------------------------------------------------------------------------

describe('when profile is null (guest / unauthenticated)', () => {
  it('returns DEFAULTS for all preferences', () => {
    mockUseProfile.mockReturnValue(makeProfileReturn(null))

    const { result } = renderHook(() => useDisplayPreferences())

    expect(result.current.preferences).toEqual({
      hideUserlistMain: false,
      feedGridColumns: 1,
      hideWatchNotifications: false,
    })
  })

  it('reports isAuthenticated as false', () => {
    mockUseProfile.mockReturnValue(makeProfileReturn(null))

    const { result } = renderHook(() => useDisplayPreferences())

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('does not call updateDisplayPreferences on any setter', async () => {
    const updateDisplayPreferences = vi.fn()
    mockUseProfile.mockReturnValue(makeProfileReturn(null, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.setHideUserlistMain(true)
      await result.current.setFeedGridColumns(2)
      await result.current.setHideWatchNotifications(true)
    })

    expect(updateDisplayPreferences).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 2. Profile values synced to camelCase preferences
// ---------------------------------------------------------------------------

describe('when profile is loaded', () => {
  it('maps snake_case profile fields to camelCase preferences', () => {
    const profile: UserProfile = {
      ...BASE_PROFILE,
      hide_userlist_main: true,
      feed_grid_columns: 3,
      hide_watch_notifications: true,
    }
    mockUseProfile.mockReturnValue(makeProfileReturn(profile))

    const { result } = renderHook(() => useDisplayPreferences())

    expect(result.current.preferences).toEqual({
      hideUserlistMain: true,
      feedGridColumns: 3,
      hideWatchNotifications: true,
    })
  })

  it('reports isAuthenticated as true', () => {
    mockUseProfile.mockReturnValue(makeProfileReturn(BASE_PROFILE))

    const { result } = renderHook(() => useDisplayPreferences())

    expect(result.current.isAuthenticated).toBe(true)
  })

  it('resets to DEFAULTS when profile becomes null (logout)', () => {
    let profileValue: UserProfile | null = BASE_PROFILE
    // Simulate profile change by making useProfile reactive to our variable
    mockUseProfile.mockImplementation(() => makeProfileReturn(profileValue))

    const { result, rerender } = renderHook(() => useDisplayPreferences())

    expect(result.current.preferences.feedGridColumns).toBe(1)

    profileValue = null
    rerender()

    expect(result.current.preferences).toEqual({
      hideUserlistMain: false,
      feedGridColumns: 1,
      hideWatchNotifications: false,
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Optimistic update — local state updates before the API responds
// ---------------------------------------------------------------------------

describe('optimistic updates', () => {
  it('reflects the new value immediately, before the API call settles', () => {
    let resolveApi!: () => void
    const pendingApi = new Promise<void>((res) => {
      resolveApi = res
    })
    const updateDisplayPreferences = vi.fn().mockReturnValue(pendingApi)
    mockUseProfile.mockReturnValue(makeProfileReturn(BASE_PROFILE, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    // Fire-and-forget: setLocalPrefs runs synchronously before the first await
    act(() => {
      void result.current.updatePreferences({ hideWatchNotifications: true })
    })

    // Optimistic state visible before API resolves
    expect(result.current.preferences.hideWatchNotifications).toBe(true)

    // Clean up the dangling promise
    act(() => {
      resolveApi()
    })
  })

  it('translates camelCase prefs to snake_case when calling the API', async () => {
    const updateDisplayPreferences = vi.fn().mockResolvedValue(undefined)
    mockUseProfile.mockReturnValue(makeProfileReturn(BASE_PROFILE, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.updatePreferences({
        hideUserlistMain: true,
        feedGridColumns: 2,
        hideWatchNotifications: true,
      })
    })

    expect(updateDisplayPreferences).toHaveBeenCalledOnce()
    expect(updateDisplayPreferences).toHaveBeenCalledWith({
      hide_userlist_main: true,
      feed_grid_columns: 2,
      hide_watch_notifications: true,
    })
  })

  it('only includes keys present in the partial update', async () => {
    const updateDisplayPreferences = vi.fn().mockResolvedValue(undefined)
    mockUseProfile.mockReturnValue(makeProfileReturn(BASE_PROFILE, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.updatePreferences({ feedGridColumns: 2 })
    })

    expect(updateDisplayPreferences).toHaveBeenCalledWith({ feed_grid_columns: 2 })
  })
})

// ---------------------------------------------------------------------------
// 4. Revert on API failure
// ---------------------------------------------------------------------------

describe('revert on API failure', () => {
  it('restores preferences from profile when updateDisplayPreferences throws', async () => {
    const updateDisplayPreferences = vi.fn().mockRejectedValue(new Error('Network error'))
    const profile: UserProfile = { ...BASE_PROFILE, hide_watch_notifications: false }
    mockUseProfile.mockReturnValue(makeProfileReturn(profile, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.updatePreferences({ hideWatchNotifications: true })
    })

    // Reverted to the profile value
    expect(result.current.preferences.hideWatchNotifications).toBe(false)
  })

  it('reverts all three fields on failure', async () => {
    const updateDisplayPreferences = vi.fn().mockRejectedValue(new Error('fail'))
    const profile: UserProfile = {
      ...BASE_PROFILE,
      hide_userlist_main: true,
      feed_grid_columns: 2,
      hide_watch_notifications: false,
    }
    mockUseProfile.mockReturnValue(makeProfileReturn(profile, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.updatePreferences({
        hideUserlistMain: false,
        feedGridColumns: 1,
        hideWatchNotifications: true,
      })
    })

    expect(result.current.preferences).toEqual({
      hideUserlistMain: true,
      feedGridColumns: 2,
      hideWatchNotifications: false,
    })
  })
})

// ---------------------------------------------------------------------------
// 5. setHideUserlistMain — constraint: 3 columns → 2 when userlist reappears
// ---------------------------------------------------------------------------

describe('setHideUserlistMain', () => {
  it('drops feedGridColumns from 3 to 2 when showing the userlist again', async () => {
    const updateDisplayPreferences = vi.fn().mockResolvedValue(undefined)
    const profile: UserProfile = {
      ...BASE_PROFILE,
      hide_userlist_main: true,
      feed_grid_columns: 3,
    }
    mockUseProfile.mockReturnValue(makeProfileReturn(profile, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.setHideUserlistMain(false)
    })

    expect(updateDisplayPreferences).toHaveBeenCalledWith({
      hide_userlist_main: false,
      feed_grid_columns: 2,
    })
  })

  it('does not adjust columns when hiding the userlist', async () => {
    const updateDisplayPreferences = vi.fn().mockResolvedValue(undefined)
    mockUseProfile.mockReturnValue(makeProfileReturn(BASE_PROFILE, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.setHideUserlistMain(true)
    })

    expect(updateDisplayPreferences).toHaveBeenCalledWith({ hide_userlist_main: true })
  })
})

// ---------------------------------------------------------------------------
// 6. setFeedGridColumns — constraint: 3 columns only when userlist is hidden
// ---------------------------------------------------------------------------

describe('setFeedGridColumns', () => {
  it('blocks 3 columns when the userlist is visible', async () => {
    const updateDisplayPreferences = vi.fn().mockResolvedValue(undefined)
    const profile: UserProfile = { ...BASE_PROFILE, hide_userlist_main: false }
    mockUseProfile.mockReturnValue(makeProfileReturn(profile, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.setFeedGridColumns(3)
    })

    expect(updateDisplayPreferences).not.toHaveBeenCalled()
  })

  it('allows 3 columns when the userlist is hidden', async () => {
    const updateDisplayPreferences = vi.fn().mockResolvedValue(undefined)
    const profile: UserProfile = {
      ...BASE_PROFILE,
      hide_userlist_main: true,
      feed_grid_columns: 1,
    }
    mockUseProfile.mockReturnValue(makeProfileReturn(profile, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.setFeedGridColumns(3)
    })

    expect(updateDisplayPreferences).toHaveBeenCalledWith({ feed_grid_columns: 3 })
  })

  it('allows 1 and 2 columns regardless of userlist visibility', async () => {
    const updateDisplayPreferences = vi.fn().mockResolvedValue(undefined)
    mockUseProfile.mockReturnValue(makeProfileReturn(BASE_PROFILE, updateDisplayPreferences))

    const { result } = renderHook(() => useDisplayPreferences())

    await act(async () => {
      await result.current.setFeedGridColumns(1)
    })
    await act(async () => {
      await result.current.setFeedGridColumns(2)
    })

    expect(updateDisplayPreferences).toHaveBeenCalledTimes(2)
  })
})
