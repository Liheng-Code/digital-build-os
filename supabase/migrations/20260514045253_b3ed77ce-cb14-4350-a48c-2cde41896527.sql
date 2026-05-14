ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS report_to_employee_id text,
  ADD COLUMN IF NOT EXISTS level text;

CREATE INDEX IF NOT EXISTS profiles_employee_id_idx ON public.profiles(employee_id);
CREATE INDEX IF NOT EXISTS profiles_department_idx ON public.profiles(department);