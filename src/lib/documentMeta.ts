export type DocumentStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "approved"
  | "for_construction"
  | "superseded";

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  reviewing: "Reviewing",
  approved: "Approved",
  for_construction: "For Construction",
  superseded: "Superseded",
};

export const DOCUMENT_TYPE_CONFIG_TABLE = "document_types";

// Fallback seed values. Runtime consumers should read active rows from document_types.
export const DOCUMENT_DISCIPLINES = [
  { value: "GEN", label: "General" },
  { value: "ARC", label: "Architecture" },
  { value: "STR", label: "Structure" },
  { value: "MEP", label: "MEP" },
  { value: "PLB", label: "Plumbing" },
  { value: "ELC", label: "Electrical" },
  { value: "CIV", label: "Civil / Infrastructure" },
  { value: "QAQC", label: "QA/QC" },
  { value: "HSE", label: "Safety" },
  { value: "PRO", label: "Procurement" },
  { value: "CON", label: "Construction" },
];

export interface Transmittal {
  id: string;
  project_id: string;
  transmittal_number: string;
  subject: string;
  sender_id: string;
  recipient_id: string;
  status: string;
  sent_at: string;
  due_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface TransmittalItem {
  id: string;
  transmittal_id: string;
  document_id: string;
  version_id: string;
  purpose: string | null;
}
