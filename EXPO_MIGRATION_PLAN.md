# Village du Cinéma — Expo Migration Plan

> Step-by-step guide from the hardened Next.js web app to a published Expo (React Native) mobile app.
> Every command is copy-pasteable. Each step explains what it does in plain language.

---

## Current state

| Item | Status |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript 5 |
| Auth & DB | Supabase |
| Storage abstraction | lib/storage.ts (wraps localforage) |
| Type safety | Strict TypeScript, 0 errors |
| i18n | fr / en / es — key sets identical |
| Tests | None yet — Phase 1 adds them |

**Branch flow:**
`feature/pre-migration-hardening` → `feature/expo-setup` → `feature/expo-navigation` → `feature/expo-ui` → `feature/expo-polish`

Mobile project lives in a sibling folder: `ville-du-cinema-mobile/` (separate directory, not a monorepo).

---

## Phase 1 — Tests
**Branch:** `feature/pre-migration-hardening` (current)
**Goal:** Add a test suite for the portable core before touching any migration code.
**Why:** The hooks are the most complex logic. Tests catch breakage early and document expected behavior.

### Step 1 — Install Vitest

> Vitest is a fast test runner that understands TypeScript and React out of the box.

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

What each package does:
- `vitest` — runs your tests
- `@vitejs/plugin-react` — teaches Vitest about React components and hooks
- `jsdom` — simulates a browser window so hooks can run in Node.js
- `@testing-library/react` — renders hooks and components in tests
- `@testing-library/jest-dom` — adds matchers like `expect(...).toBeInTheDocument()`

### Step 2 — Configure Vitest

Create `vitest.config.ts` in the project root:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

### Step 3 — Write tests

Create a `__tests__/` folder. Files to write:

| File | What it tests |
|---|---|
| `__tests__/storage.test.ts` | lib/storage.ts — getItem, setItem, removeItem |
| `__tests__/useUserLists.test.ts` | Guest mode: add/remove/load users via storage |
| `__tests__/useDisplayPreferences.test.ts` | Optimistic updates, 3-col restriction logic |

**Key mocking patterns:**

```ts
// Mock lib/storage.ts
vi.mock('@/lib/storage', () => ({
  default: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock next-intl
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
```

### Step 4 — Verify and merge

```bash
npm run test        # all tests green
npm run typecheck   # zero TypeScript errors
npm run build       # clean production build
git add -A && git commit -m "feat: Add Vitest + hook tests"
git push origin feature/pre-migration-hardening
# Open PR → merge into main
```

---

## Phase 2 — Expo Project Setup
**Branch:** `feature/expo-setup` (on the web repo, for tracking)
**Goal:** Scaffold the Expo app and copy the portable core.

### Step 1 — Scaffold

> Expo is the toolkit for building React Native apps. Think of it as Next.js for mobile.

```bash
cd ..   # go up one level from ville-du-cinema-app
npx create-expo-app ville-du-cinema-mobile --template blank-typescript
cd ville-du-cinema-mobile
```

### Step 2 — Copy the portable core

These files work on mobile with zero or minimal changes:

```bash
cp -r ../ville-du-cinema-app/types ./
cp -r ../ville-du-cinema-app/constants ./
cp -r ../ville-du-cinema-app/messages ./
mkdir -p hooks lib
cp ../ville-du-cinema-app/hooks/useUser.ts ./hooks/
cp ../ville-du-cinema-app/hooks/useProfile.ts ./hooks/
cp ../ville-du-cinema-app/hooks/useUserLists.ts ./hooks/
cp ../ville-du-cinema-app/hooks/useDisplayPreferences.ts ./hooks/
cp ../ville-du-cinema-app/lib/storage.ts ./lib/
```

What each directory contains:
- `types/` — TypeScript types for the DB and API (identical on mobile)
- `constants/` — Filmmaker quotes + discovery users (identical)
- `messages/` — fr/en/es translation strings (identical)
- `hooks/` — business logic (mostly identical, small adjustments for imports)

### Step 3 — Install mobile dependencies

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store
npx expo install expo-image-picker expo-image-manipulator expo-font
npm install react-i18next i18next
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

### Step 4 — Swap lib/storage.ts (localforage → AsyncStorage)

> On mobile, IndexedDB doesn't exist. AsyncStorage is the React Native equivalent.

Replace the contents of `lib/storage.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Storage {
  getItem<T>(key: string): Promise<T | null>
  setItem<T>(key: string, value: T): Promise<void>
  removeItem(key: string): Promise<void>
}

const storage: Storage = {
  async getItem<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  },
  async setItem<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key)
  },
}

export default storage
```

The hooks (`useUserLists`, etc.) **don't change at all** — they call `storage.getItem()` not `localforage` directly. That's why the abstraction exists.

### Step 5 — Swap lib/supabase/client.ts

> On mobile, Supabase stores tokens in SecureStore instead of browser cookies.

Create `lib/supabase/client.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import type { Database } from '@/types/database'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

### Step 6 — Create .env file

```
EXPO_PUBLIC_SUPABASE_URL=your_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

> Note: On Expo, public env vars use the `EXPO_PUBLIC_` prefix instead of `NEXT_PUBLIC_`.

### Verification

```bash
npx expo start    # scan QR code with Expo Go app
# App should boot without errors
```

---

## Phase 3 — Navigation & Auth
**Branch:** `feature/expo-navigation`
**Goal:** Set up screen navigation and a working auth flow (login / logout / session persistence).

### Screen structure

```
RootNavigator
├── AuthStack (when logged out)
│   ├── WelcomeScreen      ← landing page with "Sign in" / "Continue as guest"
│   ├── LoginScreen
│   └── SignupScreen
└── AppStack (when logged in or guest)
    ├── FeedScreen          ← main feed (Tab 1)
    ├── ProfileScreen       ← user profile (Tab 2)
    └── SettingsScreen      ← display preferences (Tab 3)
```

### Step 1 — Create the root navigator

> React Navigation is the standard routing library for React Native, like Next.js App Router for mobile.

Create `navigation/RootNavigator.tsx`:

```tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useUser } from '@/hooks/useUser'

const Stack = createNativeStackNavigator()

export function RootNavigator() {
  const { user, isLoading } = useUser()

  if (isLoading) return <SplashScreen />

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="App" component={AppTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

**The `useUser` hook doesn't change** — it listens to `supabase.auth.onAuthStateChange()` which works identically on mobile.

### Step 2 — Auth screens (Login / Signup)

These are native TextInput + Button replacements of the Next.js login/signup pages.
The Supabase calls (`supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`) are identical.

### Verification

```bash
npx expo start
# Test: sign up, log in, log out, restart app → session persists
```

---

## Phase 4 — UI Components
**Branch:** `feature/expo-ui`
**Goal:** Rewrite the 22 Tailwind components as React Native views, screen by screen.

> This is the biggest phase. On mobile, there's no HTML or CSS — everything is React Native components (`View`, `Text`, `Pressable`, `FlatList`, etc.) styled with JavaScript objects instead of class names.

### Design tokens

Create `constants/theme.ts` to replace Tailwind CSS variables:

```ts
export const theme = {
  background: '#fdfaf3',
  foreground: '#1a1a1a',
  accent: '#b22222',
  sepiaDark: '#8c7851',
  cahiersYellow: '#FFD600',
  cahiersRed: '#E63946',
  cahiersBlue: '#2E86AB',
} as const
```

### Font setup

Download Playfair Display and EB Garamond from Google Fonts → save to `assets/fonts/`.

```tsx
// App.tsx
import { useFonts } from 'expo-font'
import { SplashScreen } from 'expo-router'

const [fontsLoaded] = useFonts({
  'PlayfairDisplay-Regular': require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
  'PlayfairDisplay-Bold': require('./assets/fonts/PlayfairDisplay-Bold.ttf'),
  'EBGaramond-Regular': require('./assets/fonts/EBGaramond-Regular.ttf'),
})
```

### Component priority order

Work screen by screen in this order:

| Priority | Screen / Component | Key native equivalent |
|---|---|---|
| 1 | FeedScreen + ReviewCard | `FlatList` with `ScrollView` |
| 2 | WatchNotification | Compact `View` + `Text` |
| 3 | UserList | `FlatList` + `TextInput` |
| 4 | ProfileScreen | `Image` + `TextInput` + `Pressable` |
| 5 | AvatarUploader | `expo-image-picker` + `expo-image-manipulator` |
| 6 | LoginScreen / SignupScreen | `TextInput` + `KeyboardAvoidingView` |
| 7 | SettingsScreen | `Switch` (replaces Toggle), `Picker` (replaces ColumnSelector) |

### Verification

```bash
npx expo start
# Test each screen manually on iOS and Android in Expo Go
```

---

## Phase 5 — Polish & Deploy
**Branch:** `feature/expo-polish`
**Goal:** Final quality pass and App Store / Play Store submission.

### Polish checklist

- [ ] App icon (`assets/icon.png` — 1024×1024px)
- [ ] Splash screen (`assets/splash.png`)
- [ ] Haptic feedback on add/remove user (`expo-haptics`)
- [ ] Pull-to-refresh on feed (`FlatList` `onRefresh` prop)
- [ ] Offline state (show message when no network)
- [ ] Deep links (`villducinema://u/username`)
- [ ] Dark mode (optional — use `useColorScheme` hook)

### Build and submit

> EAS (Expo Application Services) handles building and submitting to app stores.

```bash
npm install -g eas-cli
eas login
eas build:configure      # creates eas.json — answer the prompts

# Build for both platforms
eas build --platform ios      # submits to Apple TestFlight
eas build --platform android  # generates .aab for Play Store

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Summary

| Phase | Branch | Goal | Estimated effort |
|---|---|---|---|
| 1 | feature/pre-migration-hardening | Vitest + hook tests | 1–2 days |
| 2 | feature/expo-setup | Scaffold + copy portable core | 2–3 days |
| 3 | feature/expo-navigation | React Navigation + auth | 3–5 days |
| 4 | feature/expo-ui | All screens + components | 2–3 weeks |
| 5 | feature/expo-polish | Polish + App Store | 1 week |

**Total: 6–8 weeks**

---

## What carries over without changes

These files copy to the mobile project and work as-is:

| File/folder | Why it's portable |
|---|---|
| `types/database.ts` | Pure TypeScript — no browser or Next.js APIs |
| `constants/` | Plain JS arrays and functions |
| `messages/` | Plain JSON translation strings |
| `hooks/useUser.ts` | Only calls `supabase.auth` — works on mobile |
| `hooks/useProfile.ts` | Only calls `fetch()` — works on mobile |
| `hooks/useUserLists.ts` | Calls `storage.*` and `fetch()` — works on mobile |
| `hooks/useDisplayPreferences.ts` | Wraps `useProfile` — works on mobile |

> The storage and Supabase client abstractions (lib/storage.ts, lib/supabase/client.ts) are the only files that need a mobile-specific implementation. Everything else is already portable.
