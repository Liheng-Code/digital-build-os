import { AppRole } from "@/contexts/AuthContext";

export type OrgDepartment =
  | "management"
  | "architecture"
  | "structural"
  | "procurement"
  | "construction"
  | "hr"
  | "account";

export const ORG_DEPARTMENTS: OrgDepartment[] = [
  "management",
  "architecture",
  "structural",
  "procurement",
  "construction",
  "hr",
  "account",
];

export const ORG_DEPT_LABELS: Record<OrgDepartment, string> = {
  management: "Management",
  architecture: "Architecture",
  structural: "Structural",
  procurement: "Procurement",
  construction: "Construction",
  hr: "HR",
  account: "Account",
};

/** Tailwind tone tokens per department (semantic, defined in index.css). */
export const ORG_DEPT_TONE: Record<
  OrgDepartment,
  { headerBg: string; headerFg: string; ringBg: string; chip: string; bar: string }
> = {
  management:   { headerBg: "bg-primary",            headerFg: "text-primary-foreground",     ringBg: "bg-primary/10",          chip: "bg-primary/15 text-primary",                    bar: "bg-primary" },
  architecture: { headerBg: "bg-info",               headerFg: "text-info-foreground",        ringBg: "bg-info/10",             chip: "bg-info-soft text-info",                        bar: "bg-info" },
  structural:   { headerBg: "bg-success",            headerFg: "text-success-foreground",     ringBg: "bg-success/10",          chip: "bg-success-soft text-success",                  bar: "bg-success" },
  procurement:  { headerBg: "bg-warning",            headerFg: "text-warning-foreground",     ringBg: "bg-warning/10",          chip: "bg-warning-soft text-warning",                  bar: "bg-warning" },
  construction: { headerBg: "bg-accent",             headerFg: "text-accent-foreground",      ringBg: "bg-accent/10",           chip: "bg-accent/15 text-accent-foreground",           bar: "bg-accent" },
  hr:           { headerBg: "bg-neutral-status",     headerFg: "text-neutral-status-foreground", ringBg: "bg-neutral-status/10", chip: "bg-neutral-status-soft text-neutral-status",    bar: "bg-neutral-status" },
  account:      { headerBg: "bg-destructive",        headerFg: "text-destructive-foreground", ringBg: "bg-destructive/10",      chip: "bg-destructive-soft text-destructive",          bar: "bg-destructive" },
};

export type OrgLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6";

export interface OrgMember {
  employee_id: string;
  full_name: string;
  position: string;
  department: OrgDepartment;
  level: OrgLevel;
  report_to: string | null;
  email: string;
  phone: string;
  app_role: AppRole;
}

/** Static registry — single source of truth for seed + UI. */
export const ORG_REGISTRY: OrgMember[] = [
  // Management
  { employee_id: "C-0001", full_name: "Liheng",   position: "Managing Director",      department: "management",   level: "L1", report_to: null,     email: "liheng@dcos.com",   phone: "070112233", app_role: "admin" },
  { employee_id: "C-0002", full_name: "Sophat",   position: "General Manager",        department: "management",   level: "L2", report_to: "C-0001", email: "sophat@dcos.com",   phone: "070223344", app_role: "admin" },
  { employee_id: "C-0003", full_name: "Vuthy",    position: "Project Manager",        department: "management",   level: "L3", report_to: "C-0002", email: "vuthy@dcos.com",    phone: "070334455", app_role: "project_manager" },

  // Architecture
  { employee_id: "C-0004", full_name: "Chenda",   position: "Architect Manager",      department: "architecture", level: "L4", report_to: "C-0003", email: "chenda@dcos.com",   phone: "070445566", app_role: "project_manager" },
  { employee_id: "C-0005", full_name: "Pheara",   position: "Architectural Senior",   department: "architecture", level: "L5", report_to: "C-0004", email: "pheara@dcos.com",   phone: "070556677", app_role: "engineer" },
  { employee_id: "C-0006", full_name: "Dany",     position: "Architectural Design-01",department: "architecture", level: "L6", report_to: "C-0005", email: "dany@dcos.com",     phone: "070667788", app_role: "engineer" },
  { employee_id: "C-0007", full_name: "Thida",    position: "Architectural Design-02",department: "architecture", level: "L6", report_to: "C-0005", email: "thida@dcos.com",    phone: "070778899", app_role: "engineer" },

  // Structural
  { employee_id: "C-0008", full_name: "Tangkea",  position: "Structure Manager",      department: "structural",   level: "L4", report_to: "C-0003", email: "tangkea@dcos.com",  phone: "070889900", app_role: "project_manager" },
  { employee_id: "C-0009", full_name: "Dara",     position: "Structure Senior",       department: "structural",   level: "L5", report_to: "C-0008", email: "dara@dcos.com",     phone: "070990011", app_role: "engineer" },
  { employee_id: "C-0010", full_name: "The",      position: "Structure Design-01",    department: "structural",   level: "L6", report_to: "C-0009", email: "the@dcos.com",      phone: "070101122", app_role: "engineer" },
  { employee_id: "C-0011", full_name: "Kosal",    position: "Structure Design-02",    department: "structural",   level: "L6", report_to: "C-0009", email: "kosal@dcos.com",    phone: "070202233", app_role: "engineer" },

  // Procurement
  { employee_id: "C-0012", full_name: "Visal",    position: "Procurement Manager",    department: "procurement",  level: "L4", report_to: "C-0003", email: "visal@dcos.com",    phone: "070303344", app_role: "project_manager" },
  { employee_id: "C-0013", full_name: "Anna",     position: "Procurement Senior",     department: "procurement",  level: "L5", report_to: "C-0012", email: "anna@dcos.com",     phone: "070404455", app_role: "engineer" },
  { employee_id: "C-0014", full_name: "Daros",    position: "Procurement-01",         department: "procurement",  level: "L6", report_to: "C-0013", email: "daros@dcos.com",    phone: "070505566", app_role: "worker" },
  { employee_id: "C-0015", full_name: "Sovvan",   position: "Procurement-02",         department: "procurement",  level: "L6", report_to: "C-0013", email: "sovvan@dcos.com",   phone: "070606677", app_role: "worker" },

  // Construction
  { employee_id: "C-0016", full_name: "Sophal",   position: "Construction Manager",   department: "construction", level: "L4", report_to: "C-0003", email: "sophal@dcos.com",   phone: "070707788", app_role: "project_manager" },
  { employee_id: "C-0017", full_name: "Ratanak",  position: "Construction Senior",    department: "construction", level: "L5", report_to: "C-0016", email: "ratanak@dcos.com",  phone: "070808899", app_role: "supervisor" },
  { employee_id: "C-0018", full_name: "Sokun",    position: "Site Engineer - Architect", department: "construction", level: "L6", report_to: "C-0017", email: "sokun@dcos.com",  phone: "070909900", app_role: "engineer" },
  { employee_id: "C-0019", full_name: "Vannara",  position: "Site Engineer - C&S",    department: "construction", level: "L6", report_to: "C-0017", email: "vannara@dcos.com",  phone: "070111222", app_role: "engineer" },
  { employee_id: "C-0020", full_name: "Bophea",   position: "Site Engineer - MEP",    department: "construction", level: "L6", report_to: "C-0017", email: "bophea@dcos.com",   phone: "070222333", app_role: "engineer" },

  // HR
  { employee_id: "C-0021", full_name: "Kimseng",  position: "HR Manager",             department: "hr",           level: "L4", report_to: "C-0002", email: "kimseng@dcos.com",  phone: "070333444", app_role: "admin" },
  { employee_id: "C-0022", full_name: "Pepsi",    position: "HR Senior",              department: "hr",           level: "L5", report_to: "C-0021", email: "pepsi@dcos.com",    phone: "070444555", app_role: "worker" },
  { employee_id: "C-0023", full_name: "Nalin",    position: "HR-01",                  department: "hr",           level: "L6", report_to: "C-0022", email: "nalin@dcos.com",    phone: "070555666", app_role: "worker" },
  { employee_id: "C-0024", full_name: "Kimly",    position: "HR-02",                  department: "hr",           level: "L6", report_to: "C-0022", email: "kimly@dcos.com",    phone: "070666777", app_role: "worker" },

  // Account
  { employee_id: "C-0025", full_name: "Sovanarith", position: "Account Manager",      department: "account",      level: "L4", report_to: "C-0002", email: "sovanarith@dcos.com", phone: "070777888", app_role: "accountant" },
  { employee_id: "C-0026", full_name: "Sreymom",  position: "Account Senior",         department: "account",      level: "L5", report_to: "C-0025", email: "sreymom@dcos.com",  phone: "070888999", app_role: "accountant" },
  { employee_id: "C-0027", full_name: "Rithy",    position: "Account",                department: "account",      level: "L6", report_to: "C-0025", email: "rithy@dcos.com",    phone: "070999000", app_role: "accountant" },
];

export const DEMO_PASSWORD = "DcosDemo#2026";

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function membersByDepartment(members: OrgMember[] = ORG_REGISTRY) {
  const grouped: Record<OrgDepartment, OrgMember[]> = {
    management: [], architecture: [], structural: [], procurement: [], construction: [], hr: [], account: [],
  };
  members.forEach((m) => grouped[m.department].push(m));
  // Sort by level then employee_id
  Object.keys(grouped).forEach((d) =>
    grouped[d as OrgDepartment].sort((a, b) =>
      a.level === b.level ? a.employee_id.localeCompare(b.employee_id) : a.level.localeCompare(b.level),
    ),
  );
  return grouped;
}
