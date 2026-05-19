// Create a single organization member: auth user + profile + default role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_PASSWORD = "DcosDemo#2026";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      email, password, full_name, employee_id, job_title, department,
      level, report_to_employee_id, reports_to, phone, hire_date, employment_status,
      emergency_contact, emergency_phone, role, telegram_username,
    } = body ?? {};

    if (!email || !full_name) {
      return new Response(JSON.stringify({ success: false, error: "email and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check existing
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;
    const existing = list.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());

    let userId: string;
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: password || DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (createErr) throw new Error(`Create ${email}: ${createErr.message}`);
      userId = created!.user.id;
    }

    const { error: profErr } = await supabase.from("profiles").upsert({
      id: userId,
      full_name,
      employee_id: employee_id || null,
      job_title: job_title || null,
      department: department || null,
      phone: phone || null,
      hire_date: hire_date || null,
      employment_status: employment_status || "active",
      emergency_contact: emergency_contact || null,
      emergency_phone: emergency_phone || null,
      level: level || null,
      report_to_employee_id: report_to_employee_id || null,
      reports_to: reports_to || null,
      email: email || null,
      telegram_username: telegram_username || null,
    });
    if (profErr) throw new Error(`Profile: ${profErr.message}`);

    if (role) {
      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      if (roleErr) throw new Error(`Role: ${roleErr.message}`);
    }

    return new Response(JSON.stringify({ success: true, user_id: userId, existed: !!existing }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-org-member error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
