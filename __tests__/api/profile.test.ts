import { vi, describe, it, expect, beforeEach } from 'vitest'
import { GET, PATCH } from '@/app/api/profile/route'
import { createClient } from '@/lib/supabase/server'
import type { UserData } from '@/types/database'

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server')

const mockCreateClient = vi.mocked(createClient)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-123' }

const DB_ROW: UserData = {
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

/**
 * Builds a fake Supabase client.
 *
 * The returned object covers the two query chains used by the route:
 *   GET  → .from().select().eq().single()
 *   PATCH → .from().upsert().select().single()
 */
function makeSupabase({
  user = MOCK_USER as object | null,
  dbResult = { data: DB_ROW, error: null } as { data: unknown; error: unknown },
} = {}) {
  const single = vi.fn().mockResolvedValue(dbResult)
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq, single })) // select().eq()…  OR  select().single()
  const upsert = vi.fn(() => ({ select }))
  const from = vi.fn(() => ({ select, upsert }))
  const getUser = vi.fn().mockResolvedValue({ data: { user } })

  return { auth: { getUser }, from, _single: single }
}

/** Installs a fake Supabase client and returns it for assertion access. */
function mockClient(options: Parameters<typeof makeSupabase>[0] = {}) {
  const supabase = makeSupabase(options)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockCreateClient.mockResolvedValue(supabase as any)
  return supabase
}

/** Creates a PATCH Request with a JSON body. */
function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// GET /api/profile
// ---------------------------------------------------------------------------

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the request is unauthenticated', async () => {
    mockClient({ user: null })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns the profile when a user_data row exists', async () => {
    mockClient({ dbResult: { data: DB_ROW, error: null } })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.profile).toMatchObject({
      user_id: 'user-123',
      bio: '',
      language: 'fr',
      feed_grid_columns: 1,
      followed_users: [],
    })
  })

  it('returns a default profile (not 404) when no row exists (PGRST116)', async () => {
    mockClient({ dbResult: { data: null, error: { code: 'PGRST116' } } })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.profile).toMatchObject({
      user_id: 'user-123',
      bio: '',
      avatar_url: null,
      display_name: null,
      followed_users: [],
      language: 'en',
      hide_userlist_main: false,
      feed_grid_columns: 1,
      hide_watch_notifications: false,
      username: null,
    })
  })

  it('returns 500 on an unexpected Supabase error', async () => {
    mockClient({ dbResult: { data: null, error: { code: 'UNEXPECTED', message: 'DB error' } } })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toBe('Failed to fetch profile')
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/profile
// ---------------------------------------------------------------------------

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when the request is unauthenticated', async () => {
    mockClient({ user: null })

    const res = await PATCH(makeRequest({}))
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  // ── Field validation ──────────────────────────────────────────────────────

  it('returns 400 when bio exceeds 500 characters', async () => {
    mockClient()

    const res = await PATCH(makeRequest({ bio: 'a'.repeat(501) }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Bio must be 500 characters or less')
  })

  it('returns 400 when display_name exceeds 50 characters', async () => {
    mockClient()

    const res = await PATCH(makeRequest({ display_name: 'a'.repeat(51) }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Display name must be 50 characters or less')
  })

  it('returns 400 when feed_grid_columns is not 1, 2, or 3', async () => {
    mockClient()

    const res = await PATCH(makeRequest({ feed_grid_columns: 4 }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('feed_grid_columns must be 1, 2, or 3')
  })

  // ── Username format ───────────────────────────────────────────────────────

  it.each([
    ['AB', 'uppercase letters'],
    ['123abc', 'starts with a digit'],
    ['a b', 'contains a space'],
    ['a!', 'contains a special character'],
    ['ab', 'only 2 characters (minimum is 3)'],
  ])('returns 400 for invalid username "%s" (%s)', async (username) => {
    mockClient()

    const res = await PATCH(makeRequest({ username }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Invalid username format')
  })

  // ── Reserved usernames ────────────────────────────────────────────────────

  /**
   * All entries pass the format regex (/^[a-z][a-z0-9-]{2,29}$/) and are
   * therefore caught by the reserved-word check, not the format check.
   * Note: 'u' (1 char) does NOT pass format; it is tested separately below.
   */
  it.each(['admin', 'settings', 'profile', 'login', 'signup', 'api'])(
    'returns 400 with "Username is reserved" for "%s"',
    async (username) => {
      mockClient()

      const res = await PATCH(makeRequest({ username }))
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toBe('Username is reserved')
    }
  )

  /**
   * 'u' is in the reserved list but is only 1 character, so it fails the
   * format regex before the reserved check is reached — still returns 400.
   */
  it('returns 400 for reserved single-char username "u" (caught by format check first)', async () => {
    mockClient()

    const res = await PATCH(makeRequest({ username: 'u' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Invalid username format')
  })

  // ── Database errors ───────────────────────────────────────────────────────

  it('returns 409 when Supabase reports a username unique-constraint violation', async () => {
    mockClient({
      dbResult: {
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "user_data_username_key"',
        },
      },
    })

    const res = await PATCH(makeRequest({ username: 'alice' }))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error).toBe('Username is already taken')
  })

  it('returns 500 on an unexpected Supabase upsert error', async () => {
    mockClient({
      dbResult: { data: null, error: { code: 'UNEXPECTED', message: 'DB error' } },
    })

    const res = await PATCH(makeRequest({ bio: 'hello' }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toBe('Failed to update profile')
  })

  // ── Request body ──────────────────────────────────────────────────────────

  it('returns 400 for an invalid JSON body', async () => {
    mockClient()

    const request = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not json {{{',
    })

    const res = await PATCH(request)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Invalid JSON body')
  })

  // ── Success ───────────────────────────────────────────────────────────────

  it('returns the updated profile on a successful upsert', async () => {
    const updatedRow: UserData = {
      ...DB_ROW,
      bio: 'Hello world',
      display_name: 'Test User',
      username: 'testuser',
    }
    mockClient({ dbResult: { data: updatedRow, error: null } })

    const res = await PATCH(makeRequest({ bio: 'Hello world', display_name: 'Test User', username: 'testuser' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.profile).toMatchObject({
      user_id: 'user-123',
      bio: 'Hello world',
      display_name: 'Test User',
      username: 'testuser',
    })
  })
})
