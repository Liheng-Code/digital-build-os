// Seed the 27-person DCOS organization chart as real auth users + profiles + roles.
// Idempotent: re-running updates passwords, profile metadata, and ensures roles.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole =
  | "admin" | "project_manager" | "engineer" | "supervisor"
  | "worker" | "qaqc_inspector" | "accountant";

const DEMO_PASSWORD = "DcosDemo#2026";

interface OrgUser {
  employee_id: string; full_name: string; position: string;
  department: string; level: string; report_to: string | null;
  email: string; phone: string; role: AppRole;
}

const ORG_USERS: OrgUser[] = [
  { employee_id: "C-0001", full_name: "Liheng",     position: "Managing Director",      department: "management",   level: "L1", report_to: null,     email: "liheng@dcos.com",     phone: "070112233", role: "admin" },
  { employee_id: "C-0002", full_name: "Sophat",     position: "General Manager",        department: "management",   level: "L2", report_to: "C-0001", email: "sophat@dcos.com",     phone: "070223344", role: "admin" },
  { employee_id: "C-0003", full_name: "Vuthy",      position: "Project Manager",        department: "management",   level: "L3", report_to: "C-0002", email: "vuthy@dcos.com",      phone: "070334455", role: "project_manager" },
  { employee_id: "C-0004", full_name: "Chenda",     position: "Architect Manager",      department: "architecture", level: "L4", report_to: "C-0003", email: "chenda@dcos.com",     phone: "070445566", role: "project_manager" },
  { employee_id: "C-0005", full_name: "Pheara",     position: "Architectural Senior",   department: "architecture", level: "L5", report_to: "C-0004", email: "pheara@dcos.com",     phone: "070556677", role: "engineer" },
  { employee_id: "C-0006", full_name: "Dany",       position: "Architectural Design-01",department: "architecture", level: "L6", report_to: "C-0005", email: "dany@dcos.com",       phone: "070667788", role: "engineer" },
  { employee_id: "C-0007", full_name: "Thida",      position: "Architectural Design-02",department: "architecture", level: "L6", report_to: "C-0005", email: "thida@dcos.com",      phone: "070778899", role: "engineer" },
  { employee_id: "C-0008", full_name: "Tangkea",    position: "Structure Manager",      department: "structural",   level: "L4", report_to: "C-0003", email: "tangkea@dcos.com",    phone: "070889900", role: "project_manager" },
  { employee_id: "C-0009", full_name: "Dara",       position: "Structure Senior",       department: "structural",   level: "L5", report_to: "C-0008", email: "dara@dcos.com",       phone: "070990011", role: "engineer" },
  { employee_id: "C-0010", full_name: "The",        position: "Structure Design-01",    department: "structural",   level: "L6", report_to: "C-0009", email: "the@dcos.com",        phone: "070101122", role: "engineer" },
  { employee_id: "C-0011", full_name: "Kosal",      position: "Structure Design-02",    department: "structural",   level: "L6", report_to: "C-0009", email: "kosal@dcos.com",      phone: "070202233", role: "engineer" },
  { employee_id: "C-0012", full_name: "Visal",      position: "Procurement Manager",    department: "procurement",  level: "L4", report_to: "C-0003", email: "visal@dcos.com",      phone: "070303344", role: "project_manager" },
  { employee_id: "C-0013", full_name: "Anna",       position: "Procurement Senior",     department: "procurement",  level: "L5", report_to: "C-0012", email: "anna@dcos.com",       phone: "070404455", role: "engineer" },
  { employee_id: "C-0014", full_name: "Daros",      position: "Procurement-01",         department: "procurement",  level: "L6", report_to: "C-0013", email: "daros@dcos.com",      phone: "070505566", role: "worker" },
  { employee_id: "C-0015", full_name: "Sovvan",     position: "Procurement-02",         department: "procurement",  level: "L6", report_to: "C-0013", email: "sovvan@dcos.com",     phone: "070606677", role: "worker" },
  { employee_id: "C-0016", full_name: "Sophal",     position: "Construction Manager",   department: "construction", level: "L4", report_to: "C-0003", email: "sophal@dcos.com",     phone: "070707788", role: "project_manager" },
  { employee_id: "C-0017", full_name: "Ratanak",    position: "Construction Senior",    department: "construction", level: "L5", report_to: "C-0016", email: "ratanak@dcos.com",    phone: "070808899", role: "supervisor" },
  { employee_id: "C-0018", full_name: "Sokun",      position: "Site Engineer - Architect", department: "construction", level: "L6", report_to: "C-0017", email: "sokun@dcos.com",   phone: "070909900", role: "engineer" },
  { employee_id: "C-0019", full_name: "Vannara",    position: "Site Engineer - C&S",    department: "construction", level: "L6", report_to: "C-0017", email: "vannara@dcos.com",    phone: "070111222", role: "engineer" },
  { employee_id: "C-0020", full_name: "Bophea",     position: "Site Engineer - MEP",    department: "construction", level: "L6", report_to: "C-0017", email: "bophea@dcos.com",     phone: "070222333", role: "engineer" },
  { employee_id: "C-0021", full_name: "Kimseng",    position: "HR Manager",             department: "hr",           level: "L4", report_to: "C-0002", email: "kimseng@dcos.com",    phone: "070333444", role: "admin" },
  { employee_id: "C-0022", full_name: "Pepsi",      position: "HR Senior",              department: "hr",           level: "L5", report_to: "C-0021", email: "pepsi@dcos.com",      phone: "070444555", role: "worker" },
  { employee_id: "C-0023", full_name: "Nalin",      position: "HR-01",                  department: "hr",           level: "L6", report_to: "C-0022", email: "nalin@dcos.com",      phone: "070555666", role: "worker" },
  { employee_id: "C-0024", full_name: "Kimly",      position: "HR-02",                  department: "hr",           level: "L6", report_to: "C-0022", email: "kimly@dcos.com",      phone: "070666777", role: "worker" },
  { employee_id: "C-0025", full_name: "Sovanarith", position: "Account Manager",        department: "account",      level: "L4", report_to: "C-0002", email: "sovanarith@dcos.com", phone: "070777888", role: "accountant" },
  { employee_id: "C-0026", full_name: "Sreymom",    position: "Account Senior",         department: "account",      level: "L5", report_to: "C-0025", email: "sreymom@dcos.com",    phone: "070888999", role: "accountant" },
  { employee_id: "C-0027", full_name: "Rithy",      position: "Account",                department: "account",      level: "L6", report_to: "C-0025", email: "rithy@dcos.com",      phone: "070999000", role: "accountant" },
  
  // MEP
  { employee_id: "C-0028", full_name: "Hanko",      position: "MEP Manager",            department: "mep",          level: "L4", report_to: "C-0003", email: "hanko@dcos.com",      phone: "070111111", role: "project_manager" },
  { employee_id: "C-0029", full_name: "Seyha",      position: "MEP Senior",             department: "mep",          level: "L5", report_to: "C-0028", email: "seyha@dcos.com",      phone: "070222222", role: "engineer" },
  { employee_id: "C-0030", full_name: "Samnang",    position: "MEP Design",             department: "mep",          level: "L6", report_to: "C-0029", email: "samnang@dcos.com",    phone: "070333333", role: "engineer" },
  { employee_id: "C-0031", full_name: "Sophea",     position: "MEP Design",             department: "mep",          level: "L6", report_to: "C-0029", email: "sophea@dcos.com",     phone: "070444444", role: "engineer" },
  { employee_id: "C-0032", full_name: "Nita",       position: "MEP Design",             department: "mep",          level: "L6", report_to: "C-0029", email: "nita@dcos.com",       phone: "070555555", role: "engineer" },
  { employee_id: "C-0033", full_name: "Vanchhouy",  position: "MEP Design",             department: "mep",          level: "L6", report_to: "C-0029", email: "vanchhouy@dcos.com",  phone: "070666666", role: "engineer" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existingList, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;
    const byEmail = new Map(existingList.users.map((u) => [u.email?.toLowerCase(), u]));

    const processOne = async (u: OrgUser): Promise<{ employee_id: string; email: string; status: string }> => {
      let userId: string;
      const existing = byEmail.get(u.email.toLowerCase());

      if (existing) {
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
        userId = created!.user.id;
      }

      const { error: profErr } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: u.full_name,
        employee_id: u.employee_id,
        job_title: u.position,
        department: u.department,
        phone: u.phone,
        level: u.level,
        report_to_employee_id: u.report_to,
      });
      if (profErr) throw new Error(`Profile ${u.email}: ${profErr.message}`);

      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: u.role }, { onConflict: "user_id,role" });
      if (roleErr) throw new Error(`Role ${u.email}: ${roleErr.message}`);

      if (u.role !== "worker") {
        await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "worker");
      }

      return { employee_id: u.employee_id, email: u.email, status: existing ? "updated" : "created" };
    };

    // Run in small parallel batches to stay within edge runtime time limits
    const BATCH = 6;
    const results: Array<{ employee_id: string; email: string; status: string }> = [];
    for (let i = 0; i < ORG_USERS.length; i += BATCH) {
      const slice = ORG_USERS.slice(i, i + BATCH);
      const batchResults = await Promise.all(slice.map(processOne));
      results.push(...batchResults);
    }


    return new Response(
      JSON.stringify({ success: true, password: DEMO_PASSWORD, count: results.length, users: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("seed-org-users error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
