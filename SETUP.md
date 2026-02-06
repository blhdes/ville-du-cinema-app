# Village du Cinéma - Setup Guide

This guide covers the complete setup process for running Village du Cinéma locally and configuring Supabase for authentication and data persistence.

## Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)

## 1. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Supabase Configuration
# Get these from: Project Settings > API > API Keys

# Public (safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Private (server-only, not currently used but reserved)
SUPABASE_SECRET_KEY=your_service_role_key
```

## 2. Supabase Project Setup

### Create a new Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **Project Settings > API** to get your keys

### Database Schema

Run the following SQL in the Supabase SQL Editor (**SQL Editor > New Query**):

```sql
-- Create user_data table
CREATE TABLE IF NOT EXISTS public.user_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_users JSONB DEFAULT '[]'::jsonb,
    avatar_url TEXT,
    bio TEXT DEFAULT '',
    display_name TEXT,
    language VARCHAR(2) DEFAULT 'en',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON public.user_data(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own data
CREATE POLICY "Users can read own data"
    ON public.user_data
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own data
CREATE POLICY "Users can insert own data"
    ON public.user_data
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own data
CREATE POLICY "Users can update own data"
    ON public.user_data
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own data
CREATE POLICY "Users can delete own data"
    ON public.user_data
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.user_data
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
```

### Storage Bucket Setup

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name: `avatars`
4. Check **Public bucket** (for public avatar URLs)
5. Create the bucket

Then run these SQL policies for the bucket:

```sql
-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Authentication Setup

1. Go to **Authentication > Providers**
2. Enable **Email** provider (enabled by default)
3. Configure settings:
   - **Confirm email**: Disable for development, enable for production
   - **Secure email change**: Enable

Optional: Configure OAuth providers (Google, GitHub, etc.) in the same section.

### Site URL Configuration

1. Go to **Authentication > URL Configuration**
2. Set **Site URL** to your app URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add redirect URLs:
   - `http://localhost:3000/api/auth/callback`
   - `https://your-domain.com/api/auth/callback` (production)

## 3. Install Dependencies

```bash
npm install
```

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 5. Verify Setup

1. **Guest Mode**: Add users without logging in (stored in browser's IndexedDB)
2. **Create Account**: Sign up with email/password
3. **Login**: Verify authentication works
4. **Sync**: Check that data persists after refresh when logged in
5. **Migration Modal**: Log out, add users as guest, log in - modal should appear

## Data Model

### user_data Table

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Primary key, references auth.users |
| `followed_users` | JSONB | Array of followed Letterboxd users |
| `avatar_url` | TEXT | URL to user's avatar image |
| `bio` | TEXT | User bio (max 500 chars) |
| `display_name` | TEXT | User display name (max 50 chars) |
| `language` | VARCHAR(2) | Preferred language (en/es/fr) |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### followed_users JSONB Structure

```json
[
  {
    "username": "letterboxd_username",
    "display_name": "Optional Display Name",
    "added_at": "2024-01-01T00:00:00.000Z"
  }
]
```

## Troubleshooting

### "Invalid API key" error
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are correct
- Restart the dev server after changing env variables

### Authentication not working
- Check **Site URL** in Supabase matches your app URL
- Verify redirect URLs include `/api/auth/callback`

### Data not persisting
- Check RLS policies are created correctly
- Verify the user is authenticated (check browser dev tools > Application > Cookies)

### Migration modal not appearing
- Clear browser's sessionStorage (`sessionStorage.clear()`)
- Verify localforage has data (`localforage.getItem('followed_users')`)

## Production Deployment

1. Set environment variables in your hosting platform
2. Update Supabase Site URL to production domain
3. Add production callback URL to Supabase
4. Enable email confirmation in Supabase Authentication settings
