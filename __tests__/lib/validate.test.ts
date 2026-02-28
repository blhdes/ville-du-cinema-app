import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateLetterboxdUser } from '@/lib/letterboxd/validate'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchOk(): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status: 200,
  }) as unknown as Promise<Response>
}

function makeFetchError(status: number): Promise<Response> {
  return Promise.resolve({
    ok: false,
    status,
  }) as unknown as Promise<Response>
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// 1. Happy path
// ---------------------------------------------------------------------------

describe('validateLetterboxdUser — success', () => {
  it('returns { exists: true } when fetch resolves with ok:true', async () => {
    vi.mocked(fetch).mockReturnValue(makeFetchOk())

    const result = await validateLetterboxdUser('filmfan')
    expect(result).toEqual({ exists: true })
  })
})

// ---------------------------------------------------------------------------
// 2. URL and method
// ---------------------------------------------------------------------------

describe('validateLetterboxdUser — request shape', () => {
  it('calls the correct Letterboxd RSS URL for the given username', async () => {
    vi.mocked(fetch).mockReturnValue(makeFetchOk())

    await validateLetterboxdUser('filmfan')

    expect(fetch).toHaveBeenCalledWith(
      'https://letterboxd.com/filmfan/rss/',
      expect.anything()
    )
  })

  it('lowercases the username in the URL', async () => {
    vi.mocked(fetch).mockReturnValue(makeFetchOk())

    await validateLetterboxdUser('FilmFan')

    expect(fetch).toHaveBeenCalledWith(
      'https://letterboxd.com/filmfan/rss/',
      expect.anything()
    )
  })

  it('trims whitespace from the username in the URL', async () => {
    vi.mocked(fetch).mockReturnValue(makeFetchOk())

    await validateLetterboxdUser('  filmfan  ')

    expect(fetch).toHaveBeenCalledWith(
      'https://letterboxd.com/filmfan/rss/',
      expect.anything()
    )
  })

  it('calls fetch with method HEAD', async () => {
    vi.mocked(fetch).mockReturnValue(makeFetchOk())

    await validateLetterboxdUser('filmfan')

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(options.method).toBe('HEAD')
  })
})

// ---------------------------------------------------------------------------
// 3. Non-ok HTTP responses
// ---------------------------------------------------------------------------

describe('validateLetterboxdUser — non-ok responses', () => {
  it('returns { exists: false, error: "User not found" } on 404', async () => {
    vi.mocked(fetch).mockReturnValue(makeFetchError(404))

    const result = await validateLetterboxdUser('nobody')
    expect(result).toEqual({ exists: false, error: 'User not found' })
  })

  it('returns { exists: false } on 403', async () => {
    vi.mocked(fetch).mockReturnValue(makeFetchError(403))

    const result = await validateLetterboxdUser('filmfan')
    expect(result.exists).toBe(false)
  })

  it('returns { exists: false } on 500', async () => {
    vi.mocked(fetch).mockReturnValue(makeFetchError(500))

    const result = await validateLetterboxdUser('filmfan')
    expect(result.exists).toBe(false)
  })

  it('returns a non-404 error message for non-404 failures', async () => {
    vi.mocked(fetch).mockReturnValue(makeFetchError(500))

    const result = await validateLetterboxdUser('filmfan')
    expect(result.error).toBe('Failed to validate user')
  })
})

// ---------------------------------------------------------------------------
// 4. Network / thrown errors
// ---------------------------------------------------------------------------

describe('validateLetterboxdUser — fetch throws', () => {
  it('returns { exists: false, error: ... } when fetch throws a network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await validateLetterboxdUser('filmfan')
    expect(result).toEqual({ exists: false, error: 'Failed to validate user' })
  })

  it('returns { exists: false, error: ... } when fetch throws an AbortError (timeout)', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError')
    vi.mocked(fetch).mockRejectedValue(abortError)

    const result = await validateLetterboxdUser('filmfan')
    expect(result).toEqual({ exists: false, error: 'Failed to validate user' })
  })
})

// ---------------------------------------------------------------------------
// 5. Empty / blank username (short-circuits before fetch)
// ---------------------------------------------------------------------------

describe('validateLetterboxdUser — empty username', () => {
  it('returns { exists: false, error: "Username is required" } for empty string', async () => {
    const result = await validateLetterboxdUser('')
    expect(result).toEqual({ exists: false, error: 'Username is required' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns { exists: false, error: "Username is required" } for whitespace-only string', async () => {
    const result = await validateLetterboxdUser('   ')
    expect(result).toEqual({ exists: false, error: 'Username is required' })
    expect(fetch).not.toHaveBeenCalled()
  })
})
