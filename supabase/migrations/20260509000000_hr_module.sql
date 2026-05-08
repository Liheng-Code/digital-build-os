-- ============================================================
-- MODULE 15: HR MODULE
-- Aligned with DCOS System Architecture Module Design R0
-- Section 20: Module 15 — HR Module
-- ============================================================

-- 1. HR Enums
CREATE TYPE public.leave_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.leave_type_code AS ENUM ('annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'compassionate', 'study', 'unpaid', 'other');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'half_day', 'holiday', 'on_leave');
CREATE TYPE public.employment_status AS ENUM ('active', 'probation', 'inactive', 'terminated');

-- 2. Employee Profile Extension
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employment_status public.employment_status DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;

-- 3. Leave Types Master
CREATE TABLE IF NOT EXISTS public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code public.leave_type_code NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  default_days_per_year NUMERIC(5,1) DEFAULT 0,
  is_paid BOOLEAN DEFAULT true,
  requires_attachment BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  min_days NUMERIC(4,1) DEFAULT 0.5,
  max_consecutive_days NUMERIC(4,1),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default leave types
INSERT INTO public.leave_types (code, name, description, default_days_per_year, is_paid, requires_attachment, sort_order) VALUES
  ('annual', 'Annual Leave', 'Regular paid annual leave', 18, true, false, 1),
  ('sick', 'Sick Leave', 'Medical and health-related leave', 15, true, false, 2),
  ('personal', 'Personal Leave', 'Personal or family matters', 5, true, false, 3),
  ('maternity', 'Maternity Leave', 'Maternity/parental leave', 90, true, true, 4),
  ('paternity', 'Paternity Leave', 'Paternity leave', 10, true, true, 5),
  ('bereavement', 'Bereavement Leave', 'Family bereavement', 5, true, false, 6),
  ('compassionate', 'Compassionate Leave', 'Compassionate circumstances', 5, true, false, 7),
  ('study', 'Study Leave', 'Professional development and exams', 10, true, true, 8),
  ('unpaid', 'Unpaid Leave', 'Leave without pay', 30, false, false, 9),
  ('other', 'Other', 'Other leave types', 0, false, false, 10)
ON CONFLICT (code) DO NOTHING;

-- 4. Leave Balances
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  total_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  used_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  pending_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  carried_over_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, leave_type_id, year)
);

-- 5. Leave Requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC(4,1) NOT NULL,
  reason TEXT NOT NULL,
  status public.leave_status NOT NULL DEFAULT 'draft',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  attachment_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

-- 6. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIME,
  clock_out TIME,
  status public.attendance_status NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 7. Holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_id ON public.leave_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON public.attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date ON public.attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);

-- 9. RLS
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Leave Types: everyone can read
CREATE POLICY "Allow read leave_types" ON public.leave_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin insert leave_types" ON public.leave_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow admin update leave_types" ON public.leave_types FOR UPDATE USING (auth.role() = 'authenticated');

-- Leave Balances: own or admin
CREATE POLICY "Allow read own leave_balances" ON public.leave_balances FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Allow admin insert leave_balances" ON public.leave_balances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow admin update leave_balances" ON public.leave_balances FOR UPDATE USING (auth.role() = 'authenticated');

-- Leave Requests: own or admin
CREATE POLICY "Allow read own leave_requests" ON public.leave_requests FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Allow insert own leave_requests" ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update own draft leave_requests" ON public.leave_requests FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Allow delete own draft leave_requests" ON public.leave_requests FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

-- Attendance Records: own or admin
CREATE POLICY "Allow read own attendance" ON public.attendance_records FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Allow insert own attendance" ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update own attendance" ON public.attendance_records FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- Holidays: all authenticated can read
CREATE POLICY "Allow read holidays" ON public.holidays FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin insert holidays" ON public.holidays FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow admin update holidays" ON public.holidays FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin delete holidays" ON public.holidays FOR DELETE USING (auth.role() = 'authenticated');

-- 10. Auto-allocate annual leave balance for new users
CREATE OR REPLACE FUNCTION public.auto_allocate_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_leave_type_id UUID;
  v_default_days NUMERIC(5,1);
BEGIN
  FOR v_leave_type_id, v_default_days IN
    SELECT id, default_days_per_year FROM public.leave_types WHERE is_paid AND default_days_per_year > 0
  LOOP
    INSERT INTO public.leave_balances (user_id, leave_type_id, year, total_days)
    VALUES (NEW.id, v_leave_type_id, EXTRACT(YEAR FROM CURRENT_DATE), v_default_days)
    ON CONFLICT (user_id, leave_type_id, year) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Updated_at triggers
CREATE OR REPLACE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
