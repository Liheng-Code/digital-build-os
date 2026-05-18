import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ViewportGuard } from "@/components/ViewportGuard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { RouteHead } from "@/components/RouteHead";

// Eager: tiny / immediately needed
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy: split each page into its own chunk
const Architecture = React.lazy(() => import("./pages/Architecture"));
const Procurement = React.lazy(() => import("./pages/Procurement"));
const HSE = React.lazy(() => import("./pages/HSE"));
const Subcontractors = React.lazy(() => import("./pages/Subcontractors"));
const Structural = React.lazy(() => import("./pages/Structural"));
const MEP = React.lazy(() => import("./pages/MEP"));
const Construction = React.lazy(() => import("./pages/Construction"));
const ConstructionTaskDetail = React.lazy(() => import("./pages/ConstructionTaskDetail"));
const ConstructionReports = React.lazy(() => import("./pages/ConstructionReports"));
const AdminConfiguration = React.lazy(() => import("./pages/AdminConfiguration"));
const Inventory = React.lazy(() => import("./pages/Inventory"));
const Projects = React.lazy(() => import("./pages/Projects"));
const Tasks = React.lazy(() => import("./pages/Tasks"));
const TaskDetail = React.lazy(() => import("./pages/TaskDetail"));
const Approvals = React.lazy(() => import("./pages/Approvals"));
const Workload = React.lazy(() => import("./pages/Workload"));
const Organization = React.lazy(() => import("./pages/Organization"));
const Timesheets = React.lazy(() => import("./pages/Timesheets"));
const Payroll = React.lazy(() => import("./pages/Payroll"));
const Documents = React.lazy(() => import("./pages/Documents"));
const Reports = React.lazy(() => import("./pages/Reports"));
const AuditLog = React.lazy(() => import("./pages/AuditLog"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const Wbs = React.lazy(() => import("./pages/Wbs"));
const DailyReports = React.lazy(() => import("./pages/DailyReports"));
const DailyReportDetail = React.lazy(() => import("./pages/DailyReportDetail"));
const EquipmentTracking = React.lazy(() => import("./pages/EquipmentTracking"));
const Handover = React.lazy(() => import("./pages/Handover"));
const DLP = React.lazy(() => import("./pages/DLP"));
const QualityControl = React.lazy(() => import("./pages/QualityControl"));
const FinancialControl = React.lazy(() => import("./pages/FinancialControl"));
const ProgressClaims = React.lazy(() => import("./pages/ProgressClaims"));
const Stakeholders = React.lazy(() => import("./pages/Stakeholders"));
const Transmittals = React.lazy(() => import("./pages/Transmittals"));
const ProgressAnalytics = React.lazy(() => import("./pages/ProgressAnalytics"));
const ExecutiveDashboard = React.lazy(() => import("./pages/ExecutiveDashboard"));
const ProjectDashboard = React.lazy(() => import("./pages/ProjectDashboard"));
const ClientDashboard = React.lazy(() => import("./pages/ClientDashboard"));
const FinancialReports = React.lazy(() => import("./pages/FinancialReports"));
const KpiAlerts = React.lazy(() => import("./pages/KpiAlerts"));
const ReportSchedules = React.lazy(() => import("./pages/ReportSchedules"));
const RFIs = React.lazy(() => import("./pages/RFIs"));
const ChartOfAccounts = React.lazy(() => import("./pages/account/ChartOfAccounts"));
const PaymentRequests = React.lazy(() => import("./pages/account/PaymentRequests"));
const ClientInvoices = React.lazy(() => import("./pages/account/ClientInvoices"));
const VariationOrders = React.lazy(() => import("./pages/account/VariationOrders"));
const CashFlow = React.lazy(() => import("./pages/account/CashFlow"));
const ResourceRates = React.lazy(() => import("./pages/account/ResourceRates"));
const FinalAccount = React.lazy(() => import("./pages/account/FinalAccount"));
const HRDashboard = React.lazy(() => import("./pages/hr/HRDashboard"));
const LeaveList = React.lazy(() => import("./pages/hr/LeaveList"));
const LeaveRequestForm = React.lazy(() => import("./pages/hr/LeaveRequestForm"));
const LeaveTypesAdmin = React.lazy(() => import("./pages/hr/LeaveTypesAdmin"));
const Attendance = React.lazy(() => import("./pages/hr/Attendance"));
const People = React.lazy(() => import("./pages/hr/People"));
const RFQs = React.lazy(() => import("./pages/RFQs"));
const RFQDetail = React.lazy(() => import("./pages/RFQDetail"));
const POs = React.lazy(() => import("./pages/POs"));
const PODetail = React.lazy(() => import("./pages/PODetail"));
const Invoices = React.lazy(() => import("./pages/Invoices"));
const InvoiceDetail = React.lazy(() => import("./pages/InvoiceDetail"));
const GRNs = React.lazy(() => import("./pages/GRNs"));
const GRNDetail = React.lazy(() => import("./pages/GRNDetail"));
const Budgets = React.lazy(() => import("./pages/Budgets"));
const BudgetDetail = React.lazy(() => import("./pages/BudgetDetail"));
const ProjectDetail = React.lazy(() => import("./pages/ProjectDetail"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Long stale time so navigating to a previously-visited tab reuses the
      // cached payload immediately and only revalidates in the background.
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

/** Shared protected shell — stays mounted across tab navigations. */
function ProtectedShell() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <React.Suspense fallback={<PageFallback />}>
          <Outlet />
        </React.Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ViewportGuard>
        <BrowserRouter>
          <AuthProvider>
            <ProjectProvider>
              <RouteHead />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route element={<ProtectedShell />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/tasks/:id" element={<TaskDetail />} />
                  <Route path="/approvals" element={<Approvals />} />
                  <Route path="/workload" element={<Workload />} />
                  <Route path="/procurement" element={<Procurement />} />
                  <Route path="/procurement/rfqs" element={<RFQs />} />
                  <Route path="/procurement/rfq/:id" element={<RFQDetail />} />
                  <Route path="/procurement/pos" element={<POs />} />
                  <Route path="/procurement/po/:id" element={<PODetail />} />
                  <Route path="/procurement/invoices" element={<Invoices />} />
                  <Route path="/procurement/invoice/:id" element={<InvoiceDetail />} />
                  <Route path="/procurement/grns" element={<GRNs />} />
                  <Route path="/procurement/grn/:id" element={<GRNDetail />} />
                  <Route path="/procurement/budgets" element={<Budgets />} />
                  <Route path="/procurement/budget/:id" element={<BudgetDetail />} />
                  <Route path="/procurement/inventory" element={<Inventory />} />
                  <Route path="/procurement/subcontractors" element={<Subcontractors />} />
                  <Route path="/hse" element={<HSE />} />
                  <Route path="/timesheets" element={<Timesheets />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/organization" element={<Organization />} />
                  <Route path="/team" element={<Organization />} />
                  <Route path="/audit" element={<AuditLog />} />
                  <Route path="/permissions" element={<Organization />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/wbs" element={<Wbs />} />
                  <Route path="/daily-reports" element={<DailyReports />} />
                  <Route path="/daily-reports/:id" element={<DailyReportDetail />} />
                  <Route path="/equipment-tracking" element={<EquipmentTracking />} />
                  <Route path="/handover" element={<Handover />} />
                  <Route path="/dlp" element={<DLP />} />
                  <Route path="/quality" element={<QualityControl />} />
                  <Route path="/financials" element={<FinancialControl />} />
                  <Route path="/financials/claims" element={<ProgressClaims />} />
                  <Route path="/stakeholders" element={<Stakeholders />} />
                  <Route path="/project-details" element={<ProjectDetail />} />
                  <Route path="/rfis" element={<RFIs />} />
                  <Route path="/analytics" element={<ProgressAnalytics />} />
                  <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
                  <Route path="/projects/:id/dashboard" element={<ProjectDashboard />} />
                  <Route path="/client-dashboard" element={<ClientDashboard />} />
                  <Route path="/financial-reports" element={<FinancialReports />} />
                  <Route path="/kpi-alerts" element={<KpiAlerts />} />
                  <Route path="/report-schedules" element={<ReportSchedules />} />
                  <Route path="/architecture" element={<Architecture />} />
                  <Route path="/structural" element={<Structural />} />
                  <Route path="/mep" element={<MEP />} />
                  <Route path="/construction" element={<Construction />} />
                  <Route path="/construction/tasks/:id" element={<ConstructionTaskDetail />} />
                  <Route path="/construction/reports" element={<ConstructionReports />} />
                  <Route
                    path="/construction/material-usage"
                    element={
                      <div className="p-8">
                        <h2 className="text-xl font-bold mb-4">Material Usage Logs</h2>
                        <p className="text-muted-foreground mb-4">
                          Construction material usage linked to Procurement POs and Inventory stock issues.
                        </p>
                        <a href="/procurement" className="text-primary hover:underline">
                          ← Go to Procurement Module
                        </a>
                      </div>
                    }
                  />
                  <Route path="/admin/config" element={<AdminConfiguration />} />
                  <Route path="/transmittals" element={<Transmittals />} />
                  <Route path="/hr" element={<HRDashboard />} />
                  <Route path="/hr/leave" element={<LeaveList />} />
                  <Route path="/hr/leave/new" element={<LeaveRequestForm />} />
                  <Route path="/hr/leave/types" element={<LeaveTypesAdmin />} />
                  <Route path="/hr/attendance" element={<Attendance />} />
                  <Route path="/hr/people" element={<People />} />
                  <Route path="/account/chart-of-accounts" element={<ChartOfAccounts />} />
                  <Route path="/account/payment-requests" element={<PaymentRequests />} />
                  <Route path="/account/client-invoices" element={<ClientInvoices />} />
                  <Route path="/account/variation-orders" element={<VariationOrders />} />
                  <Route path="/account/cash-flow" element={<CashFlow />} />
                  <Route path="/account/resource-rates" element={<ResourceRates />} />
                  <Route path="/account/final-account" element={<FinalAccount />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ProjectProvider>
          </AuthProvider>
        </BrowserRouter>
      </ViewportGuard>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
