
-- 1. Add hierarchy support to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Add Accounting to disciplines (if not exists)
INSERT INTO public.disciplines (code, name, sort_order)
VALUES ('accounting', 'Accounting', 6)
ON CONFLICT (code) DO NOTHING;

-- 3. Update handle_new_user to sync email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  -- Default role: worker (admin must promote later)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'worker');

  RETURN NEW;
END;
$$;

-- 3. Add Accounting to department enum (if it's an enum)
-- Note: In 20260426031824_29c8b15e-3694-4cf8-a38f-efa465f59028.sql, it was defined as an enum.
-- Enums cannot be easily updated inside a transaction or if used in multiple places, 
-- but we can try adding the value.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'department' AND e.enumlabel = 'accounting') THEN
    ALTER TYPE public.department ADD VALUE 'accounting';
  END IF;
EXCEPTION
  WHEN others THEN 
    RAISE NOTICE 'Could not add accounting to department enum, it might already exist or the type is not an enum.';
END $$;

-- 4. Update RLS to allow managers to see their direct reports (redundant but good)
-- Authenticated users can already view all profiles, so no change needed.
