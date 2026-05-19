import { supabase } from "@/integrations/supabase/client";

export interface OrgDepartmentRow {
  id: string;
  key: string;
  label: string;
  color_token: string;
  icon_key: string;
  sort_order: number;
  is_active: boolean;
}

export interface OrgMemberRow {
  id: string;
  full_name: string;
  employee_id: string | null;
  job_title: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  hire_date: string | null;
  employment_status: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  avatar_url: string | null;
  report_to_employee_id: string | null;
  level: string | null;
  roles: string[];
  telegram_username?: string | null;
}


export const fetchOrgDepartments = async (): Promise<OrgDepartmentRow[]> => {
  const { data, error } = await (supabase as any)
    .from("org_departments")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as OrgDepartmentRow[];
};

export const createDepartment = async (input: Omit<OrgDepartmentRow, "id">) => {
  const { error } = await (supabase as any).from("org_departments").insert(input);
  if (error) throw error;
};

export const updateDepartment = async (id: string, patch: Partial<OrgDepartmentRow>) => {
  const { error } = await (supabase as any).from("org_departments").update(patch).eq("id", id);
  if (error) throw error;
};

export const deleteDepartment = async (id: string) => {
  const { error } = await (supabase as any).from("org_departments").delete().eq("id", id);
  if (error) throw error;
};

export const fetchOrgMembers = async (): Promise<OrgMemberRow[]> => {
  const [profilesRes, rolesRes] = await Promise.all([
    (supabase as any).from("profiles").select("*").order("employee_id"),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  const rolesByUser: Record<string, string[]> = {};
  (rolesRes.data ?? []).forEach((r: any) => {
    rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] ?? []), r.role];
  });
  return (profilesRes.data ?? []).map((p: any): OrgMemberRow => ({
    id: p.id,
    full_name: p.full_name,
    employee_id: p.employee_id,
    job_title: p.job_title,
    department: p.department,
    email: p.email,
    phone: p.phone,
    hire_date: p.hire_date,
    employment_status: p.employment_status ?? "active",
    emergency_contact: p.emergency_contact,
    emergency_phone: p.emergency_phone,
    avatar_url: p.avatar_url,
    report_to_employee_id: p.report_to_employee_id,
    level: p.level,
    roles: rolesByUser[p.id] ?? [],
    telegram_username: p.telegram_username,
  }));
};

export const updateMemberProfile = async (id: string, patch: Partial<OrgMemberRow>) => {
  const { error } = await (supabase as any).from("profiles").update(patch).eq("id", id);
  if (error) throw error;
};

export const uploadMemberAvatar = async (memberId: string, file: File): Promise<string> => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${memberId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("member-avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("member-avatars").getPublicUrl(path);
  await updateMemberProfile(memberId, { avatar_url: data.publicUrl });
  return data.publicUrl;
};
