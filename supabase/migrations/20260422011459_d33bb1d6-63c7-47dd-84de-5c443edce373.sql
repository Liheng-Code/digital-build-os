
-- =========================================================
-- DCOS Iteration 1 — Foundation schema
-- =========================================================

-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'project_manager', 'site_engineer', 'executive');

-- Project status enum
CREATE TYPE public.project_status AS ENUM ('planning', 'design', 'procurement', 'construction', 'handover', 'dlp', 'closed', 'on_hold');

-- ---------- Companies ----------
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ---------- Profiles ----------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  job_title TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------- User roles (separate table — never on profiles) ----------
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ---------- Security definer helpers ----------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND company_id = _company_id
  );
$$;

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ---------- New user trigger ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- Companies RLS ----------
CREATE POLICY "Members view their company" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.get_user_company(auth.uid()));

CREATE POLICY "Authenticated users can create a company" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins update their company" ON public.companies
  FOR UPDATE TO authenticated
  USING (id = public.get_user_company(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- ---------- Profiles RLS ----------
CREATE POLICY "View profiles in same company" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- ---------- user_roles RLS ----------
CREATE POLICY "View roles in same company" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Self-assign first role allowed" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (company_id = public.get_user_company(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins manage company roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Core WBS Hierarchy
-- =========================================================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  location TEXT,
  contract_value NUMERIC(18,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  status public.project_status NOT NULL DEFAULT 'planning',
  progress_pct NUMERIC(5,2) DEFAULT 0,
  project_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sequence INT DEFAULT 0,
  start_date DATE, end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  elevation_m NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  area_sqm NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES public.phases(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  progress_pct NUMERIC(5,2) DEFAULT 0,
  start_date DATE, end_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Hierarchy security helpers ----------
CREATE OR REPLACE FUNCTION public.user_in_project(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project_id
      AND p.company_id = public.get_user_company(_user_id)
  );
$$;

-- ---------- Projects RLS ----------
CREATE POLICY "Members view company projects" ON public.projects
  FOR SELECT TO authenticated USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Admins/PMs create projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company(auth.uid())
              AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')));

CREATE POLICY "Admins/PMs update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company(auth.uid())
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')));

CREATE POLICY "Admins delete projects" ON public.projects
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- ---------- Generic hierarchy RLS (project-scoped) ----------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['phases','disciplines','buildings'] LOOP
    EXECUTE format($f$
      CREATE POLICY "View %1$s in company" ON public.%1$s
        FOR SELECT TO authenticated
        USING (public.user_in_project(auth.uid(), project_id));
      CREATE POLICY "Manage %1$s if PM/admin" ON public.%1$s
        FOR ALL TO authenticated
        USING (public.user_in_project(auth.uid(), project_id)
               AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')))
        WITH CHECK (public.user_in_project(auth.uid(), project_id)
               AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')));
    $f$, t);
  END LOOP;
END $$;

-- Levels (via building)
CREATE POLICY "View levels" ON public.levels FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.buildings b WHERE b.id = building_id AND public.user_in_project(auth.uid(), b.project_id)));
CREATE POLICY "Manage levels" ON public.levels FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.buildings b WHERE b.id = building_id AND public.user_in_project(auth.uid(), b.project_id))
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.buildings b WHERE b.id = building_id AND public.user_in_project(auth.uid(), b.project_id))
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')));

-- Zones (via level)
CREATE POLICY "View zones" ON public.zones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.levels l JOIN public.buildings b ON b.id = l.building_id
                 WHERE l.id = level_id AND public.user_in_project(auth.uid(), b.project_id)));
CREATE POLICY "Manage zones" ON public.zones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.levels l JOIN public.buildings b ON b.id = l.building_id
                 WHERE l.id = level_id AND public.user_in_project(auth.uid(), b.project_id))
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.levels l JOIN public.buildings b ON b.id = l.building_id
                 WHERE l.id = level_id AND public.user_in_project(auth.uid(), b.project_id))
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')));

-- Rooms (via zone)
CREATE POLICY "View rooms" ON public.rooms FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.zones z JOIN public.levels l ON l.id = z.level_id
                 JOIN public.buildings b ON b.id = l.building_id
                 WHERE z.id = zone_id AND public.user_in_project(auth.uid(), b.project_id)));
CREATE POLICY "Manage rooms" ON public.rooms FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.zones z JOIN public.levels l ON l.id = z.level_id
                 JOIN public.buildings b ON b.id = l.building_id
                 WHERE z.id = zone_id AND public.user_in_project(auth.uid(), b.project_id))
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.zones z JOIN public.levels l ON l.id = z.level_id
                 JOIN public.buildings b ON b.id = l.building_id
                 WHERE z.id = zone_id AND public.user_in_project(auth.uid(), b.project_id))
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')));

-- Tasks
CREATE POLICY "View tasks in company" ON public.tasks FOR SELECT TO authenticated
  USING (public.user_in_project(auth.uid(), project_id));
CREATE POLICY "PM/admin manage tasks" ON public.tasks FOR ALL TO authenticated
  USING (public.user_in_project(auth.uid(), project_id)
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')))
  WITH CHECK (public.user_in_project(auth.uid(), project_id)
         AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'project_manager')));
CREATE POLICY "Site engineer updates own tasks" ON public.tasks FOR UPDATE TO authenticated
  USING (public.user_in_project(auth.uid(), project_id) AND assigned_to = auth.uid());
