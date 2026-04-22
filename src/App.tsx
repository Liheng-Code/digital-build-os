import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Portfolio from "@/pages/Portfolio";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import CompanyAdmin from "@/pages/CompanyAdmin";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import NotFound from "@/pages/NotFound";
import { MODULES } from "@/lib/modules";

const queryClient = new QueryClient();

const placeholderRoutes = MODULES
  .filter(m => m.status === "coming")
  .map(m => <Route key={m.key} path={m.to} element={<ModulePlaceholder />} />);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/admin/company" element={<CompanyAdmin />} />
              {placeholderRoutes}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
