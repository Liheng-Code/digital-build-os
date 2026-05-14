import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://build-flow-dcos.lovable.app";
const SITE_NAME = "BuildTrack";
const DEFAULT_DESC =
  "Run construction projects end-to-end: tasks, timesheets, approvals, procurement, QA/QC, and reporting.";

type Meta = { title: string; description?: string };

// Static route → metadata map. Dynamic routes (e.g. /tasks/:id) fall through
// to the prefix match below.
const ROUTES: Record<string, Meta> = {
  "/": { title: "Project Dashboard" },
  "/auth": { title: "Sign in", description: "Sign in to BuildTrack to manage your construction projects." },
  "/reset-password": { title: "Reset password" },
  "/projects": { title: "Project Directory", description: "Browse and manage every construction project in your portfolio." },
  "/project-details": { title: "Project Info" },
  "/wbs": { title: "Work Breakdown Structure", description: "Plan, schedule, and track every WBS task with Gantt, CPM, and baselines." },
  "/tasks": { title: "Task Management", description: "Assign, track, and approve construction tasks across teams." },
  "/timesheets": { title: "Timesheets" },
  "/approvals": { title: "Approvals" },
  "/workload": { title: "Workload" },
  "/rfis": { title: "RFIs" },
  "/architecture": { title: "Architecture" },
  "/structural": { title: "Structural Engineering" },
  "/mep": { title: "MEP Engineering" },
  "/procurement": { title: "Procurement & MTO" },
  "/procurement/rfqs": { title: "RFQs" },
  "/procurement/pos": { title: "Purchase Orders" },
  "/procurement/invoices": { title: "Invoices" },
  "/procurement/grns": { title: "Goods Received Notes" },
  "/procurement/budgets": { title: "Budgets" },
  "/procurement/inventory": { title: "Inventory" },
  "/procurement/subcontractors": { title: "Subcontractors" },
  "/construction": { title: "Construction Management" },
  "/daily-reports": { title: "Daily Reports" },
  "/equipment-tracking": { title: "Equipment Tracking" },
  "/quality": { title: "Quality (QA/QC)" },
  "/hse": { title: "Safety & HSE" },
  "/handover": { title: "Handover & Commissioning" },
  "/dlp": { title: "Defect Liability" },
  "/financials": { title: "Financial Control" },
  "/financial-reports": { title: "Financial Reports" },
  "/kpi-alerts": { title: "KPI Alerts" },
  "/report-schedules": { title: "Report Schedules" },
  "/account/client-invoices": { title: "Client Invoices" },
  "/account/payment-requests": { title: "Payment Requests" },
  "/account/variation-orders": { title: "Variation Orders" },
  "/account/cash-flow": { title: "Cash Flow" },
  "/account/chart-of-accounts": { title: "Chart of Accounts" },
  "/account/resource-rates": { title: "Resource Rates" },
  "/account/final-account": { title: "Final Account" },
  "/payroll": { title: "Payroll" },
  "/hr": { title: "HR Dashboard" },
  "/hr/leave": { title: "Leave" },
  "/hr/attendance": { title: "Attendance" },
  "/hr/people": { title: "People" },
  "/analytics": { title: "Progress & Analytics" },
  "/reports": { title: "Reports" },
  "/executive-dashboard": { title: "Executive Dashboard" },
  "/client-dashboard": { title: "Client Dashboard" },
  "/documents": { title: "Document Register" },
  "/transmittals": { title: "Transmittals" },
  "/stakeholders": { title: "Stakeholders" },
  "/organization": { title: "Organization", description: "Internal organization chart, member roles, and permission matrix." },
  "/team": { title: "Organization" },
  "/permissions": { title: "Organization" },
  "/audit": { title: "Audit Log" },
  "/admin/config": { title: "Admin Config" },
  "/settings": { title: "Settings" },
  "/notifications": { title: "Notifications" },
};

function resolveMeta(pathname: string): Meta {
  if (ROUTES[pathname]) return ROUTES[pathname];
  // Longest-prefix fallback for dynamic routes (e.g. /tasks/abc → /tasks).
  const match = Object.keys(ROUTES)
    .filter((p) => p !== "/" && pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];
  if (match) return ROUTES[match];
  return { title: SITE_NAME };
}

export function RouteHead() {
  const { pathname } = useLocation();
  const meta = resolveMeta(pathname);
  const title = meta.title === SITE_NAME ? `${SITE_NAME} — Construction Project Management` : `${meta.title} — ${SITE_NAME}`;
  const description = meta.description ?? DEFAULT_DESC;
  const url = `${SITE_URL}${pathname}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
