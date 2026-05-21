// Seed demo users — one per role. Idempotent: re-running updates passwords and ensures roles.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole =
  | "admin"
  | "project_manager"
  | "engineer"
  | "supervisor"
  | "worker"
  | "qaqc_inspector"
  | "accountant";

const DEMO_PASSWORD = "Demo1234!";

const DEMO_USERS: Array<{
  email: string;
  full_name: string;
  job_title: string;
  employee_id: string;
  role: AppRole;
}> = [
  { email: "admin@buildtrack.demo",      full_name: "Alex Admin",       job_title: "System Administrator", employee_id: "EMP-001", role: "admin" },
  { email: "pm@buildtrack.demo",         full_name: "Pat Planner",      job_title: "Project Manager",      employee_id: "EMP-002", role: "project_manager" },
  { email: "engineer@buildtrack.demo",   full_name: "Erin Engineer",    job_title: "Site Engineer",        employee_id: "EMP-003", role: "engineer" },
  { email: "supervisor@buildtrack.demo", full_name: "Sam Supervisor",   job_title: "Site Supervisor",      employee_id: "EMP-004", role: "supervisor" },
  { email: "worker@buildtrack.demo",     full_name: "Wes Worker",       job_title: "Field Worker",         employee_id: "EMP-005", role: "worker" },
  { email: "qaqc@buildtrack.demo",       full_name: "Quinn Inspector",  job_title: "QA/QC Inspector",      employee_id: "EMP-006", role: "qaqc_inspector" },
  { email: "accountant@buildtrack.demo", full_name: "Avery Accountant", job_title: "Accountant",           employee_id: "EMP-007", role: "accountant" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const results: Array<{ email: string; role: AppRole; status: string; user_id?: string }> = [];

    // Pull existing users once (cap 1000 — fine for demo seeding)
    const { data: existingList, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;
    const byEmail = new Map(existingList.users.map((u) => [u.email?.toLowerCase(), u]));

    for (const u of DEMO_USERS) {
      let userId: string;
      const existing = byEmail.get(u.email.toLowerCase());

      if (existing) {
        // Reset password + confirm email + refresh metadata
        const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: u.full_name },
        });
        if (updErr) throw new Error(`Update ${u.email}: ${updErr.message}`);
        userId = existing.id;
      } else {
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: u.full_name },
        });
        if (createErr) throw new Error(`Create ${u.email}: ${createErr.message}`);
        userId = created.user.id;
      }

      // Upsert profile (handle_new_user trigger inserts a row on signup, but we want the demo metadata)
      const { error: profErr } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          full_name: u.full_name,
          employee_id: u.employee_id,
          job_title: u.job_title,
        });
      if (profErr) throw new Error(`Profile ${u.email}: ${profErr.message}`);

      // Ensure desired role is present (don't wipe existing roles — just add the demo one)
      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: u.role }, { onConflict: "user_id,role" });
      if (roleErr) throw new Error(`Role ${u.email}: ${roleErr.message}`);

      // For the dedicated demo accounts we also want to remove the auto-assigned 'worker' role
      // for everyone except the worker user, so each demo account has exactly its intended role.
      if (u.role !== "worker") {
        const { error: cleanErr } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "worker");
        if (cleanErr) throw new Error(`Cleanup roles ${u.email}: ${cleanErr.message}`);
      }

      results.push({ email: u.email, role: u.role, status: existing ? "updated" : "created", user_id: userId });
    }

    return new Response(
      JSON.stringify({
        success: true,
        password: DEMO_PASSWORD,
        users: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("seed-demo-users error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
