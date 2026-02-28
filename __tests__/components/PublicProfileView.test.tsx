import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextIntlClientProvider } from 'next-intl'
import PublicProfileView from '@/app/u/[username]/PublicProfileView'
import ProfileHeader from '@/components/profile/ProfileHeader'
import type { PublicProfile } from '@/types/database'
import enMessages from '@/messages/en.json'
import frMessages from '@/messages/fr.json'
import esMessages from '@/messages/es.json'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Render Link as a plain <a> — avoids next-intl routing internals
vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

// Spy on ProfileHeader so we can assert on received props (test 9)
vi.mock('@/components/profile/ProfileHeader', () => ({
  default: vi.fn(() => <div data-testid="profile-header" />),
}))

// FollowingList is NOT mocked — we rely on its real render to assert on
// i18n text (tests 7–8) and on individual user entries (test 10).

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PROFILE: PublicProfile = {
  username: 'alice',
  display_name: 'Alice Martin',
  avatar_url: null,
  bio: 'Loves Tati.',
  followed_users: [],
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderWithLocale(
  locale: 'en' | 'fr' | 'es',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any,
  profile: PublicProfile = BASE_PROFILE,
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PublicProfileView profile={profile} />
    </NextIntlClientProvider>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PublicProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Renders display_name as the h1
  it('renders display_name as the h1', () => {
    renderWithLocale('en', enMessages)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Alice Martin')
  })

  // 2. Shows @username subtitle when display_name is set
  it('shows @username subtitle when display_name is set', () => {
    renderWithLocale('en', enMessages)
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })

  // 3. Shows @username as h1 when display_name is null
  it('shows @username as h1 when display_name is null', () => {
    renderWithLocale('en', enMessages, { ...BASE_PROFILE, display_name: null })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('@alice')
  })

  // 4. [EN] backToHome link text
  it('[EN] back-to-home link reads "Back to Home"', () => {
    renderWithLocale('en', enMessages)
    expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument()
  })

  // 5. [FR] backToHome link text
  it('[FR] back-to-home link reads "Retour à l\'accueil"', () => {
    renderWithLocale('fr', frMessages)
    expect(screen.getByRole('link', { name: /Retour à l'accueil/i })).toBeInTheDocument()
  })

  // 6. [ES] backToHome link text — sourced from messages/es.json profile.backToHome
  it('[ES] back-to-home link matches es.json profile.backToHome', () => {
    renderWithLocale('es', esMessages)
    expect(
      screen.getByRole('link', { name: new RegExp(esMessages.profile.backToHome, 'i') }),
    ).toBeInTheDocument()
  })

  // 7. [EN] following section label
  it('[EN] following section label matches en.json profile.following', () => {
    renderWithLocale('en', enMessages)
    // FollowingList renders t('followingCount', { count: 0 }) → "Following (0)"
    expect(screen.getByText(new RegExp(enMessages.profile.following, 'i'))).toBeInTheDocument()
  })

  // 8. [FR] following section label
  it('[FR] following section label matches fr.json profile.following', () => {
    renderWithLocale('fr', frMessages)
    // FollowingList renders t('followingCount', { count: 0 }) → "Abonnements (0)"
    expect(screen.getByText(new RegExp(frMessages.profile.following, 'i'))).toBeInTheDocument()
  })

  // 9. Passes profile data to ProfileHeader
  it('passes profile data to ProfileHeader', () => {
    renderWithLocale('en', enMessages)
    const calls = vi.mocked(ProfileHeader).mock.calls
    expect(calls).toHaveLength(1)
    expect(calls[0][0].profile).toMatchObject({
      bio: 'Loves Tati.',
      display_name: 'Alice Martin',
      username: 'alice',
      avatar_url: null,
    })
  })

  // 10. Passes followed_users to FollowingList
  it('passes followed_users to FollowingList', () => {
    const profile: PublicProfile = {
      ...BASE_PROFILE,
      followed_users: [
        { username: 'kubrick', display_name: 'Stanley Kubrick', added_at: '2024-01-01T00:00:00Z' },
      ],
    }
    renderWithLocale('en', enMessages, profile)
    expect(screen.getByText('@kubrick')).toBeInTheDocument()
  })
})
