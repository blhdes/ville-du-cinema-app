import { vi, describe, it, expect, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Hoisted stores & mock functions
//
// vi.hoisted() callbacks run before any imports and before vi.mock() factories,
// making these values safely referenceable inside mock factory closures.
// ---------------------------------------------------------------------------

/**
 * Captures the locale-resolution callback passed to getRequestConfig at module
 * evaluation time so tests can invoke it directly.
 */
const configCallbackStore = vi.hoisted(() => ({
  fn: null as ((args: {
    requestLocale: Promise<string | undefined>
  }) => Promise<{ locale: string; messages: unknown }>) | null,
}))

const mockCookies = vi.hoisted(() => vi.fn())
const mockHeaders = vi.hoisted(() => vi.fn())
const mockCreateClient = vi.hoisted(() => vi.fn())

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

/**
 * Replace getRequestConfig with a pass-through that captures the callback.
 * When i18n/request.ts is evaluated it calls getRequestConfig(cb) — our shim
 * stores cb in configCallbackStore.fn and returns it unchanged.
 */
vi.mock('next-intl/server', () => ({
  getRequestConfig: (cb: NonNullable<typeof configCallbackStore.fn>) => {
    configCallbackStore.fn = cb
    return cb
  },
}))

vi.mock('next/headers', () => ({
  cookies: mockCookies,
  headers: mockHeaders,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

/**
 * Provide a minimal routing config instead of importing next-intl/navigation,
 * which is not compatible with the jsdom test environment.
 */
vi.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['fr', 'en', 'es'] as const,
    defaultLocale: 'fr',
  },
}))

// ---------------------------------------------------------------------------
// Subject under test (imported after mocks so it picks up all mocked deps)
//
// Importing the module triggers getRequestConfig(cb), which populates
// configCallbackStore.fn with the real locale-resolution callback.
// ---------------------------------------------------------------------------

import '@/i18n/request'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ConfigCallback = NonNullable<typeof configCallbackStore.fn>

function getCallback(): ConfigCallback {
  if (!configCallbackStore.fn) {
    throw new Error('getRequestConfig callback was not captured — check mock setup')
  }
  return configCallbackStore.fn
}

/**
 * Invokes the config callback simulating a non-[locale] route (e.g. /u/alice)
 * where the [locale] segment is absent and requestLocale resolves to undefined.
 */
async function resolveForNonLocaleRoute(): Promise<string> {
  const result = await getCallback()({ requestLocale: Promise.resolve(undefined) })
  return result.locale
}

/**
 * Invokes the config callback simulating a [locale]-prefixed route (e.g. /en/…).
 */
async function resolveForLocaleRoute(locale: string): Promise<string> {
  const result = await getCallback()({ requestLocale: Promise.resolve(locale) })
  return result.locale
}

// --- Cookie helpers ---

function setCookie(value: string) {
  mockCookies.mockResolvedValue({
    get: (name: string) => (name === 'NEXT_LOCALE' ? { value } : undefined),
  })
}

function noCookie() {
  mockCookies.mockResolvedValue({ get: () => undefined })
}

// --- Header helpers ---

function setAcceptLanguage(value: string | null) {
  mockHeaders.mockResolvedValue({
    get: (name: string) => (name === 'accept-language' ? value : null),
  })
}

function noAcceptLanguage() {
  mockHeaders.mockResolvedValue({ get: () => null })
}

// --- Supabase helpers ---

function setupSupabase({
  user = null as object | null,
  language = null as string | null,
} = {}) {
  const single = vi.fn().mockResolvedValue({
    data: language !== null ? { language } : null,
  })
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  const getUser = vi.fn().mockResolvedValue({ data: { user } })

  mockCreateClient.mockResolvedValue({ auth: { getUser }, from })
}

// ---------------------------------------------------------------------------
// resolveLocaleFromContext — tested via non-[locale] route invocations
// ---------------------------------------------------------------------------

describe('resolveLocaleFromContext — non-[locale] routes like /u/username', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no signals present → should fall through to default locale 'fr'
    noCookie()
    noAcceptLanguage()
    setupSupabase({ user: null })
  })

  // ── Priority 1: NEXT_LOCALE cookie ────────────────────────────────────────

  it('resolves to "en" when NEXT_LOCALE cookie is "en"', async () => {
    setCookie('en')
    expect(await resolveForNonLocaleRoute()).toBe('en')
  })

  it('resolves to "es" when NEXT_LOCALE cookie is "es"', async () => {
    setCookie('es')
    expect(await resolveForNonLocaleRoute()).toBe('es')
  })

  it('ignores NEXT_LOCALE cookie with unsupported locale "de" and falls through to default', async () => {
    setCookie('de')
    // No user, no Accept-Language → reaches default
    expect(await resolveForNonLocaleRoute()).toBe('fr')
  })

  // ── Priority 2: authenticated user's DB language ──────────────────────────

  it('resolves to "en" from authenticated user DB language when no cookie', async () => {
    setupSupabase({ user: { id: 'u1' }, language: 'en' })
    expect(await resolveForNonLocaleRoute()).toBe('en')
  })

  it('resolves to "es" from authenticated user DB language when no cookie', async () => {
    setupSupabase({ user: { id: 'u1' }, language: 'es' })
    expect(await resolveForNonLocaleRoute()).toBe('es')
  })

  // ── Priority 3: Accept-Language header ────────────────────────────────────

  it('resolves to "en" from Accept-Language "en-US,en;q=0.9" when no cookie or user', async () => {
    setAcceptLanguage('en-US,en;q=0.9')
    expect(await resolveForNonLocaleRoute()).toBe('en')
  })

  it('resolves to "fr" (highest q-value) from Accept-Language "es;q=0.8,fr;q=0.9"', async () => {
    setAcceptLanguage('es;q=0.8,fr;q=0.9')
    expect(await resolveForNonLocaleRoute()).toBe('fr')
  })

  it('falls back to default "fr" when Accept-Language lists only unsupported locales ("de")', async () => {
    setAcceptLanguage('de')
    expect(await resolveForNonLocaleRoute()).toBe('fr')
  })

  // ── Priority 4: default locale ────────────────────────────────────────────

  it('resolves to default "fr" when no cookie, no user, and no Accept-Language header', async () => {
    expect(await resolveForNonLocaleRoute()).toBe('fr')
  })

  // ── Priority ordering: cookie wins over DB language ───────────────────────

  it('prefers NEXT_LOCALE cookie ("en") over authenticated user DB language ("es")', async () => {
    setCookie('en')
    setupSupabase({ user: { id: 'u1' }, language: 'es' })
    expect(await resolveForNonLocaleRoute()).toBe('en')
  })
})

// ---------------------------------------------------------------------------
// [locale] route passthrough — requestLocale is provided by the segment
// ---------------------------------------------------------------------------

describe('getRequestConfig — [locale] route passthrough', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    noCookie()
    noAcceptLanguage()
    setupSupabase({ user: null })
  })

  it('returns "en" directly without calling resolveLocaleFromContext', async () => {
    expect(await resolveForLocaleRoute('en')).toBe('en')
  })

  it('returns "es" directly without calling resolveLocaleFromContext', async () => {
    expect(await resolveForLocaleRoute('es')).toBe('es')
  })

  it('falls through to resolveLocaleFromContext when locale segment is unsupported ("de")', async () => {
    // 'de' fails isValidLocale → resolveLocaleFromContext runs → no signals → default 'fr'
    expect(await resolveForLocaleRoute('de')).toBe('fr')
  })
})
