
-- 1. Departments table
CREATE TABLE IF NOT EXISTS public.org_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  color_token text NOT NULL DEFAULT 'primary',
  icon_key text NOT NULL DEFAULT 'building',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments"
  ON public.org_departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage departments"
  ON public.org_departments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_org_departments_updated_at
  BEFORE UPDATE ON public.org_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Avatar column on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3. Storage bucket for member avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-avatars', 'member-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view member avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-avatars');

CREATE POLICY "Admins can upload member avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'member-avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update member avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'member-avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete member avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'member-avatars' AND public.has_role(auth.uid(), 'admin'));

-- 4. Seed the 7 default departments
INSERT INTO public.org_departments (key, label, color_token, icon_key, sort_order) VALUES
  ('management',   'Management',   'primary',        'building',      1),
  ('architecture', 'Architecture', 'info',           'layout',        2),
  ('structural',   'Structural',   'success',        'wrench',        3),
  ('procurement',  'Procurement',  'warning',        'shopping-cart', 4),
  ('construction', 'Construction', 'accent',         'hard-hat',      5),
  ('hr',           'HR',           'neutral-status', 'users',         6),
  ('account',      'Account',      'destructive',    'calculator',    7)
ON CONFLICT (key) DO NOTHING;
