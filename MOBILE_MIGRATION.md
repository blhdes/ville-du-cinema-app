# Ville du Cinéma — Mobile Migration: Honest Take

## Is the app ready?

Almost, but not quite. The app is well-structured — clean hooks, proper TypeScript, good separation of concerns — but it has **zero tests** and some architectural coupling to Next.js/browser APIs that need addressing first. A "little bit of check" is accurate: you'd need to stabilize what you have (add key tests, fix any edge cases) before porting, but the codebase is healthy enough that it's not a blocker.

---

## The real question: which framework?

**Expo (React Native) — and it's not close.**

### Why Expo

- **~70% of your logic is portable as-is.** Your custom hooks (`useUser`, `useProfile`, `useUserLists`, `useDisplayPreferences`), your TypeScript types, your API call patterns — all of that carries over directly. You're not starting from zero.

- **Supabase has a first-class React Native SDK.** Your auth flow, database queries, and storage all translate cleanly. You just swap `@supabase/ssr` for the mobile client.

- **Expo gives you native feel without the pain.** Native navigation transitions, haptic feedback, native image handling, push notifications — all the things that make a cinephile app feel *premium* rather than a wrapped website.

- **Your i18n is already clean.** The `next-intl` message files (FR/EN/ES) port directly to `react-i18next` or `expo-localization`.

### Why NOT Capacitor

Your app has a newspaper/editorial aesthetic (Playfair Display, EB Garamond, the masthead layout). In a Capacitor WebView, scroll physics feel wrong, transitions feel cheap, and text rendering is subtly off. For a niche cinephile audience that cares about aesthetics, that uncanny valley kills the vibe. Native rendering gets you the buttery scrolling and platform-native typography that matches the premium feel you're going for.

### Why NOT Flutter / full native rewrite

You're a small team, the app is React-based, and you'd throw away all your existing code. Overkill for this scope.

---

## What needs work before migrating

| Area | What to do |
|---|---|
| **Tests** | Add tests for your hooks and API routes — they're the portable core |
| **Auth** | Abstract Supabase auth into a thin wrapper (easy swap between SSR and mobile SDK) |
| **Storage** | Replace `localforage`/`sessionStorage` with an abstraction layer |
| **Image handling** | The canvas-based avatar resizer needs to become `expo-image-manipulator` |
| **UI** | Full rewrite of components from Tailwind to React Native StyleSheet (biggest chunk of work) |

---

## Current app snapshot

| Metric | Value |
|---|---|
| Framework | Next.js 16.1.1 (App Router) + React 19 + TypeScript 5 |
| Components | 23 main components |
| API routes | 10 endpoints |
| Custom hooks | 4 (useUser, useProfile, useDisplayPreferences, useUserLists) |
| Languages | 3 (FR / EN / ES) |
| Backend | Supabase (auth + database + storage) |
| UI | TailwindCSS v4, Lucide icons, custom components |
| Tests | None |
| State management | React hooks + context (no Redux/Zustand) |

---

## Portable vs. needs rewrite

### Portable (~70%)

- Custom hooks and business logic
- TypeScript types and database schema (`types/database.ts`)
- API call patterns and data fetching logic
- i18n translation files (`messages/`)
- Constants and configuration
- Supabase queries and auth logic (with SDK swap)

### Needs rewrite (~30%)

- All UI components (Tailwind → React Native StyleSheet)
- Navigation (Next.js App Router → React Navigation)
- Auth flow (SSR cookies → mobile token storage)
- Image handling (Canvas API → expo-image-manipulator)
- Storage (localStorage/localforage → AsyncStorage)
- Font loading (Google Fonts via Next.js → bundled fonts)

---

## Estimated effort (Expo / React Native)

| Phase | Duration |
|---|---|
| Setup and architecture | 1 week |
| UI component rewrite | 2–3 weeks |
| Auth and navigation | 1 week |
| API integration | 1 week |
| Features and polish | 1–2 weeks |
| Testing and deployment | 1 week |
| **Total** | **6–8 weeks** |

---

## Bottom line

The app is in good shape for this. The architecture decisions already made (hooks-based logic, API routes, typed Supabase schema) are exactly what makes a React Native migration smooth. Expo is the right call — it gives you native feel, code reuse, and a solo-dev-friendly workflow.
