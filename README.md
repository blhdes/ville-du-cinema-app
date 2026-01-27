# 🎬 Village du Cinéma

> *« Notes on cinematography — A collection of reviews from Letterboxd cinephiles. »*

**Village du Cinéma** is your digital cinema magazine with brutalist aesthetics inspired by *Cahiers du Cinéma*. Aggregate and visualize Letterboxd reviews with a vintage editorial design that turns every visit into a cinematic experience.

[🌐 Live Demo](https://ville-du-cinema-app.vercel.app) | [📖 Documentation](#user-manual) | [🎨 Design](#design--aesthetics)

---

## ✨ Why Village du Cinéma?

### The Problem
Letterboxd is amazing, but following multiple cinephiles means opening dozens of profile tabs. What if you could see all their reviews in one personalized feed with an editorial magazine design?

### The Solution
**Village du Cinéma** transforms Letterboxd into your own curated cinema magazine. Select your favorite critics and get an aggregated feed with 1960s Cahiers du Cinéma aesthetics.

---

## 🎯 Key Features

### 📚 Personalized Aggregated Feed
- **Aggregate multiple users** from Letterboxd in one feed
- **Smart pagination** with 50 reviews per page
- **Auto-scroll** when changing pages
- **Clean visualization** of reviews and watches
- **Reverse chronological order** (most recent first)

### 🌍 Multilingual (i18n)
- **3 languages**: French, English, and Spanish
- **Animated switcher** with elegant dropdown
- **Preserves language** throughout navigation
- **Complete localized content** (UI, messages, errors)

### 🎨 Brutalist User System
- **Cahiers-style design**: Yellow (#FFD600), red (#E63946), blue (#2E86AB)
- **Thick borders** and brutal offset shadows
- **Collapse/expand** to save space
- **Random suggestions** of featured cinephiles
- **Visual management** of your cinephile circle

### 💬 Filmmaker Quotes
- **52 authentic quotes** from legendary directors
- **Weekly automatic rotation**
- Godard, Tarkovsky, Bresson, Hitchcock, Truffaut and more

### 🏛️ Editorial Design
- **Magazine-style layout**: Full-width header/footer, centered content
- **Elegant serif typography** with RGB offset effects
- **Integrated logo**: Simple Offset V with color layers
- **Perfect responsive design** on mobile and desktop
- **Dynamic favicon** generated with Next.js

---

## 🎨 Design & Aesthetics

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

## 🚀 Use Cases

### For Cinephiles
- **Create your personal magazine** following your favorite critics
- **Discover new films** through curated reviews
- **Save time** seeing everything in one feed
- **Unique visual experience** that does justice to cinema

### For Critics and Bloggers
- **Promote your work** being part of the suggestions
- **Reach new readers** who follow cinematic circles
- **Editorial context** that elevates your reviews

### For Communities
- **Create collective feeds** for film clubs, friend groups, etc.
- **Share circles** of cinephiles with similar interests
- **Organize thematics** (horror, nouvelle vague, Criterion, etc.)

---

## 📖 User Manual

### Getting Started

1. **Open the app**: Access [Village du Cinéma](https://ville-du-cinema-app.vercel.app)

2. **Select your language**:
   - Click the language selector (top right corner)
   - Choose between Français, English or Español

3. **Add Letterboxd users**:
   - Go to the sidebar panel "Cinephile Circles" (or equivalent in your language)
   - Enter the exact Letterboxd username (without @)
   - Click "FOLLOW" / "SUIVRE" / "SEGUIR"

4. **Explore suggestions**:
   - If you have less than 5 users, you'll see featured cinephile suggestions
   - Click any name to add them instantly

5. **Navigate the feed**:
   - The "Recent Feed" shows the latest 50 aggregated reviews
   - Use pagination buttons at the bottom
   - Click the header to return to page 1

### Advanced Features

**Collapse sidebar panel**:
- Click the arrow next to "Cinephile Circles"
- Useful on small screens or to focus on content

**Remove users**:
- Hover over a user in your list
- Click the "-" icon that appears

**Change language without losing progress**:
- The selector preserves your followed users
- Your position in the feed is maintained

**Reset to page 1**:
- Click the logo or "Village du Cinéma" title
- Reloads the page completely and returns to start

---

## 🛠️ Installation & Development

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm or bun
- Vercel account (optional, for deployment)

### Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/blhdes/ville-du-cinema-app.git
cd ville-du-cinema-app

# 2. Install dependencies
npm install
# or
yarn install
# or
pnpm install

# 3. Launch development server
npm run dev
# or
yarn dev
# or
pnpm dev

# 4. Open your browser
# Visit http://localhost:3000
```

### Environment Variables

No environment variables required for local development. The app works out-of-the-box.

### Project Structure

```
ville-du-cinema-app/
├── app/
│   ├── [locale]/          # Internationalized routes
│   │   ├── layout.tsx     # Layout with i18n metadata
│   │   └── page.tsx       # Main page with feed
│   ├── api/
│   │   └── feed/          # API to aggregate Letterboxd reviews
│   ├── icon.tsx           # Dynamic favicon generation
│   └── apple-icon.tsx     # iOS icon
├── components/
│   ├── Header.tsx         # Header with clickable logo
│   ├── Layout.tsx         # Main layout (footer)
│   ├── Logo.tsx           # Simple Offset SVG logo
│   ├── UserList.tsx       # Brutalist sidebar panel
│   ├── ReviewCard.tsx     # Review cards
│   ├── QuoteOfTheDay.tsx  # Weekly quotes
│   └── LanguageSwitcher.tsx
├── constants/
│   ├── discoveryUsers.ts  # List of suggested cinephiles
│   └── filmmakerQuotes.ts # 52 director quotes
├── i18n/
│   ├── routing.ts         # i18n routing config
│   └── request.ts         # i18n request helper
├── messages/
│   ├── fr.json            # French translations
│   ├── en.json            # English translations
│   └── es.json            # Spanish translations
├── public/logos/          # SVG logo variations
└── middleware.ts          # Automatic i18n routing
```

### Available Scripts

```bash
# Development
npm run dev          # Local server on http://localhost:3000

# Production
npm run build        # Optimized production build
npm start            # Start production server

# Utilities
npm run lint         # Run ESLint
```

---

## 🌐 Deploy on Vercel

### Automatic Deploy (Recommended)

1. **Connect your repository**:
   ```bash
   # Push your code to GitHub
   git push origin main
   ```

2. **Import on Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Click "Deploy"

3. **Automatic configuration**:
   - Vercel detects Next.js automatically
   - No environment variables needed
   - Build completes in ~2 minutes

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 🎨 Customization

### Theme Colors

Edit Cahiers colors in `tailwind.config.ts`:

```javascript
colors: {
  'cahiers-yellow': '#FFD600',
  'cahiers-red': '#E63946',
  'cahiers-blue': '#2E86AB',
}
```

### Add Suggested Users

Edit `constants/discoveryUsers.ts`:

```typescript
export const DISCOVERY_USERS = [
  'dvds', 'monicanitro', 'brat',
  // Add more usernames...
];
```

### Change Filmmaker Quotes

Edit `constants/filmmakerQuotes.ts` to add new quotes or authors.

### Alternative Logo

Explore designs in `public/logos/`:
- `logo-circle.svg` - Vintage circular seal
- `logo-minimal.svg` - Horizontal editorial design
- `logo-brutalist.svg` - Maximum RGB offset
- `logo-blocks.svg` - Abstract Mondrian grid

Change the import in `components/Header.tsx` to use a different logo.

---

## 🤝 Contributing

Want to improve Village du Cinéma? Great!

### Contribution Ideas
- 🌍 Add more languages (Italian, German, Portuguese)
- 🎨 Create theme variations (dark mode, other palettes)
- 📊 User statistics (most watched films, average ratings)
- 🔍 Filters by genre, decade, director
- 💾 Export your feed as magazine-style PDF
- 🔗 Share public feeds with unique URLs

### Process
1. Fork the repository
2. Create your branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **i18n**: next-intl
- **Storage**: LocalForage (client-side)
- **API**: Letterboxd RSS feeds
- **Deploy**: Vercel
- **Icons**: Lucide React

---

## 📜 License

This project is open source. Feel free to use, modify and share it.

---

## 🎬 Credits

**Design & inspiration**: Cahiers du Cinéma, 1960s vintage cinema magazines

**Filmmaker quotes**: Jean-Luc Godard, Andrei Tarkovsky, Robert Bresson, Alfred Hitchcock, François Truffaut, Ingmar Bergman, Agnès Varda, Orson Welles, Federico Fellini, Akira Kurosawa and more.

**Community**: Thanks to all Letterboxd cinephiles who share their reviews.

---

## 📬 Contact

Questions, suggestions or want to share your personalized feed?

- GitHub Issues: [Report bugs or suggest features](https://github.com/blhdes/ville-du-cinema-app/issues)
- Twitter/X: Share screenshots with #VillageDuCinema

---

**Village du Cinéma** — *Founded in 2026. A digital magazine for cinephiles.*

🎬 *« Cinema is not a spectacle, it is a form of writing. » — Jean Cocteau*
