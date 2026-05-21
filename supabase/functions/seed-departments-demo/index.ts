import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SeedUser {
  email: string;
  full_name: string;
  job_title: string;
  app_role: "admin" | "project_manager" | "engineer" | "supervisor" | "worker" | "qaqc_inspector" | "accountant";
}

const APPROVERS: SeedUser[] = [
  { email: "aria.architect@demo.test",     full_name: "Aria Architect",      job_title: "Lead Architect",            app_role: "engineer" },
  { email: "stella.struct@demo.test",      full_name: "Stella Struct",       job_title: "Structural Lead",           app_role: "engineer" },
  { email: "marco.mep@demo.test",          full_name: "Marco MEP",           job_title: "MEP Lead",                  app_role: "engineer" },
  { email: "pierre.proc@demo.test",        full_name: "Pierre Procurement",  job_title: "Procurement Manager",       app_role: "project_manager" },
  { email: "connor.constr@demo.test",      full_name: "Connor Construction", job_title: "Construction Supervisor",   app_role: "supervisor" },
];

const PASSWORD = "Demo1234!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1) Validate caller is admin (using their JWT)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Create / find each approver user
    const summary: Array<{ email: string; status: "created" | "exists" | "error"; user_id?: string; error?: string }> = [];

    for (const u of APPROVERS) {
      try {
        // Check if user already exists by listing (admin API)
        const { data: existing } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        const found = existing?.users.find((x) => x.email === u.email);

        let userId: string;
        let created = false;

        if (found) {
          userId = found.id;
        } else {
          const { data: createRes, error: createErr } = await admin.auth.admin.createUser({
            email: u.email,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: u.full_name },
          });
          if (createErr || !createRes?.user) {
            summary.push({ email: u.email, status: "error", error: createErr?.message ?? "create failed" });
            continue;
          }
          userId = createRes.user.id;
          created = true;
        }

        // Ensure profile (handle_new_user trigger creates one, but be defensive)
        await admin.from("profiles").upsert({
          id: userId,
          full_name: u.full_name,
          job_title: u.job_title,
        }, { onConflict: "id" });

        // Ensure correct app_role (the trigger sets 'worker' by default)
        // First clear existing role rows for this user, then insert the right one.
        const { data: existingRoles } = await admin
          .from("user_roles")
          .select("id, role")
          .eq("user_id", userId);

        const hasTarget = (existingRoles ?? []).some((r) => r.role === u.app_role);
        if (!hasTarget) {
          await admin.from("user_roles").insert({ user_id: userId, role: u.app_role });
        }
        // Remove default 'worker' if a higher role was added
        if (u.app_role !== "worker") {
          await admin
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", "worker");
        }

        summary.push({ email: u.email, status: created ? "created" : "exists", user_id: userId });
      } catch (e) {
        summary.push({ email: u.email, status: "error", error: (e as Error).message });
      }
    }

    // 3) Run the seed_demo_run() RPC (uses caller's JWT so the admin check passes)
    const { data: seedRes, error: seedErr } = await userClient.rpc("seed_demo_run");
    if (seedErr) {
      return new Response(
        JSON.stringify({ users: summary, seed_error: seedErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ users: summary, seed: seedRes, password: PASSWORD }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
