import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { ViewportGuard } from "@/components/ViewportGuard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Architecture from "./pages/Architecture";
import Procurement from "./pages/Procurement";
import HSE from "./pages/HSE";
import Subcontractors from "./pages/Subcontractors";
import Structural from "./pages/Structural";
import MEP from "./pages/MEP";
import Construction from "./pages/Construction";
import ConstructionTaskDetail from "./pages/ConstructionTaskDetail";
import ConstructionReports from "./pages/ConstructionReports";
import AdminConstructionConfig from "./pages/AdminConstructionConfig";
import Inventory from "./pages/Inventory";
import ResetPassword from "./pages/ResetPassword";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import Approvals from "./pages/Approvals";
import Workload from "./pages/Workload";
import Permissions from "./pages/Permissions";
import Timesheets from "./pages/Timesheets";
import Payroll from "./pages/Payroll";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import AuditLog from "./pages/AuditLog";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Wbs from "./pages/Wbs";
import DailyReports from "./pages/DailyReports";
import DailyReportDetail from "./pages/DailyReportDetail";
import MaterialsProcurement from "./pages/MaterialsProcurement";
import QualityControl from "./pages/QualityControl";
import FinancialControl from "./pages/FinancialControl";
import ProgressClaims from "./pages/ProgressClaims";
import Stakeholders from "./pages/Stakeholders";
import Transmittals from "./pages/Transmittals";
import ProgressAnalytics from "./pages/ProgressAnalytics";
import RFIs from "./pages/RFIs";
import HRDashboard from "./pages/hr/HRDashboard";
import LeaveList from "./pages/hr/LeaveList";
import LeaveRequestForm from "./pages/hr/LeaveRequestForm";
import LeaveTypesAdmin from "./pages/hr/LeaveTypesAdmin";
import Attendance from "./pages/hr/Attendance";
import People from "./pages/hr/People";
import RFQs from "./pages/RFQs";
import RFQDetail from "./pages/RFQDetail";
import POs from "./pages/POs";
import PODetail from "./pages/PODetail";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import GRNs from "./pages/GRNs";
import GRNDetail from "./pages/GRNDetail";
import Budgets from "./pages/Budgets";
import BudgetDetail from "./pages/BudgetDetail";
import ProjectDetail from "./pages/ProjectDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ViewportGuard>
        <BrowserRouter>
          <AuthProvider>
            <ProjectProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Index />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Projects />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Tasks />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <TaskDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/approvals"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Approvals />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workload"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Workload />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Procurement />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/rfqs"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <RFQs />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/rfq/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <RFQDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/pos"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <POs />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/po/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <PODetail />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/invoices"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Invoices />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/invoice/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <InvoiceDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/grns"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <GRNs />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/grn/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <GRNDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/budgets"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Budgets />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/procurement/budget/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <BudgetDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/hse" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <HSE />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/subcontractors" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Subcontractors />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/timesheets"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Timesheets />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payroll"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Payroll />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Documents />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Reports />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/team"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Team />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AuditLog />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/permissions" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Permissions />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Settings />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Notifications />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wbs"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Wbs />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/daily-reports"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <DailyReports />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/daily-reports/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <DailyReportDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/materials"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MaterialsProcurement />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/quality" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <QualityControl />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/financials" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <FinancialControl />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/financials/claims" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ProgressClaims />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/stakeholders" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Stakeholders />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/project-details" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ProjectDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/rfis" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <RFIs />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ProgressAnalytics />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/architecture" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Architecture />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/structural" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Structural />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/mep" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MEP />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/construction" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Construction />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/construction/tasks/:id" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ConstructionTaskDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/construction/reports" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ConstructionReports />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Inventory />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                {/* Cross-Module Integration Routes */}
                <Route 
                  path="/construction/material-usage" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <div className="p-8">
                          <h2 className="text-xl font-bold mb-4">Material Usage Logs</h2>
                          <p className="text-muted-foreground mb-4">
                            Construction material usage linked to Procurement POs and Inventory stock issues.
                          </p>
                          <a href="/materials" className="text-primary hover:underline">
                            ← Go to Materials & Procurement Module
                          </a>
                        </div>
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                {/* Admin Construction Config */}
                <Route 
                  path="/admin/construction" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AdminConstructionConfig />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/transmittals" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Transmittals />
                      </AppLayout>
                    </ProtectedRoute>
                  } 
                />
                {/* HR Module */}
                <Route
                  path="/hr"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <HRDashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hr/leave"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <LeaveList />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hr/leave/new"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <LeaveRequestForm />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hr/leave/types"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <LeaveTypesAdmin />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hr/attendance"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Attendance />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hr/people"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <People />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
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
