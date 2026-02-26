# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

No test suite exists yet. There is no `test` script.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

The app runs in **guest mode** (localforage only) if these are absent. See `SETUP.md` for full Supabase schema, storage bucket, and auth configuration.

## Architecture

**Village du Cinéma** is a Next.js 16 (App Router) + React 19 + TypeScript app. It aggregates Letterboxd RSS feeds into an editorial-style cinema magazine.

### Routing

- `app/[locale]/` — all main UI routes (fr/en/es locale prefix, default: `fr`)
- `app/u/[username]/` — public profile pages (no locale prefix, outside i18n middleware)
- `app/api/` — API routes (also outside i18n middleware)
- `middleware.ts` — runs i18n + Supabase session refresh; API and `/u/` paths bypass i18n

### Data Flow

Two storage tiers:

1. **Guest mode**: `localforage` (IndexedDB) via `lib/storage.ts` (abstraction) → `hooks/useUserLists.ts`
2. **Authenticated mode**: Supabase (`user_data` table) via `/api/lists`, `/api/profile`, etc.

`MigrationModal` handles the transition when a guest logs in (moves localforage data → Supabase).

### Core Hooks

All hooks are client-side only (`'use client'`):

| Hook | Purpose |
|------|---------|
| `useUser` | Supabase auth state |
| `useProfile` | Full user profile via `/api/profile` |
| `useUserLists` | Followed Letterboxd users (guest + auth) |
| `useDisplayPreferences` | UI preferences (sidebar, grid, watch notifications) with optimistic updates |

`useDisplayPreferences` wraps `useProfile` and maps camelCase ↔ snake_case for the API.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/feed` | GET | Fetches + merges Letterboxd RSS feeds; 50 items/page; 1-hour revalidation |
| `/api/lists` | GET/POST/DELETE | Followed users CRUD |
| `/api/lists/reorder` | POST | Reorder followed users |
| `/api/profile` | GET/PATCH | Profile read/update |
| `/api/profile/display` | PATCH | Display preferences |
| `/api/profile/avatar` | POST/DELETE | Avatar upload/remove |
| `/api/profile/check-username` | GET | Username availability |
| `/api/profile/public` | GET | Public profile (unauthenticated) |
| `/api/auth/callback` | GET | Supabase OAuth callback |
| `/api/validate-user` | GET | Validate Letterboxd username exists |

### i18n

`next-intl` with locales `fr` (default), `en`, `es`. Translation files in `messages/`. Use the `Link`, `redirect`, `usePathname`, `useRouter` exports from `@/i18n/routing` (not `next/navigation`) for locale-aware navigation.

### Supabase Client Setup

- `lib/storage.ts` — typed `Storage` interface wrapping `localforage` (`getItem`/`setItem`/`removeItem`); swap the implementation here without touching hooks
- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server-side client (for API routes)
- `lib/supabase/middleware.ts` — session refresh helper called by `middleware.ts`
- `lib/letterboxd/validate.ts` — validates that a Letterboxd username exists (used by `/api/validate-user`)

### Design System

Cahiers du Cinéma brutalist aesthetic. CSS variables defined in `app/globals.css`:

| Variable | Value | Usage |
|----------|-------|-------|
| `--background` | `#fdfaf3` | Aged paper cream |
| `--foreground` | `#1a1a1a` | Near black |
| `--sepia-light` | `#f4efdf` | Card backgrounds |
| `--sepia-dark` | `#8c7851` | Secondary text |
| `--accent` | `#b22222` | Editorial red |

Tailwind v4 is used with `@theme inline` mapping these variables. The Cahiers yellow (`#FFD600`), red (`#E63946`), and blue (`#2E86AB`) appear as inline Tailwind classes on interactive elements (buttons, shadows). Fonts: Playfair Display (headings, `font-serif`) and EB Garamond (body, `font-body`).

### Key Types

`types/database.ts` contains all database and API types. Key types:
- `UserData` — full Supabase row
- `UserProfile` — API response shape
- `PublicProfile` — unauthenticated public view
- `FollowedUser` — `{ username, display_name?, added_at }`
- `DisplayPreferences` — `{ hide_userlist_main, feed_grid_columns, hide_watch_notifications }`

## Conventions

- **Naming**: `snake_case` for all database fields; `camelCase` for TypeScript and React
- **API routes**: always return a typed JSON response with an appropriate HTTP status code
- **TypeScript**: the project uses strict mode — no implicit `any`, no type assertions without justification
- **Never** expose Supabase keys (anon key, service role key) in client-side code or logs

### Feed Item Types

`Review` (from `app/api/feed/route.ts`) has `type: 'review' | 'watch'`. Watch entries are rendered as compact `WatchNotification`; reviews as full `ReviewCard`. Watch entries are filtered out in multi-column grid mode.
