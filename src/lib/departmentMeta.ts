export type Department =
  | "architecture"
  | "structure"
  | "mep"
  | "procurement"
  | "construction";

export type DeptStatus =
  | "draft" | "internal_review" | "coordination" | "dept_approved" | "issued"
  | "request" | "rfq" | "quotation_received" | "evaluation" | "po_issued" | "delivered"
  | "assigned" | "in_progress" | "inspection" | "site_approved" | "completed"
  | "rejected" | "cancelled";

export type DeptRole = "member" | "reviewer" | "approver";

export const DEPARTMENT_LABELS: Record<Department, string> = {
  architecture: "Architecture",
  structure: "Structural",
  mep: "MEP",
  procurement: "Procurement",
  construction: "Construction",
};

/** Tailwind tone classes (use semantic tokens already defined in index.css). */
export const DEPARTMENT_TONE: Record<Department, { bg: string; fg: string; dot: string }> = {
  architecture: { bg: "bg-info-soft",          fg: "text-info",          dot: "bg-info" },
  structure:    { bg: "bg-warning-soft",       fg: "text-warning",       dot: "bg-warning" },
  mep:          { bg: "bg-success-soft",       fg: "text-success",       dot: "bg-success" },
  procurement:  { bg: "bg-neutral-status-soft", fg: "text-neutral-status", dot: "bg-neutral-status" },
  construction: { bg: "bg-destructive-soft",   fg: "text-destructive",   dot: "bg-destructive" },
};

export const DEPT_ROLE_LABELS: Record<DeptRole, string> = {
  member: "Member",
  reviewer: "Reviewer",
  approver: "Approver",
};

export const DEPT_STATUS_LABELS: Record<DeptStatus, string> = {
  draft: "Draft",
  internal_review: "Internal Review",
  coordination: "Coordination",
  dept_approved: "Approved",
  issued: "Issued",
  request: "Request",
  rfq: "RFQ",
  quotation_received: "Quotation Received",
  evaluation: "Evaluation",
  po_issued: "PO Issued",
  delivered: "Delivered",
  assigned: "Assigned",
  in_progress: "In Progress",
  inspection: "Inspection",
  site_approved: "Site Approved",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** First stage when a task of this department is created. */
export const DEPT_INITIAL_STAGE: Record<Department, DeptStatus> = {
  architecture: "draft",
  structure: "draft",
  mep: "draft",
  procurement: "request",
  construction: "assigned",
};

/** Allowed next stages from the current stage, mirrors the DB trigger. */
export const DEPT_TRANSITIONS: Record<Department, Partial<Record<DeptStatus, DeptStatus[]>>> = {
  architecture: {
    draft: ["internal_review", "cancelled"],
    internal_review: ["coordination", "rejected", "cancelled"],
    coordination: ["dept_approved", "rejected", "cancelled"],
    dept_approved: ["issued", "cancelled"],
    rejected: ["draft", "internal_review"],
  },
  structure: {
    draft: ["internal_review", "cancelled"],
    internal_review: ["coordination", "rejected", "cancelled"],
    coordination: ["dept_approved", "rejected", "cancelled"],
    dept_approved: ["issued", "cancelled"],
    rejected: ["draft", "internal_review"],
  },
  mep: {
    draft: ["internal_review", "cancelled"],
    internal_review: ["coordination", "rejected", "cancelled"],
    coordination: ["dept_approved", "rejected", "cancelled"],
    dept_approved: ["issued", "cancelled"],
    rejected: ["draft", "internal_review"],
  },
  procurement: {
    request: ["rfq", "cancelled"],
    rfq: ["quotation_received", "cancelled"],
    quotation_received: ["evaluation", "cancelled"],
    evaluation: ["po_issued", "rejected", "cancelled"],
    po_issued: ["delivered", "cancelled"],
    rejected: ["rfq", "evaluation"],
  },
  construction: {
    assigned: ["in_progress", "cancelled"],
    in_progress: ["inspection", "cancelled"],
    inspection: ["site_approved", "rejected", "cancelled"],
    site_approved: ["completed", "cancelled"],
    rejected: ["in_progress", "assigned"],
  },
};

/** Stages that require an "approver" role in that department. */
export const APPROVER_STAGES: DeptStatus[] = [
  "dept_approved", "issued", "po_issued", "site_approved",
];

/** Discipline-specific metadata fields rendered in the create/detail forms. */
export interface DisciplineField {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  placeholder?: string;
}

export const DISCIPLINE_FIELDS: Record<Department, DisciplineField[]> = {
  architecture: [
    { key: "drawing_no", label: "Drawing #", type: "text", placeholder: "A-101" },
    { key: "revision",   label: "Revision",  type: "text", placeholder: "Rev. 0" },
  ],
  structure: [
    { key: "drawing_no", label: "Drawing #", type: "text", placeholder: "S-201" },
    { key: "revision",   label: "Revision",  type: "text", placeholder: "Rev. 0" },
  ],
  mep: [
    { key: "drawing_no", label: "Drawing #", type: "text", placeholder: "M-301" },
    { key: "revision",   label: "Revision",  type: "text", placeholder: "Rev. 0" },
  ],
  procurement: [
    { key: "supplier",   label: "Supplier",  type: "text", placeholder: "Supplier name" },
    { key: "po_number",  label: "PO #",      type: "text", placeholder: "PO-0001" },
    { key: "rfq_due",    label: "RFQ due",   type: "date" },
  ],
  construction: [
    { key: "inspection_ref", label: "Inspection ref", type: "text", placeholder: "INS-0001" },
    { key: "lot_no",         label: "Lot #",          type: "text", placeholder: "Lot-12" },
  ],
};
