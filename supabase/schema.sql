-- ============================================
-- Eye Test Dashboard - Supabase Schema
-- ============================================

-- 1. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Manual Rx table (editable manual entries keyed by session_id)
CREATE TABLE IF NOT EXISTS public.manual_rx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  left_sph NUMERIC,
  left_cyl NUMERIC,
  left_axis NUMERIC,
  left_add NUMERIC,
  right_sph NUMERIC,
  right_cyl NUMERIC,
  right_axis NUMERIC,
  right_add NUMERIC,
  updated_by UUID REFERENCES auth.users(id),
  updated_by_email TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.manual_rx ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read manual_rx"
  ON public.manual_rx FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert manual_rx"
  ON public.manual_rx FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update manual_rx"
  ON public.manual_rx FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete manual_rx"
  ON public.manual_rx FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. RPC function to get user role (bypasses RLS as fallback)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Auto-create profile on user signup (admin emails get 'admin' role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IN (
    'nitin.bhatt@lenskart.com',
    'shantanu.chandra@lenskart.com',
    'siddarth.gupta@lenskart.com',
    'harpratap.malhi@lenskart.in'
  ) THEN
    INSERT INTO public.profiles (id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.profiles (id, role) VALUES (NEW.id, 'client');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Storage policy: allow authenticated users to read from Eye_Test_logs bucket
-- Run this in the Supabase dashboard SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('Eye_Test_logs', 'Eye_Test_logs', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "Authenticated users can read Eye_Test_logs"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'Eye_Test_logs' AND auth.role() = 'authenticated');
