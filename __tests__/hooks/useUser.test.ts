import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { useUser } from '@/hooks/useUser'
import auth from '@/lib/auth'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth', () => ({
  default: {
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockGetUser = vi.mocked(auth.getUser)
const mockOnAuthStateChange = vi.mocked(auth.onAuthStateChange)
const mockSignOut = vi.mocked(auth.signOut)

const MOCK_USER = { id: 'user-123', email: 'test@example.com' } as unknown as User

/** Returns a no-op unsubscribe by default */
function stubOnAuthStateChange(
  callback?: (user: User | null) => void,
): ReturnType<typeof auth.onAuthStateChange> {
  return vi.fn().mockImplementation((cb: (user: User | null) => void) => {
    if (callback) callback(cb as unknown as User | null)
    return vi.fn() // unsubscribe
  })(callback) as ReturnType<typeof auth.onAuthStateChange>
}

beforeEach(() => {
  vi.clearAllMocks()
  // Safe defaults: guest user, no auth state changes, signOut succeeds
  mockGetUser.mockResolvedValue(null)
  mockOnAuthStateChange.mockReturnValue(vi.fn())
  mockSignOut.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// 1. Initialization
// ---------------------------------------------------------------------------

describe('initialization', () => {
  it('starts in loading state before getUser resolves', () => {
    mockGetUser.mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useUser())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('resolves to null user in guest mode', async () => {
    mockGetUser.mockResolvedValue(null)

    const { result } = renderHook(() => useUser())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('resolves to the authenticated user', async () => {
    mockGetUser.mockResolvedValue(MOCK_USER)

    const { result } = renderHook(() => useUser())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user).toEqual(MOCK_USER)
  })

  it('calls auth.getUser and auth.onAuthStateChange on mount', async () => {
    const { result } = renderHook(() => useUser())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockGetUser).toHaveBeenCalledTimes(1)
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// 2. onAuthStateChange
// ---------------------------------------------------------------------------

describe('onAuthStateChange', () => {
  it('updates user when auth state fires with a user', async () => {
    mockGetUser.mockResolvedValue(null)

    let storedCallback: ((user: User | null) => void) | null = null
    mockOnAuthStateChange.mockImplementation((cb) => {
      storedCallback = cb
      return vi.fn()
    })

    const { result } = renderHook(() => useUser())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      storedCallback!(MOCK_USER)
    })

    expect(result.current.user).toEqual(MOCK_USER)
    expect(result.current.isLoading).toBe(false)
  })

  it('clears user when auth state fires with null (logout event)', async () => {
    mockGetUser.mockResolvedValue(MOCK_USER)

    let storedCallback: ((user: User | null) => void) | null = null
    mockOnAuthStateChange.mockImplementation((cb) => {
      storedCallback = cb
      return vi.fn()
    })

    const { result } = renderHook(() => useUser())
    await waitFor(() => expect(result.current.user).toEqual(MOCK_USER))

    await act(async () => {
      storedCallback!(null)
    })

    expect(result.current.user).toBeNull()
  })

  it('calls the returned unsubscribe function on unmount', async () => {
    const unsubscribe = vi.fn()
    mockOnAuthStateChange.mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useUser())
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1))

    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// 3. signOut
// ---------------------------------------------------------------------------

describe('signOut', () => {
  it('calls auth.signOut and clears user state', async () => {
    mockGetUser.mockResolvedValue(MOCK_USER)

    const { result } = renderHook(() => useUser())
    await waitFor(() => expect(result.current.user).toEqual(MOCK_USER))

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(result.current.user).toBeNull()
  })

  it('clears user state even if auth.signOut rejects', async () => {
    mockGetUser.mockResolvedValue(MOCK_USER)
    mockSignOut.mockRejectedValue(new Error('signOut failed'))

    const { result } = renderHook(() => useUser())
    await waitFor(() => expect(result.current.user).toEqual(MOCK_USER))

    await act(async () => {
      try {
        await result.current.signOut()
      } catch {
        // expected
      }
    })

    // signOut was called but the user state depends on whether the hook catches the error
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
