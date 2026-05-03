export type DsrStatus = "draft" | "submitted" | "approved" | "rejected";
export type DsrSiteStatus = "working" | "partial" | "closed";
export type DsrDelayCategory =
  | "weather" | "material" | "inspection" | "design" | "labor" | "equipment" | "other";
export type DsrSeverity = "low" | "med" | "high";

export const DSR_STATUS_LABELS: Record<DsrStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export const DSR_STATUS_TONE: Record<DsrStatus, { bg: string; fg: string; dot: string }> = {
  draft:     { bg: "bg-neutral-status-soft", fg: "text-neutral-status", dot: "bg-neutral-status" },
  submitted: { bg: "bg-info-soft",           fg: "text-info",           dot: "bg-info" },
  approved:  { bg: "bg-success-soft",        fg: "text-success",        dot: "bg-success" },
  rejected:  { bg: "bg-destructive-soft",    fg: "text-destructive",    dot: "bg-destructive" },
};

export const DSR_SITE_STATUS_LABELS: Record<DsrSiteStatus, string> = {
  working: "Working",
  partial: "Partial",
  closed: "Closed",
};

export const DSR_DELAY_CATEGORY_LABELS: Record<DsrDelayCategory, string> = {
  weather: "Weather",
  material: "Material",
  inspection: "Inspection",
  design: "Design",
  labor: "Labor",
  equipment: "Equipment",
  other: "Other",
};

export const DSR_SEVERITY_LABELS: Record<DsrSeverity, string> = {
  low: "Low", med: "Medium", high: "High",
};

export const DSR_SEVERITY_TONE: Record<DsrSeverity, string> = {
  low:  "bg-muted text-muted-foreground",
  med:  "bg-warning-soft text-warning",
  high: "bg-destructive-soft text-destructive",
};
