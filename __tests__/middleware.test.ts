import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Hoisted spies (must be defined before vi.mock factories run)
// ---------------------------------------------------------------------------

const mockIntlMiddlewareFn = vi.hoisted(() => vi.fn())
const mockUpdateSession = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => mockIntlMiddlewareFn),
}))

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: mockUpdateSession,
}))

vi.mock('@/i18n/routing', () => ({
  routing: {},
}))

// ---------------------------------------------------------------------------
// Subject under test (imported after mocks so it picks up mocked deps)
// ---------------------------------------------------------------------------

import { middleware } from '@/middleware'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('middleware', () => {
  beforeEach(() => {
    // Keep Supabase env vars absent so updateSession is never reached
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    vi.clearAllMocks()
    mockIntlMiddlewareFn.mockReturnValue(NextResponse.next())
    mockUpdateSession.mockResolvedValue({ supabaseResponse: NextResponse.next() })
  })

  // -------------------------------------------------------------------------
  // 1–3: locale-prefixed /u/ paths must 301-redirect to bare /u/ paths
  // -------------------------------------------------------------------------

  describe('locale-prefixed profile URL redirects (301)', () => {
    it('redirects /fr/u/alice → /u/alice', async () => {
      const response = await middleware(makeRequest('/fr/u/alice'))
      expect(response.status).toBe(301)
      expect(response.headers.get('location')).toBe('http://localhost/u/alice')
    })

    it('redirects /en/u/bob → /u/bob', async () => {
      const response = await middleware(makeRequest('/en/u/bob'))
      expect(response.status).toBe(301)
      expect(response.headers.get('location')).toBe('http://localhost/u/bob')
    })

    it('redirects /es/u/charlie/extra → /u/charlie/extra', async () => {
      const response = await middleware(makeRequest('/es/u/charlie/extra'))
      expect(response.status).toBe(301)
      expect(response.headers.get('location')).toBe('http://localhost/u/charlie/extra')
    })
  })

  // -------------------------------------------------------------------------
  // 4–6: public-profile and API routes must bypass i18n middleware
  // -------------------------------------------------------------------------

  describe('routes that skip intlMiddleware', () => {
    it('does not call intlMiddleware for /u/alice (public profile)', async () => {
      await middleware(makeRequest('/u/alice'))
      expect(mockIntlMiddlewareFn).not.toHaveBeenCalled()
    })

    it('does not call intlMiddleware for /api/profile', async () => {
      await middleware(makeRequest('/api/profile'))
      expect(mockIntlMiddlewareFn).not.toHaveBeenCalled()
    })

    it('does not call intlMiddleware for /api/lists', async () => {
      await middleware(makeRequest('/api/lists'))
      expect(mockIntlMiddlewareFn).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // 7–8: locale-prefixed and root routes must invoke i18n middleware
  // -------------------------------------------------------------------------

  describe('routes that invoke intlMiddleware', () => {
    it('calls intlMiddleware for /fr/profile (locale-prefixed route)', async () => {
      await middleware(makeRequest('/fr/profile'))
      expect(mockIntlMiddlewareFn).toHaveBeenCalledOnce()
    })

    it('calls intlMiddleware for / (root route)', async () => {
      await middleware(makeRequest('/'))
      expect(mockIntlMiddlewareFn).toHaveBeenCalledOnce()
    })
  })
})
