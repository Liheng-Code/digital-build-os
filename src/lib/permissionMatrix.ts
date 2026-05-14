/**
 * DCOS Role & Permission Matrix — keyed by org level (L1–L6).
 * Source of truth synced with docs/04-role-permission-matrix.html.
 */

export type OrgLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6";

export const ORG_LEVELS: OrgLevel[] = ["L1", "L2", "L3", "L4", "L5", "L6"];

export const ORG_LEVEL_LABELS: Record<OrgLevel, string> = {
  L1: "Managing Director",
  L2: "General Manager",
  L3: "Project Manager",
  L4: "Manager",
  L5: "Senior",
  L6: "Staff / Engineer",
};

/** Permission codes shown in the matrix. C/E represented as "CE". */
export type PermCode = "V" | "C" | "E" | "D" | "S" | "A" | "R" | "CE";

export const PERM_LABELS: Record<PermCode, string> = {
  V: "View",
  C: "Create",
  E: "Edit",
  D: "Delete",
  S: "Submit",
  A: "Approve",
  R: "Reject",
  CE: "Create / Edit",
};

/** Tone classes use semantic tokens defined in index.css. */
export const PERM_TONE: Record<PermCode, string> = {
  V: "bg-info-soft text-info",
  C: "bg-success-soft text-success",
  E: "bg-warning-soft text-warning",
  D: "bg-destructive-soft text-destructive",
  S: "bg-primary/15 text-primary",
  A: "bg-success/20 text-success font-extrabold",
  R: "bg-destructive/15 text-destructive",
  CE: "bg-success-soft text-success",
};

export interface PermissionAction {
  action: string;
  /** Per-level granted permission, or null = no access. */
  perms: Record<OrgLevel, PermCode | null>;
}

export interface PermissionModule {
  key: string;
  label: string;
  icon: string;
  subtitle?: string;
  actions: PermissionAction[];
}

const row = (
  action: string,
  l1: PermCode | null, l2: PermCode | null, l3: PermCode | null,
  l4: PermCode | null, l5: PermCode | null, l6: PermCode | null,
): PermissionAction => ({
  action,
  perms: { L1: l1, L2: l2, L3: l3, L4: l4, L5: l5, L6: l6 },
});

export const PERMISSION_MATRIX: PermissionModule[] = [
  {
    key: "task",
    label: "Task Management",
    icon: "📋",
    subtitle: "Full lifecycle",
    actions: [
      row("View Task",    "V", "V", "V", "V", "V", "V"),
      row("Create Task",  "C", "C", "C", "C", null, null),
      row("Assign Task",  "C", "C", "C", "C", null, null),
      row("Update Task",  "E", "E", "E", "E", "E", "E"),
      row("Submit Task",  "S", "S", "S", "S", "S", "S"),
      row("Approve Task", "A", "A", "A", null, null, null),
      row("Reject Task",  "R", "R", "R", null, null, null),
      row("Delete Task",  "D", "D", "D", null, null, null),
    ],
  },
  {
    key: "document",
    label: "Document Control",
    icon: "📄",
    subtitle: "Review & approval gates",
    actions: [
      row("View Document",    "V", "V", "V", "V", "V", "V"),
      row("Upload Document",  "C", "C", "C", "C", "C", null),
      row("Edit Document",    "E", "E", "E", "E", "E", null),
      row("Submit Document",  "S", "S", "S", "S", "S", null),
      row("Approve Document", "A", "A", "A", null, null, null),
      row("Reject Document",  "R", "R", "R", null, null, null),
      row("Delete Document",  "D", "D", null, null, null, null),
    ],
  },
  {
    key: "procurement",
    label: "Procurement (PR / PO)",
    icon: "🛒",
    subtitle: "Purchase control",
    actions: [
      row("Create PR",        "C", "C", "C", "C", "C", null),
      row("Approve PR",       "A", "A", "A", null, null, null),
      row("Create RFQ",       "C", "C", "C", "C", null, null),
      row("Issue PO",         "C", "C", "C", "C", null, null),
      row("Approve PO",       "A", "A", null, null, null, null),
      row("View Procurement", "V", "V", "V", "V", "V", "V"),
    ],
  },
  {
    key: "construction",
    label: "Construction / Site",
    icon: "🏗️",
    subtitle: "Daily reporting & progress",
    actions: [
      row("Create Daily Report", "C", "C", "C", "C", "C", "C"),
      row("Update Progress",     "E", "E", "E", "E", "E", "E"),
      row("Submit Report",       "S", "S", "S", "S", "S", "S"),
      row("Approve Report",      "A", "A", "A", null, null, null),
    ],
  },
  {
    key: "qaqc",
    label: "QA / QC",
    icon: "✅",
    subtitle: "Inspection & NCR lifecycle",
    actions: [
      row("Create Inspection",  "C", "C", "C", "C", "C", null),
      row("Submit Inspection",  "S", "S", "S", "S", "S", null),
      row("Approve Inspection", "A", "A", "A", null, null, null),
      row("Create NCR",         "C", "C", "C", "C", null, null),
      row("Close NCR",          "A", "A", "A", null, null, null),
    ],
  },
  {
    key: "hr",
    label: "HR Module",
    icon: "👥",
    subtitle: "Staff & leave management",
    actions: [
      row("View Staff",     "V", "V", "V", "V", "V", null),
      row("Manage Staff",   "CE", "CE", null, null, null, null),
      row("Approve Leave",  "A", "A", "A", "A", null, null),
      row("Submit Leave",   "S", "S", "S", "S", "S", "S"),
    ],
  },
  {
    key: "finance",
    label: "Account / Finance",
    icon: "💰",
    subtitle: "Invoicing & payments",
    actions: [
      row("View Financial",   "V", "V", "V", null, null, null),
      row("Create Invoice",   "C", "C", "C", "C", null, null),
      row("Approve Payment",  "A", "A", null, null, null, null),
      row("Edit Financial",   "E", "E", null, null, null, null),
    ],
  },
];

export const APPROVAL_NOTES = [
  { title: "Approval Authority", text: "Task / Document / PR → L3 required · PO → L2 · Payment → L1 · NCR Close → L3" },
  { title: "Data Visibility", text: "L1 all data · L2 all projects · L3 assigned projects · L4 department + project · L5 assigned tasks · L6 own tasks" },
  { title: "Task Flow Authority", text: "L6 Submit → L5 Review → L4 Validate → L3 Approve" },
];

/** Returns all actions (with module label) granted at a given level. */
export function getActionsForLevel(level: OrgLevel) {
  const out: { module: string; icon: string; action: string; perm: PermCode }[] = [];
  PERMISSION_MATRIX.forEach((mod) => {
    mod.actions.forEach((a) => {
      const p = a.perms[level];
      if (p) out.push({ module: mod.label, icon: mod.icon, action: a.action, perm: p });
    });
  });
  return out;
}

/** Lightweight check used by future gating: does this level have permission `code` for this action? */
export function levelCan(level: OrgLevel, moduleKey: string, action: string, code?: PermCode): boolean {
  const mod = PERMISSION_MATRIX.find((m) => m.key === moduleKey);
  if (!mod) return false;
  const a = mod.actions.find((x) => x.action.toLowerCase() === action.toLowerCase());
  if (!a) return false;
  const granted = a.perms[level];
  if (!granted) return false;
  return code ? granted === code || (granted === "CE" && (code === "C" || code === "E")) : true;
}
