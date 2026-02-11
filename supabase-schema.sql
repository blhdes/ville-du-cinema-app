-- ============================================
-- Ville du Cinéma - Supabase Schema
-- Optimized for Free Tier (single table design)
-- ============================================

-- 1. Create user_data table
CREATE TABLE IF NOT EXISTS public.user_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_users jsonb NOT NULL DEFAULT '[]'::jsonb,
  language text NOT NULL DEFAULT 'fr',
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint to ensure language is valid
  CONSTRAINT valid_language CHECK (language IN ('fr', 'en', 'es'))
);

-- 2. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON public.user_data(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Users can view own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can update own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can delete own data" ON public.user_data;

-- 5. Create RLS Policies
-- Policy: Users can only SELECT their own data
CREATE POLICY "Users can view own data"
  ON public.user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only INSERT their own data
CREATE POLICY "Users can insert own data"
  ON public.user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own data
CREATE POLICY "Users can update own data"
  ON public.user_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only DELETE their own data
CREATE POLICY "Users can delete own data"
  ON public.user_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.user_data;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- VERIFICATION QUERIES (run separately to test)
-- ============================================

-- Check if table was created
-- SELECT * FROM information_schema.tables WHERE table_name = 'user_data';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_data';

-- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'user_data';
