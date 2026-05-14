import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  full_name: string;
  employee_id: string | null;
  job_title: string | null;
  phone: string | null;
  email: string | null;
  department: string | null;
  hire_date: string | null;
  employment_status: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  roles: string[];
  reports_to: string | null;
}

export const fetchEmployees = async (): Promise<Employee[]> => {
  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  const rolesByUser: Record<string, string[]> = {};
  (rolesRes.data ?? []).forEach((r: any) => {
    rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] ?? []), r.role];
  });
  const list: Employee[] = (profilesRes.data ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    employee_id: p.employee_id,
    job_title: p.job_title,
    phone: p.phone,
    email: p.email,
    department: p.department,
    hire_date: p.hire_date,
    employment_status: p.employment_status ?? "active",
    emergency_contact: p.emergency_contact,
    emergency_phone: p.emergency_phone,
    roles: rolesByUser[p.id] ?? [],
    reports_to: p.reports_to,
  }));
  return list;
};

export const updateEmployeeProfile = async (id: string, updates: Record<string, unknown>): Promise<void> => {
  const { error } = await (supabase as any).from("profiles").update(updates).eq("id", id);
  if (error) throw error;
};
