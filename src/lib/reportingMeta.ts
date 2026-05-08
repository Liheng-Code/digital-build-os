import type { Department } from "./departmentMeta";

// ============================================================
// 1. Dashboard Levels
// ============================================================

export type DashboardLevel =
  | "board_ceo"
  | "director"
  | "project_manager"
  | "discipline_lead"
  | "engineer_supervisor"
  | "client_consultant";

export const DASHBOARD_LEVEL_LABELS: Record<DashboardLevel, string> = {
  board_ceo: "Board / CEO",
  director: "Director",
  project_manager: "Project Manager",
  discipline_lead: "Discipline Lead",
  engineer_supervisor: "Engineer / Supervisor",
  client_consultant: "Client / Consultant",
};

export const DASHBOARD_LEVEL_DESCRIPTIONS: Record<DashboardLevel, string> = {
  board_ceo: "Company portfolio dashboard — cross-project health, financials, and risk",
  director: "Department and project performance — team workload, deliverables, delays",
  project_manager: "Project progress, cost, risk, issue — daily control view",
  discipline_lead: "Department workload and deliverables — discipline-specific KPIs",
  engineer_supervisor: "Assigned task and daily work — personal performance view",
  client_consultant: "Approval and progress view — read-only external dashboard",
};

// ============================================================
// 2. KPI Time Range
// ============================================================

export type KpiTimeRange = "7d" | "30d" | "90d" | "custom";

export const KPI_TIME_RANGE_LABELS: Record<KpiTimeRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom range",
};

// ============================================================
// 3. Org KPIs
// ============================================================

export interface OrgKpiData {
  totalProjects: number;
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalHours: number;
  approvedHours: number;
  payrollTotal: number;
  payrollCurrency: string;
  onTimeRate: number;
}

// ============================================================
// 4. Department KPI Row
// ============================================================

export interface DeptKpiRow {
  department: Department | "unassigned";
  members: number;
  total: number;
  open: number;
  assigned: number;
  in_progress: number;
  pending_approval: number;
  approved: number;
  rejected: number;
  completed: number;
  closed: number;
  overdue: number;
  hours: number;
}

// ============================================================
// 5. Member KPI Row
// ============================================================

export interface MemberKpiRow {
  user_id: string;
  full_name: string;
  job_title: string | null;
  department: Department | null;
  total_tasks: number;
  open: number;
  assigned: number;
  in_progress: number;
  pending_approval: number;
  approved: number;
  rejected: number;
  completed: number;
  closed: number;
  overdue: number;
  on_time_rate: number;
  completion_rate: number;
  regular_hours: number;
  overtime_hours: number;
  approved_hours: number;
}

// ============================================================
// 6. Project KPIs
// ============================================================

export type ProjectKpiType =
  | "overall_progress"
  | "planned_vs_actual"
  | "delay_days"
  | "critical_tasks"
  | "open_issues"
  | "pending_approvals"
  | "cost_variance"
  | "procurement_delay"
  | "rfi_aging"
  | "ncr_aging";

export const PROJECT_KPI_LABELS: Record<ProjectKpiType, string> = {
  overall_progress: "Overall Progress",
  planned_vs_actual: "Planned vs Actual",
  delay_days: "Delay Days",
  critical_tasks: "Critical Tasks",
  open_issues: "Open Issues",
  pending_approvals: "Pending Approvals",
  cost_variance: "Cost Variance",
  procurement_delay: "Procurement Delay",
  rfi_aging: "RFI Aging",
  ncr_aging: "NCR Aging",
};

export interface ProjectKpiSummary {
  overallProgressPct: number;
  plannedVsActualPct: number;
  delayDays: number;
  criticalTasks: number;
  openIssues: number;
  pendingApprovals: number;
  costVariance: number;
  costVariancePct: number;
  procurementDelayDays: number;
  rfiAgingDays: number;
  ncrAgingDays: number;
}

// ============================================================
// 7. Department KPIs
// ============================================================

export type DepartmentKpiType =
  | "task_completion_rate"
  | "late_task_count"
  | "workload_by_person"
  | "approval_response_time"
  | "document_revision_count"
  | "productivity_per_employee";

export const DEPARTMENT_KPI_LABELS: Record<DepartmentKpiType, string> = {
  task_completion_rate: "Task Completion Rate",
  late_task_count: "Late Task Count",
  workload_by_person: "Workload by Person",
  approval_response_time: "Approval Response Time",
  document_revision_count: "Document Revision Count",
  productivity_per_employee: "Productivity per Employee",
};

export interface DepartmentKpiSummary {
  taskCompletionRate: number;
  lateTaskCount: number;
  workloadByPerson: number;
  approvalResponseTimeHours: number;
  documentRevisionCount: number;
  productivityPerEmployee: number;
}

// ============================================================
// 8. Financial KPIs
// ============================================================

export type FinancialKpiType =
  | "budget_vs_actual"
  | "committed_cost"
  | "paid_amount"
  | "pending_invoice"
  | "variation_value"
  | "forecast_final_cost";

export const FINANCIAL_KPI_LABELS: Record<FinancialKpiType, string> = {
  budget_vs_actual: "Budget vs Actual",
  committed_cost: "Committed Cost",
  paid_amount: "Paid Amount",
  pending_invoice: "Pending Invoice",
  variation_value: "Variation Value",
  forecast_final_cost: "Forecast Final Cost",
};

export interface FinancialKpiSummary {
  totalBudget: number;
  totalActual: number;
  totalCommitted: number;
  totalPaid: number;
  pendingInvoiceAmount: number;
  variationValue: number;
  forecastFinalCost: number;
  budgetUtilizationPct: number;
  currency: string;
}

// ============================================================
// 9. Task Progress Summary (for S-Curve / Analytics)
// ============================================================

export interface TaskProgressPoint {
  period: string;
  planned: number;
  actual: number;
}

export interface BuildingProgress {
  buildingName: string;
  progressPct: number;
  taskCount: number;
}

export interface WbsNodePerformance {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  path: string;
  progressPct: number;
  taskCount: number;
}

// ============================================================
// 10. Dashboard-Level Permission Map
// ============================================================

export interface DashboardPermission {
  level: DashboardLevel;
  requiredRoles: string[];
  kpiAccess: ProjectKpiType[];
  financialAccess: FinancialKpiType[];
  departmentAccess: DepartmentKpiType[];
  canExport: boolean;
  canSeeMemberDetails: boolean;
}

export const DASHBOARD_PERMISSIONS: Record<DashboardLevel, DashboardPermission> = {
  board_ceo: {
    level: "board_ceo",
    requiredRoles: ["admin", "director"],
    kpiAccess: [
      "overall_progress", "planned_vs_actual", "delay_days", "critical_tasks",
      "open_issues", "pending_approvals", "cost_variance",
      "procurement_delay", "rfi_aging", "ncr_aging",
    ],
    financialAccess: [
      "budget_vs_actual", "committed_cost", "paid_amount",
      "pending_invoice", "variation_value", "forecast_final_cost",
    ],
    departmentAccess: [
      "task_completion_rate", "late_task_count", "workload_by_person",
      "approval_response_time", "document_revision_count", "productivity_per_employee",
    ],
    canExport: true,
    canSeeMemberDetails: true,
  },
  director: {
    level: "director",
    requiredRoles: ["admin", "director"],
    kpiAccess: [
      "overall_progress", "planned_vs_actual", "delay_days", "critical_tasks",
      "open_issues", "pending_approvals", "cost_variance",
      "procurement_delay",
    ],
    financialAccess: [
      "budget_vs_actual", "committed_cost", "paid_amount",
      "pending_invoice", "variation_value", "forecast_final_cost",
    ],
    departmentAccess: [
      "task_completion_rate", "late_task_count", "workload_by_person",
      "approval_response_time", "document_revision_count", "productivity_per_employee",
    ],
    canExport: true,
    canSeeMemberDetails: true,
  },
  project_manager: {
    level: "project_manager",
    requiredRoles: ["admin", "project_manager", "director"],
    kpiAccess: [
      "overall_progress", "planned_vs_actual", "delay_days", "critical_tasks",
      "open_issues", "pending_approvals", "cost_variance",
      "procurement_delay", "rfi_aging", "ncr_aging",
    ],
    financialAccess: [
      "budget_vs_actual", "committed_cost", "paid_amount",
      "pending_invoice", "variation_value",
    ],
    departmentAccess: [
      "task_completion_rate", "late_task_count", "workload_by_person",
      "approval_response_time",
    ],
    canExport: true,
    canSeeMemberDetails: true,
  },
  discipline_lead: {
    level: "discipline_lead",
    requiredRoles: ["admin", "project_manager", "discipline_lead"],
    kpiAccess: [
      "overall_progress", "delay_days", "critical_tasks",
      "open_issues", "pending_approvals",
    ],
    financialAccess: ["budget_vs_actual"],
    departmentAccess: [
      "task_completion_rate", "late_task_count", "workload_by_person",
      "approval_response_time", "productivity_per_employee",
    ],
    canExport: false,
    canSeeMemberDetails: true,
  },
  engineer_supervisor: {
    level: "engineer_supervisor",
    requiredRoles: ["admin", "project_manager", "engineer", "site_supervisor"],
    kpiAccess: [
      "overall_progress", "delay_days", "critical_tasks",
      "open_issues",
    ],
    financialAccess: [],
    departmentAccess: ["task_completion_rate", "late_task_count"],
    canExport: false,
    canSeeMemberDetails: false,
  },
  client_consultant: {
    level: "client_consultant",
    requiredRoles: ["client", "consultant"],
    kpiAccess: [
      "overall_progress", "planned_vs_actual", "delay_days",
      "open_issues", "pending_approvals",
    ],
    financialAccess: ["budget_vs_actual", "paid_amount", "variation_value"],
    departmentAccess: [],
    canExport: false,
    canSeeMemberDetails: false,
  },
};

// ============================================================
// 11. KPI Alert Types (Phase 5)
// ============================================================

export type KpiAlertSeverity = "info" | "warning" | "critical";
export type KpiAlertOperator = "gt" | "lt" | "gte" | "lte" | "eq";
export type KpiAlertCategory = "project" | "department" | "financial";

export const KPI_ALERT_SEVERITY_LABELS: Record<KpiAlertSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

export const KPI_ALERT_SEVERITY_TONES: Record<KpiAlertSeverity, { bg: string; fg: string; dot: string }> = {
  info: { bg: "bg-info-soft", fg: "text-info", dot: "bg-info" },
  warning: { bg: "bg-warning-soft", fg: "text-warning", dot: "bg-warning" },
  critical: { bg: "bg-destructive-soft", fg: "text-destructive", dot: "bg-destructive" },
};

export const KPI_ALERT_OPERATOR_LABELS: Record<KpiAlertOperator, string> = {
  gt: "> greater than",
  lt: "< less than",
  gte: "≥ greater or equal",
  lte: "≤ less or equal",
  eq: "= equal to",
};

export const KPI_ALERT_CATEGORY_LABELS: Record<KpiAlertCategory, string> = {
  project: "Project KPIs",
  department: "Department KPIs",
  financial: "Financial KPIs",
};

export interface KpiAlertThreshold {
  id?: string;
  project_id: string;
  kpi_name: string;
  kpi_category: KpiAlertCategory;
  operator: KpiAlertOperator;
  threshold_value: number;
  severity: KpiAlertSeverity;
  enabled: boolean;
  label: string;
  created_at?: string;
  updated_at?: string;
}

export interface KpiAlertEvent {
  id?: string;
  project_id: string;
  kpi_name: string;
  kpi_category: KpiAlertCategory;
  actual_value: number;
  threshold_value: number;
  operator: KpiAlertOperator;
  severity: KpiAlertSeverity;
  message: string;
  read_at: string | null;
  created_at?: string;
}

export const ALL_KPI_NAMES: { category: KpiAlertCategory; name: string; label: string }[] = [
  // Project KPIs
  { category: "project", name: "overall_progress", label: "Overall Progress" },
  { category: "project", name: "delay_days", label: "Delay Days" },
  { category: "project", name: "critical_tasks", label: "Critical Tasks" },
  { category: "project", name: "open_issues", label: "Open Issues" },
  { category: "project", name: "pending_approvals", label: "Pending Approvals" },
  { category: "project", name: "cost_variance", label: "Cost Variance" },
  { category: "project", name: "procurement_delay", label: "Procurement Delay" },
  { category: "project", name: "rfi_aging", label: "RFI Aging" },
  { category: "project", name: "ncr_aging", label: "NCR Aging" },
  // Department KPIs
  { category: "department", name: "task_completion_rate", label: "Task Completion Rate" },
  { category: "department", name: "late_task_count", label: "Late Task Count" },
  { category: "department", name: "workload_by_person", label: "Workload by Person" },
  { category: "department", name: "approval_response_time", label: "Approval Response Time" },
  // Financial KPIs
  { category: "financial", name: "budget_vs_actual", label: "Budget vs Actual" },
  { category: "financial", name: "committed_cost", label: "Committed Cost" },
  { category: "financial", name: "paid_amount", label: "Paid Amount" },
  { category: "financial", name: "pending_invoice", label: "Pending Invoice" },
  { category: "financial", name: "variation_value", label: "Variation Value" },
  { category: "financial", name: "forecast_final_cost", label: "Forecast Final Cost" },
  { category: "financial", name: "budget_utilization", label: "Budget Utilization %" },
];

// ============================================================
// 12. KPI Threshold Configuration
// ============================================================

export interface KpiThreshold {
  greenMax: number;
  yellowMax: number;
}

export type KpiTone = "green" | "yellow" | "red";

export function getKpiTone(value: number, threshold: KpiThreshold): KpiTone {
  if (value <= threshold.greenMax) return "green";
  if (value <= threshold.yellowMax) return "yellow";
  return "red";
}

export const DEFAULT_PROGRESS_THRESHOLD: KpiThreshold = { greenMax: 10, yellowMax: 25 };
export const DEFAULT_DELAY_THRESHOLD: KpiThreshold = { greenMax: 3, yellowMax: 14 };
export const DEFAULT_COST_VARIANCE_THRESHOLD: KpiThreshold = { greenMax: 5, yellowMax: 15 };

// ============================================================
// 13. Report Scheduling (Phase 6)
// ============================================================

export type ReportFrequency = "daily" | "weekly" | "monthly" | "quarterly";
export type ReportScheduleFormat = "pdf" | "csv" | "xlsx";

export const REPORT_FREQUENCY_LABELS: Record<ReportFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export const REPORT_SCHEDULE_FORMAT_LABELS: Record<ReportScheduleFormat, string> = {
  pdf: "PDF",
  csv: "CSV",
  xlsx: "Excel (XLSX)",
};

export interface ReportSchedule {
  id?: string;
  project_id: string;
  report_type: string;
  frequency: ReportFrequency;
  day_of_week: number | null;
  day_of_month: number | null;
  recipients: string[];
  format: ReportScheduleFormat;
  enabled: boolean;
  label: string;
  last_sent_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export const REPORT_TYPE_OPTIONS = [
  { value: "executive_dashboard", label: "Executive Dashboard" },
  { value: "project_dashboard", label: "Project Dashboard" },
  { value: "financial_report", label: "Financial Report" },
  { value: "kpi_alerts", label: "KPI Alerts Summary" },
];

export const FREQUENCY_DAY_OPTIONS: Record<ReportFrequency, { value: number; label: string }[]> = {
  daily: [],
  weekly: [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ],
  monthly: Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: `Day ${i + 1}` })),
  quarterly: [],
};

// ============================================================
// 14. Format Helpers
// ============================================================

export function formatKpiValue(value: number, type: "percent" | "currency" | "days" | "count", currency = "USD"): string {
  switch (type) {
    case "percent":
      return `${Math.round(value)}%`;
    case "currency":
      return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
    case "days":
      return `${Math.round(value)} days`;
    case "count":
      return String(Math.round(value));
  }
}

export function formatKpiToneClass(tone: KpiTone): string {
  switch (tone) {
    case "green":
      return "text-success";
    case "yellow":
      return "text-warning";
    case "red":
      return "text-destructive";
  }
}
