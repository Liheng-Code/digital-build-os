// Map of sidebar route -> dynamic import that warms the page chunk.
// Called on link hover so the JS is already fetched by the time the user clicks.
// Each entry mirrors the React.lazy() imports in src/App.tsx.

type Importer = () => Promise<unknown>;

const PREFETCH_MAP: Record<string, Importer> = {
  "/": () => import("@/pages/Index"),
  "/project-details": () => import("@/pages/ProjectDetail"),
  "/projects": () => import("@/pages/Projects"),
  "/wbs": () => import("@/pages/Wbs"),
  "/tasks": () => import("@/pages/Tasks"),
  "/timesheets": () => import("@/pages/Timesheets"),
  "/approvals": () => import("@/pages/Approvals"),
  "/workload": () => import("@/pages/Workload"),
  "/rfis": () => import("@/pages/RFIs"),
  "/architecture": () => import("@/pages/Architecture"),
  "/structural": () => import("@/pages/Structural"),
  "/mep": () => import("@/pages/MEP"),
  "/procurement": () => import("@/pages/Procurement"),
  "/procurement/rfqs": () => import("@/pages/RFQs"),
  "/procurement/pos": () => import("@/pages/POs"),
  "/procurement/invoices": () => import("@/pages/Invoices"),
  "/procurement/grns": () => import("@/pages/GRNs"),
  "/procurement/budgets": () => import("@/pages/Budgets"),
  "/procurement/inventory": () => import("@/pages/Inventory"),
  "/procurement/subcontractors": () => import("@/pages/Subcontractors"),
  "/construction": () => import("@/pages/Construction"),
  "/daily-reports": () => import("@/pages/DailyReports"),
  "/equipment-tracking": () => import("@/pages/EquipmentTracking"),
  "/quality": () => import("@/pages/QualityControl"),
  "/hse": () => import("@/pages/HSE"),
  "/handover": () => import("@/pages/Handover"),
  "/dlp": () => import("@/pages/DLP"),
  "/financials": () => import("@/pages/FinancialControl"),
  "/financial-reports": () => import("@/pages/FinancialReports"),
  "/kpi-alerts": () => import("@/pages/KpiAlerts"),
  "/report-schedules": () => import("@/pages/ReportSchedules"),
  "/account/client-invoices": () => import("@/pages/account/ClientInvoices"),
  "/account/payment-requests": () => import("@/pages/account/PaymentRequests"),
  "/account/variation-orders": () => import("@/pages/account/VariationOrders"),
  "/account/cash-flow": () => import("@/pages/account/CashFlow"),
  "/account/chart-of-accounts": () => import("@/pages/account/ChartOfAccounts"),
  "/account/resource-rates": () => import("@/pages/account/ResourceRates"),
  "/account/final-account": () => import("@/pages/account/FinalAccount"),
  "/payroll": () => import("@/pages/Payroll"),
  "/hr": () => import("@/pages/hr/HRDashboard"),
  "/hr/leave": () => import("@/pages/hr/LeaveList"),
  "/hr/attendance": () => import("@/pages/hr/Attendance"),
  "/hr/people": () => import("@/pages/hr/People"),
  "/analytics": () => import("@/pages/ProgressAnalytics"),
  "/reports": () => import("@/pages/Reports"),
  "/executive-dashboard": () => import("@/pages/ExecutiveDashboard"),
  "/client-dashboard": () => import("@/pages/ClientDashboard"),
  "/documents": () => import("@/pages/Documents"),
  "/transmittals": () => import("@/pages/Transmittals"),
  "/stakeholders": () => import("@/pages/Stakeholders"),
  "/organization": () => import("@/pages/Organization"),
  "/audit": () => import("@/pages/AuditLog"),
  "/admin/config": () => import("@/pages/AdminConfiguration"),
  "/settings": () => import("@/pages/Settings"),
};

const warmed = new Set<string>();

export function prefetchRoute(to: string) {
  if (warmed.has(to)) return;
  const importer = PREFETCH_MAP[to];
  if (!importer) return;
  warmed.add(to);
  // Fire and forget — failures are harmless.
  importer().catch(() => warmed.delete(to));
}
