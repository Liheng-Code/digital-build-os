// Construction Module Meta - Module 9
// Aligned with DCOS System Architecture Module Design R0, Section 14

export type ConstructionTaskStatus = 
  | 'open' 
  | 'assigned' 
  | 'in_progress' 
  | 'completed' 
  | 'submitted_for_approval' 
  | 'approved' 
  | 'closed' 
  | 'rejected' 
  | 'on_hold';

export type ConstructionTaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type SiteIssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SiteIssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type InspectionResult = 'pass' | 'fail' | 'conditional_pass';
export type ConcreteGrade = 'C20' | 'C25' | 'C30' | 'C35' | 'C40' | 'C45' | 'C50' | 'Other';

// Task Status Labels (per Module 14.3)
export const CONSTRUCTION_TASK_STATUS_LABELS: Record<ConstructionTaskStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  submitted_for_approval: 'Submitted for Approval',
  approved: 'Approved',
  closed: 'Closed',
  rejected: 'Rejected',
  on_hold: 'On Hold',
};

// Task Status Colors (matching shadcn/ui patterns)
export const CONSTRUCTION_TASK_STATUS_TONE: Record<ConstructionTaskStatus, { bg: string; fg: string; dot: string }> = {
  open:                  { bg: 'bg-neutral-status-soft', fg: 'text-neutral-status', dot: 'bg-neutral-status' },
  assigned:              { bg: 'bg-info-soft', fg: 'text-info', dot: 'bg-info' },
  in_progress:           { bg: 'bg-primary-soft', fg: 'text-primary', dot: 'bg-primary' },
  completed:             { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  submitted_for_approval: { bg: 'bg-warning-soft', fg: 'text-warning', dot: 'bg-warning' },
  approved:              { bg: 'bg-success-soft', fg: 'text-success', dot: 'bg-success' },
  closed:                { bg: 'bg-muted', fg: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  rejected:              { bg: 'bg-destructive-soft', fg: 'text-destructive', dot: 'bg-destructive' },
  on_hold:               { bg: 'bg-orange-100', fg: 'text-orange-700', dot: 'bg-orange-500' },
};

// Task Priority Labels (per Module 14.2)
export const CONSTRUCTION_TASK_PRIORITY_LABELS: Record<ConstructionTaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const CONSTRUCTION_TASK_PRIORITY_TONE: Record<ConstructionTaskPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info-soft text-info',
  high: 'bg-warning-soft text-warning',
  critical: 'bg-destructive-soft text-destructive',
};

// Site Issue Severity
export const SITE_ISSUE_SEVERITY_LABELS: Record<SiteIssueSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const SITE_ISSUE_SEVERITY_TONE: Record<SiteIssueSeverity, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info-soft text-info',
  high: 'bg-warning-soft text-warning',
  critical: 'bg-destructive-soft text-destructive',
};

// Inspection Results
export const INSPECTION_RESULT_LABELS: Record<InspectionResult, string> = {
  pass: 'Pass',
  fail: 'Fail',
  conditional_pass: 'Conditional Pass',
};

// Concrete Grades
export const CONCRETE_GRADE_LABELS: Record<ConcreteGrade, string> = {
  C20: 'C20 (20 MPa)',
  C25: 'C25 (25 MPa)',
  C30: 'C30 (30 MPa)',
  C35: 'C35 (35 MPa)',
  C40: 'C40 (40 MPa)',
  C45: 'C45 (45 MPa)',
  C50: 'C50 (50 MPa)',
  Other: 'Other (Custom)',
};

// Task Status Flow (per Module 14.3)
// Open → Assigned → In Progress → Completed → Submitted for Approval → Approved → Closed
// Rejected → In Progress
// On Hold → Resume (back to previous status)
export const TASK_STATUS_FLOW: Record<ConstructionTaskStatus, ConstructionTaskStatus[]> = {
  open: ['assigned', 'on_hold'],
  assigned: ['in_progress', 'on_hold', 'open'],
  in_progress: ['completed', 'on_hold', 'rejected'],
  completed: ['submitted_for_approval'],
  submitted_for_approval: ['approved', 'rejected'],
  approved: ['closed'],
  closed: [],
  rejected: ['in_progress'],
  on_hold: ['in_progress', 'assigned', 'open'],
};

// Statuses that allow progress updates
export const PROGRESS_EDITABLE_STATUSES: ConstructionTaskStatus[] = ['open', 'assigned', 'in_progress', 'rejected'];

// Statuses that indicate active work
export const ACTIVE_WORK_STATUSES: ConstructionTaskStatus[] = ['assigned', 'in_progress', 'on_hold'];

// Module 14.5 Key Reports
export type ConstructionReportType = 
  | 'daily_progress' 
  | 'weekly_progress' 
  | 'monthly_progress' 
  | 'manpower_histogram' 
  | 'equipment_utilization' 
  | 'material_consumption' 
  | 'delay_report' 
  | 'issue_aging';

export const CONSTRUCTION_REPORT_LABELS: Record<ConstructionReportType, string> = {
  daily_progress: 'Daily Progress Report',
  weekly_progress: 'Weekly Progress Report',
  monthly_progress: 'Monthly Progress Report',
  manpower_histogram: 'Manpower Histogram',
  equipment_utilization: 'Equipment Utilization',
  material_consumption: 'Material Consumption',
  delay_report: 'Delay Report',
  issue_aging: 'Issue Aging Report',
};
