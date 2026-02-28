import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { useUserLists } from '@/hooks/useUserLists'
import { useUser } from '@/hooks/useUser'
import storage from '@/lib/storage'
import type { FollowedUser } from '@/types/database'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useUser')
vi.mock('@/lib/storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUseUser = vi.mocked(useUser)
const mockGetItem = vi.mocked(storage.getItem)
const mockSetItem = vi.mocked(storage.setItem)

const MOCK_USER = { id: 'user-123' } as unknown as User

const ALICE: FollowedUser = { username: 'alice', added_at: '2024-01-01T00:00:00Z' }
const BOB: FollowedUser = { username: 'bob', added_at: '2024-01-02T00:00:00Z' }

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

beforeEach(() => {
  vi.clearAllMocks()
  // Default: guest mode, nothing in storage, storage writes succeed
  mockUseUser.mockReturnValue(makeUserReturn(null))
  mockGetItem.mockResolvedValue(null)
  mockSetItem.mockResolvedValue(undefined)
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// 1. Initialization
// ---------------------------------------------------------------------------

describe('initialization — guest mode', () => {
  it('starts with an empty list when localforage has nothing', async () => {
    mockGetItem.mockResolvedValue(null)

    const { result } = renderHook(() => useUserLists())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.users).toEqual([])
    expect(result.current.usernames).toEqual([])
  })

  it('loads FollowedUser[] from localforage', async () => {
    mockGetItem.mockResolvedValue([ALICE, BOB])

    const { result } = renderHook(() => useUserLists())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.users).toEqual([ALICE, BOB])
  })

  it('converts legacy string[] from localforage to FollowedUser[]', async () => {
    mockGetItem.mockResolvedValue(['alice', 'bob'])

    const { result } = renderHook(() => useUserLists())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.users).toHaveLength(2)
    expect(result.current.users[0].username).toBe('alice')
    expect(result.current.users[1].username).toBe('bob')
    // Each entry should have an added_at timestamp
    expect(result.current.users[0].added_at).toBeTruthy()
  })

  it('reports isAuthenticated as false', async () => {
    const { result } = renderHook(() => useUserLists())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('does not call fetch in guest mode', async () => {
    const { result } = renderHook(() => useUserLists())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('initialization — authenticated mode', () => {
  it('fetches /api/lists and populates users', async () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
    vi.mocked(fetch).mockReturnValue(makeFetchOk({ followed_users: [ALICE, BOB] }))

    const { result } = renderHook(() => useUserLists())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetch).toHaveBeenCalledWith('/api/lists')
    expect(result.current.users).toEqual([ALICE, BOB])
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('treats missing followed_users as empty array', async () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
    vi.mocked(fetch).mockReturnValue(makeFetchOk({}))

    const { result } = renderHook(() => useUserLists())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.users).toEqual([])
  })

  it('falls back to localforage on 401', async () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
    vi.mocked(fetch).mockReturnValue(makeFetchError(401))
    mockGetItem.mockResolvedValue([ALICE])

    const { result } = renderHook(() => useUserLists())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.users).toEqual([ALICE])
    expect(result.current.error).toBeNull()
  })

  it('sets an error on non-ok, non-401 responses', async () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
    vi.mocked(fetch).mockReturnValue(makeFetchError(500))

    const { result } = renderHook(() => useUserLists())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Failed to load your list')
    expect(result.current.users).toEqual([])
  })

  it('remains in loading state while auth is resolving', () => {
    mockUseUser.mockReturnValue(makeUserReturn(null, true))

    const { result } = renderHook(() => useUserLists())

    // Effect returns early while isAuthLoading; isLoading stays true
    expect(result.current.isLoading).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 2. addUser — validation (applies regardless of auth state)
// ---------------------------------------------------------------------------

describe('addUser — validation', () => {
  it('rejects an empty string', async () => {
    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const r = await act(async () => result.current.addUser(''))
    expect(r).toEqual({ success: false, error: 'Username is required' })
  })

  it('rejects a whitespace-only string', async () => {
    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const r = await act(async () => result.current.addUser('   '))
    expect(r).toEqual({ success: false, error: 'Username is required' })
  })

  it('rejects a duplicate username (case-insensitive)', async () => {
    mockGetItem.mockResolvedValue([ALICE])

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.users).toHaveLength(1)

    const r = await act(async () => result.current.addUser('Alice')) // different case
    expect(r).toEqual({ success: false, error: 'User already in list' })
  })

  it('does not call storage or fetch on validation failure', async () => {
    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.addUser(''))
    expect(fetch).not.toHaveBeenCalled()
    // setItem is called once during mount to read, but not on failed add
    expect(mockSetItem).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 3. addUser — guest mode
// ---------------------------------------------------------------------------

describe('addUser — guest mode', () => {
  it('adds a new user to state and returns success', async () => {
    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const r = await act(async () => result.current.addUser('alice'))
    expect(r).toEqual({ success: true })
    expect(result.current.users).toHaveLength(1)
    expect(result.current.users[0].username).toBe('alice')
  })

  it('trims and lowercases the username', async () => {
    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.addUser('  Alice  '))
    expect(result.current.users[0].username).toBe('alice')
  })

  it('persists usernames to localforage', async () => {
    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.addUser('alice'))
    expect(mockSetItem).toHaveBeenCalledWith('followed_users', ['alice'])
  })

  it('does not call fetch', async () => {
    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.addUser('alice'))
    expect(fetch).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 4. addUser — authenticated mode
// ---------------------------------------------------------------------------

describe('addUser — authenticated mode', () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
  })

  it('POSTs to /api/lists with the normalized username', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [] })) // initial load
      .mockReturnValueOnce(makeFetchOk({ user: ALICE }))         // addUser

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.addUser('  Alice  '))

    const addCall = vi.mocked(fetch).mock.calls[1]
    expect(addCall[0]).toBe('/api/lists')
    expect(JSON.parse(addCall[1]?.body as string)).toEqual({ username: 'alice' })
  })

  it('adds data.user to state on success', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [] }))
      .mockReturnValueOnce(makeFetchOk({ user: ALICE }))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const r = await act(async () => result.current.addUser('alice'))
    expect(r).toEqual({ success: true })
    expect(result.current.users).toContainEqual(ALICE)
  })

  it('returns SESSION_EXPIRED on 401', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [] }))
      .mockReturnValueOnce(makeFetchError(401))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const r = await act(async () => result.current.addUser('alice'))
    expect(r).toEqual({ success: false, error: 'SESSION_EXPIRED' })
  })

  it('returns data.error from the API body on non-ok response', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [] }))
      .mockReturnValueOnce(makeFetchError(422, { error: 'Username not found on Letterboxd' }))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const r = await act(async () => result.current.addUser('alice'))
    expect(r).toEqual({ success: false, error: 'Username not found on Letterboxd' })
  })

  it('falls back to "Failed to add user" when data.error is absent', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [] }))
      .mockReturnValueOnce(makeFetchError(500, {}))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const r = await act(async () => result.current.addUser('alice'))
    expect(r).toEqual({ success: false, error: 'Failed to add user' })
  })

  it('returns CONNECTION_ERROR on fetch TypeError', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [] }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const r = await act(async () => result.current.addUser('alice'))
    expect(r).toEqual({ success: false, error: 'CONNECTION_ERROR' })
  })

  it('does not modify local state on failure', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [BOB] }))
      .mockReturnValueOnce(makeFetchError(500, {}))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.addUser('alice'))
    expect(result.current.users).toEqual([BOB])
  })
})

// ---------------------------------------------------------------------------
// 5. removeUser — guest mode
// ---------------------------------------------------------------------------

describe('removeUser — guest mode', () => {
  it('removes the user from state', async () => {
    mockGetItem.mockResolvedValue([ALICE, BOB])

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.removeUser('alice'))
    expect(result.current.users).toEqual([BOB])
  })

  it('normalizes the username before removing', async () => {
    mockGetItem.mockResolvedValue([ALICE])

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.removeUser('  ALICE  '))
    expect(result.current.users).toEqual([])
  })

  it('updates localforage with remaining usernames', async () => {
    mockGetItem.mockResolvedValue([ALICE, BOB])

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.removeUser('alice'))
    expect(mockSetItem).toHaveBeenLastCalledWith('followed_users', ['bob'])
  })
})

// ---------------------------------------------------------------------------
// 6. removeUser — authenticated mode
// ---------------------------------------------------------------------------

describe('removeUser — authenticated mode', () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
  })

  it('DELETEs from /api/lists with the normalized username', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [ALICE] }))
      .mockReturnValueOnce(makeFetchOk({}))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.removeUser('  Alice  '))

    const deleteCall = vi.mocked(fetch).mock.calls[1]
    expect(deleteCall[0]).toBe('/api/lists')
    expect(deleteCall[1]?.method).toBe('DELETE')
    expect(JSON.parse(deleteCall[1]?.body as string)).toEqual({ username: 'alice' })
  })

  it('removes the user from state on success', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [ALICE, BOB] }))
      .mockReturnValueOnce(makeFetchOk({}))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.removeUser('alice'))
    expect(result.current.users).toEqual([BOB])
  })

  it('sets an error on non-ok response and keeps the list intact', async () => {
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchOk({ followed_users: [ALICE] }))
      .mockReturnValueOnce(makeFetchError(500, { error: 'Server error' }))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => result.current.removeUser('alice'))
    expect(result.current.error).toBe('Failed to remove user')
    expect(result.current.users).toEqual([ALICE])
  })
})

// ---------------------------------------------------------------------------
// 7. clearError
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears a previously set error', async () => {
    mockUseUser.mockReturnValue(makeUserReturn(MOCK_USER))
    vi.mocked(fetch)
      .mockReturnValueOnce(makeFetchError(500)) // triggers error on load
      .mockReturnValueOnce(makeFetchError(500, { error: 'oops' }))

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.error).toBeTruthy())

    act(() => result.current.clearError())
    expect(result.current.error).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 8. usernames — derived value
// ---------------------------------------------------------------------------

describe('usernames', () => {
  it('returns a string[] of usernames mirroring the users list', async () => {
    mockGetItem.mockResolvedValue([ALICE, BOB])

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.usernames).toEqual(['alice', 'bob'])
  })

  it('updates when users change', async () => {
    mockGetItem.mockResolvedValue([ALICE])

    const { result } = renderHook(() => useUserLists())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.usernames).toEqual(['alice'])

    await act(async () => result.current.addUser('bob'))
    expect(result.current.usernames).toContain('bob')
  })
})
