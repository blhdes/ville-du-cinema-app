/**
 * MigrationModal tests
 *
 * Key behaviors:
 * - Visibility gating: auth state, localforage data, sessionStorage flag
 * - User list rendering
 * - Migration flow: POST /api/lists per user
 * - 409 → silent skip (not an error)
 * - Non-ok non-409 → silently ignored, migration still reaches success
 * - Auto-hide after 2 s (fake timers via vi.advanceTimersByTime)
 * - localforage cleanup post-migration
 * - Discard flow
 *
 * Timing strategy
 * ---------------
 * vi.useFakeTimers() is active for every test so the 2 s auto-close
 * setTimeout never fires unexpectedly. Because waitFor uses setInterval
 * internally (which is also faked), we avoid it entirely and instead drive
 * async effects manually with act().
 *
 *  flushEffects() — 2 act rounds — is enough to show the modal:
 *    round 1: React applies mount/auth effects; checkMigration() starts,
 *             hits `await localforage.getItem()`, schedules microtask M1
 *    round 2: M1 resolves between rounds 1 and 2; React flushes the
 *             resulting state update (setIsVisible(true)) → modal appears
 *
 *  flushAll() — 8 act rounds — handles the full migration loop:
 *    each extra round drains one `await` level inside handleMigrate
 *    (fetch per user + removeItem + final state update)
 *
 * Note: the `state === 'error'` branch exists in the JSX but is never set by
 * handleMigrate. Failures (non-409) are silently ignored and the modal still
 * reaches 'success'. Tests verify the real behaviour.
 */
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { User } from '@supabase/supabase-js'
import MigrationModal from '@/components/MigrationModal'
import { useUser } from '@/hooks/useUser'
import localforage from 'localforage'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}))

vi.mock('localforage', () => ({
  default: {
    getItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// ---------------------------------------------------------------------------
// Typed helpers
// ---------------------------------------------------------------------------

const mockUseUser = vi.mocked(useUser)
const mockGetItem = vi.mocked(localforage.getItem)
const mockRemoveItem = vi.mocked(localforage.removeItem)

const MOCK_USER = { id: 'user-1' } as unknown as User
const SESSION_KEY = 'migration_modal_dismissed'
const LOCALFORAGE_KEY = 'followed_users'

// ---------------------------------------------------------------------------
// Fetch response factories (mirrors pattern from useUserLists.test.ts)
// ---------------------------------------------------------------------------

function fetchOk(): Promise<Response> {
  return Promise.resolve({ ok: true, status: 200 } as Response)
}

function fetchStatus(status: number): Promise<Response> {
  return Promise.resolve({ ok: false, status } as Response)
}

// ---------------------------------------------------------------------------
// Async-flush helpers
//
// Each `await act(async () => {})` call:
//   1. Flushes any pending React state updates (re-render)
//   2. Resolves, allowing the next microtask in the queue to run
//      (which was scheduled by the previous `await` inside an async handler)
//   3. The next act() call then picks up the resulting state updates
//
// flushEffects()  — 2 rounds — shows the modal (mount → localforage → render)
// flushAll()      — 8 rounds — completes the migration loop for up to 5 users
// ---------------------------------------------------------------------------

async function flushEffects() {
  await act(async () => {})
  await act(async () => {})
}

async function flushAll() {
  for (let i = 0; i < 8; i++) {
    await act(async () => {})
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('MigrationModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
    mockGetItem.mockResolvedValue(null)
    mockRemoveItem.mockResolvedValue(undefined)
    // Default: unauthenticated
    mockUseUser.mockReturnValue({
      user: null,
      isLoading: false,
    } as ReturnType<typeof useUser>)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  // Convenience wrappers -------------------------------------------------------

  function setAuth(user: User | null = MOCK_USER) {
    mockUseUser.mockReturnValue({ user, isLoading: false } as ReturnType<typeof useUser>)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function setLocalUsers(users: string[] | null) {
    mockGetItem.mockResolvedValue(users as any)
  }

  function renderModal(onComplete = vi.fn()) {
    return { view: render(<MigrationModal onComplete={onComplete} />), onComplete }
  }

  // ---------------------------------------------------------------------------
  // 1. Does not render when user is null (guest mode)
  // ---------------------------------------------------------------------------

  it('does not render when user is null', async () => {
    setAuth(null)
    setLocalUsers(['alice', 'bob'])

    renderModal()
    await flushEffects()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 2. Does not render when localforage has no data
  // ---------------------------------------------------------------------------

  it('does not render when localforage returns null', async () => {
    setAuth()
    setLocalUsers(null)

    renderModal()
    await flushEffects()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not render when localforage returns an empty array', async () => {
    setAuth()
    setLocalUsers([])

    renderModal()
    await flushEffects()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 3. Does not render if sessionStorage key is already set
  // ---------------------------------------------------------------------------

  it('does not render when sessionStorage key is already set', async () => {
    setAuth()
    setLocalUsers(['alice'])
    sessionStorage.setItem(SESSION_KEY, 'shown')

    renderModal()
    await flushEffects()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 4. Renders the modal when authenticated + localforage has users
  // ---------------------------------------------------------------------------

  it('renders the modal when authenticated and localforage has data', async () => {
    setAuth()
    setLocalUsers(['alice', 'bob'])

    renderModal()
    await flushEffects()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // useTranslations stub returns the key itself
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 5. Lists all localforage users in the modal
  // ---------------------------------------------------------------------------

  it('lists all localforage users prefixed with @', async () => {
    setAuth()
    setLocalUsers(['alice', 'bob', 'charlie'])

    renderModal()
    await flushEffects()

    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.getByText('@bob')).toBeInTheDocument()
    expect(screen.getByText('@charlie')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 6. Clicking confirm POSTs each user to /api/lists
  // ---------------------------------------------------------------------------

  it('POSTs each user to /api/lists when sync is clicked', async () => {
    setAuth()
    setLocalUsers(['alice', 'bob'])
    vi.mocked(fetch).mockReturnValue(fetchOk())

    renderModal()
    await flushEffects()

    fireEvent.click(screen.getByText('sync'))
    await flushAll()

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/lists',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'alice' }),
      }),
    )
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/lists',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'bob' }),
      }),
    )
  })

  // ---------------------------------------------------------------------------
  // 7. Shows success state after all migrations complete
  // ---------------------------------------------------------------------------

  it('shows success state after migration completes', async () => {
    setAuth()
    setLocalUsers(['alice', 'bob'])
    vi.mocked(fetch).mockReturnValue(fetchOk())

    renderModal()
    await flushEffects()

    fireEvent.click(screen.getByText('sync'))
    await flushAll()

    expect(screen.getByText('success')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // 8. Auto-hides modal after 2 s and calls onComplete
  // ---------------------------------------------------------------------------

  it('auto-hides after 2 s and calls onComplete with correct counts', async () => {
    setAuth()
    setLocalUsers(['alice', 'bob'])
    vi.mocked(fetch).mockReturnValue(fetchOk())

    const { onComplete } = renderModal()
    await flushEffects()

    fireEvent.click(screen.getByText('sync'))
    await flushAll()

    expect(screen.getByText('success')).toBeInTheDocument()

    // Advance the 2 s auto-close setTimeout
    act(() => vi.advanceTimersByTime(2000))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledWith({ migrated: 2, skipped: 0 })
  })

  // ---------------------------------------------------------------------------
  // 9. sessionStorage key is set when modal first appears (prevents re-show)
  // ---------------------------------------------------------------------------

  it('sets sessionStorage key when the modal first shows', async () => {
    setAuth()
    setLocalUsers(['alice'])

    renderModal()
    await flushEffects()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(sessionStorage.getItem(SESSION_KEY)).toBeTruthy()
  })

  // ---------------------------------------------------------------------------
  // 10. Clears localforage after successful migration
  // ---------------------------------------------------------------------------

  it('removes localforage key after migration completes', async () => {
    setAuth()
    setLocalUsers(['alice'])
    vi.mocked(fetch).mockReturnValue(fetchOk())

    renderModal()
    await flushEffects()

    fireEvent.click(screen.getByText('sync'))
    await flushAll()

    expect(mockRemoveItem).toHaveBeenCalledWith(LOCALFORAGE_KEY)
  })

  // ---------------------------------------------------------------------------
  // 11. 409 response → silent skip (dedup), modal still reaches success
  // ---------------------------------------------------------------------------

  it('treats 409 as a silent skip and still reaches success', async () => {
    setAuth()
    setLocalUsers(['alice', 'bob'])
    vi.mocked(fetch)
      .mockReturnValueOnce(fetchOk())         // alice: 200 → migrated
      .mockReturnValueOnce(fetchStatus(409))  // bob: 409  → skipped

    const { onComplete } = renderModal()
    await flushEffects()

    fireEvent.click(screen.getByText('sync'))
    await flushAll()

    expect(screen.getByText('success')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2000))
    expect(onComplete).toHaveBeenCalledWith({ migrated: 1, skipped: 1 })
  })

  // ---------------------------------------------------------------------------
  // 12. Non-ok non-409 error → silently ignored, modal still reaches success
  // (The 'error' state in the JSX is never set by handleMigrate — confirmed
  //  by code inspection. Failures simply go uncounted.)
  // ---------------------------------------------------------------------------

  it('ignores non-409 server errors and completes migration with count 0', async () => {
    setAuth()
    setLocalUsers(['alice'])
    vi.mocked(fetch).mockReturnValue(fetchStatus(500))

    const { onComplete } = renderModal()
    await flushEffects()

    fireEvent.click(screen.getByText('sync'))
    await flushAll()

    // Migration still completes (no error state) — alice just isn't counted
    expect(screen.getByText('success')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2000))
    expect(onComplete).toHaveBeenCalledWith({ migrated: 0, skipped: 0 })
  })

  // ---------------------------------------------------------------------------
  // 13. Partial migration: POSTs all users, counts only those with 2xx
  // ---------------------------------------------------------------------------

  it('sends all POST requests and counts only successful migrations', async () => {
    setAuth()
    setLocalUsers(['alice', 'bob', 'charlie'])
    vi.mocked(fetch)
      .mockReturnValueOnce(fetchOk())         // alice:   200
      .mockReturnValueOnce(fetchStatus(500))  // bob:     500 (uncounted)
      .mockReturnValueOnce(fetchOk())         // charlie: 200

    const { onComplete } = renderModal()
    await flushEffects()

    fireEvent.click(screen.getByText('sync'))
    await flushAll()

    // All three POSTs were sent, even after bob failed
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3)
    expect(screen.getByText('success')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2000))
    expect(onComplete).toHaveBeenCalledWith({ migrated: 2, skipped: 0 })
  })

  // ---------------------------------------------------------------------------
  // Bonus: Discard hides modal without fetching
  // ---------------------------------------------------------------------------

  it('discard button hides modal immediately and calls onComplete with 0/0', async () => {
    setAuth()
    setLocalUsers(['alice'])

    const { onComplete } = renderModal()
    await flushEffects()

    fireEvent.click(screen.getByText('discard'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledWith({ migrated: 0, skipped: 0 })
  })
})
