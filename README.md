# Village du Cinéma

> *« Notes on cinematography — A collection of reviews from Letterboxd cinephiles. »*

**Village du Cinéma** is your digital cinema magazine with brutalist aesthetics inspired by *Cahiers du Cinéma*. Aggregate and visualize Letterboxd reviews with a vintage editorial design that turns every visit into a cinematic experience.

[🌐 Live Demo](https://ville-du-cinema-app.vercel.app) | [📖 User Manual](#user-manual) | [🎨 Design](#design--aesthetics)

---

## Why Village du Cinéma?

### The Problem
Letterboxd is amazing, but following multiple cinephiles means opening dozens of profile tabs. What if you could see all their reviews in one personalized feed with an editorial magazine design?

### The Solution
**Village du Cinéma** transforms Letterboxd into your own curated cinema magazine. Select your favorite critics and get an aggregated feed with 1960s *Cahiers du Cinéma* aesthetics.

---

## Key Features

### Personalized Aggregated Feed
- **Aggregate multiple users** from Letterboxd in one feed
- **Smart pagination** with 50 reviews per page
- **Clean visualization** of reviews and watches
- **Reverse chronological order** (most recent first)
- **Multi-column grid mode** (watches filtered out for clean browsing)

### User Accounts & Profiles
- **Guest mode**: works immediately with no sign-up — data stored in-browser (IndexedDB)
- **Sign up / log in** via email to persist your list across devices
- **Public profile page** at `/u/[username]` — shareable with anyone
- **Avatar upload** and display name customization
- **Seamless migration** from guest → authenticated (your list follows you)

### Multilingual (i18n)
- **3 languages**: French (default), English, and Spanish
- **Animated switcher** with elegant dropdown
- **Complete localized content** (UI, messages, errors)

### Brutalist User System
- **Cahiers-style design**: Yellow (#FFD600), red (#E63946), blue (#2E86AB)
- **Thick borders** and brutal offset shadows
- **Collapse/expand** sidebar to save space
- **Random suggestions** of featured cinephiles

### Filmmaker Quotes
- **52 authentic quotes** from legendary directors
- **Weekly automatic rotation**
- Godard, Tarkovsky, Bresson, Hitchcock, Truffaut and more

### Editorial Design
- **Magazine-style layout**: Full-width header/footer, centered content
- **Elegant serif typography** with RGB offset effects
- **Integrated logo**: Simple Offset V with color layers
- **Responsive design** for mobile and desktop
- **Dynamic favicon** generated with Next.js

---

## Design & Aesthetics

### Inspiration: Cahiers du Cinéma
The design is inspired by 1960s French cinema magazines, especially *Cahiers du Cinéma*:

- **Visual brutalism**: Thick borders, offset shadows, flat colors
- **Cahiers palette**: Vibrant yellow, cinematic red, deep blue
- **Editorial typography**: Bold serif with tight tracking
- **Retro effects**: RGB text-shadow simulating vintage offset printing

### Simple Offset Logo
The official logo is a **V** with three displaced color layers (yellow, red, blue) on a white square with black border. It represents:
- The initial of "Village"
- The RGB aesthetic of vintage printing
- The graphic brutalism of the 60s

---

## Installation & Development

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun

### Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/blhdes/ville-du-cinema-app.git
cd ville-du-cinema-app

# 2. Install dependencies
npm install

# 3. Configure environment (optional — see below)
cp .env.example .env.local

# 4. Launch development server
npm run dev
# Visit http://localhost:3000
```

### Environment Variables

The app works in **guest mode** without any environment variables. To enable authentication and cloud sync, create `.env.local` with your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

See `SETUP.md` for the full Supabase schema, storage bucket, and auth configuration.

### Available Scripts

```bash
npm run dev        # Local server at http://localhost:3000
npm run build      # Optimized production build
npm run lint       # Run ESLint
npm run typecheck  # TypeScript type check (tsc --noEmit)
npm run test       # Run Vitest test suite (watch mode)
npm run test:ui    # Vitest browser UI
```

### Project Structure

```
ville-du-cinema-app/
├── app/
│   ├── [locale]/          # Internationalized routes (fr/en/es)
│   │   ├── layout.tsx
│   │   └── page.tsx       # Main page with feed
│   ├── u/[username]/      # Public profile pages (no locale prefix)
│   ├── api/               # API routes (feed, lists, profile, auth)
│   ├── icon.tsx           # Dynamic favicon
│   └── globals.css        # CSS variables & global styles
├── components/            # UI components (Header, Feed, UserList, etc.)
├── hooks/                 # Client-side state hooks
│   ├── useUser.ts         # Auth state (via lib/auth)
│   ├── useProfile.ts      # Full user profile
│   ├── useUserLists.ts    # Followed users (guest + auth)
│   └── useDisplayPreferences.ts
├── lib/
│   ├── auth.ts            # AuthClient interface wrapping Supabase auth
│   ├── storage.ts         # Storage interface wrapping localforage
│   └── supabase/          # Supabase client setup (client/server/middleware)
├── __tests__/             # Vitest test suite (mirrors app/hooks/lib structure)
├── types/
│   └── database.ts        # All database and API types
├── constants/
│   ├── discoveryUsers.ts  # Suggested cinephiles
│   └── filmmakerQuotes.ts # 52 director quotes
├── i18n/
│   ├── routing.ts         # i18n routing config
│   └── request.ts         # i18n request helper
├── messages/              # Translation files (fr.json, en.json, es.json)
└── middleware.ts          # i18n + Supabase session refresh
```

---

## User Manual

### Getting Started

1. **Open the app**: Access [Village du Cinéma](https://ville-du-cinema-app.vercel.app)

2. **Select your language**: Click the language selector (top right) — Français, English, or Español

3. **Add Letterboxd users**:
   - Open the "Cinephile Circles" sidebar panel
   - Enter an exact Letterboxd username (without @)
   - Click **FOLLOW** / **SUIVRE** / **SEGUIR**

4. **Create an account** (optional): Sign up to sync your list across devices and get a public profile at `/u/your-username`

5. **Explore suggestions**: If you have fewer than 5 users you'll see featured cinephile suggestions — click any name to add them instantly

6. **Navigate the feed**: The aggregated feed shows the latest 50 reviews. Use pagination at the bottom or click the header to return to page 1.

### Advanced Features

**Collapse sidebar**: Click the arrow next to "Cinephile Circles" to focus on the feed.

**Remove users**: Hover over a user in your list and click the "−" icon.

**Grid mode**: Switch to multi-column layout in display preferences — watch entries are hidden for a cleaner reading experience.

**Public profile**: After signing up and setting a username, share `/u/your-username` with anyone — no login required to view it.

---

## Deploy on Vercel

```bash
# Push to GitHub, then import at vercel.com/new
# Vercel detects Next.js automatically.
# Add your Supabase environment variables in the Vercel dashboard.
```

---

## Customization

### Theme Colors

CSS variables are defined in `app/globals.css` using Tailwind v4's `@theme inline`:

```css
--background: #fdfaf3;   /* aged paper cream */
--foreground: #1a1a1a;
--accent:     #b22222;   /* editorial red */
--sepia-dark: #8c7851;
```

Cahiers interactive colors (`#FFD600`, `#E63946`, `#2E86AB`) are applied as inline Tailwind classes on buttons and shadows.

### Add Suggested Users

Edit `constants/discoveryUsers.ts`:

```typescript
export const DISCOVERY_USERS = [
  'dvds', 'monicanitro', 'brat',
  // Add more usernames...
]
```

### Change Filmmaker Quotes

Edit `constants/filmmakerQuotes.ts` to add new quotes or authors.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 |
| i18n | next-intl |
| Auth & DB | Supabase |
| Guest storage | localforage (IndexedDB) via `lib/storage.ts` |
| Testing | Vitest + React Testing Library (jsdom) |
| Icons | Lucide React |
| Deploy | Vercel |

---

## Contributing

### Ideas
- Add more languages (Italian, German, Portuguese)
- Dark mode theme
- User statistics (most watched films, average ratings)
- Filters by genre, decade, director
- Export feed as magazine-style PDF

### Process
1. Fork the repository
2. Create your branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes
4. Push and open a Pull Request

---

## License

This project is open source. Feel free to use, modify, and share it.

---

## Credits

**Design & inspiration**: Cahiers du Cinéma, 1960s vintage cinema magazines

**Filmmaker quotes**: Jean-Luc Godard, Andrei Tarkovsky, Robert Bresson, Alfred Hitchcock, François Truffaut, Ingmar Bergman, Agnès Varda, Orson Welles, Federico Fellini, Akira Kurosawa and more.

**Community**: Thanks to all Letterboxd cinephiles who share their reviews.

---

**Village du Cinéma** — *Founded in 2026. A digital magazine for cinephiles.*

*« Cinema is not a spectacle, it is a form of writing. » — Jean Cocteau*
