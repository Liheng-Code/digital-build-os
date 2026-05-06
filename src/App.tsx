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
                  path="/transmittals" 
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Transmittals />
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
