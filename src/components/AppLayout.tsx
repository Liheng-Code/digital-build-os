import * as React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  ClipboardList,
  Clock,
  CheckSquare,
  Users,
  FileText,
  BarChart3,
  Settings,
  ShieldCheck,
  HardHat,
  LogOut,
  Activity,
  DollarSign,
  ClipboardCheck,
  ShoppingCart,
  Layout,
  BarChart2,
  HelpCircle,
  Info,
  Mail,
  Building2,
  Zap,
  Package,
  Calendar,
  BookOpen,
  Receipt,
  GitCompareArrows,
  TrendingUp,
  Calculator,
  ChevronDown,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { useAuth, ROLE_LABELS, AppRole } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/NotificationBell";
import { useTaskUnread } from "@/hooks/useTaskUnread";
import { useApprovalUnread } from "@/hooks/useApprovalUnread";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AppRole[]; // legacy role-based
  module?: string; // dynamic permission-based
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/project-details", label: "Project Info", icon: Info },
      { to: "/projects", label: "Projects", icon: FolderKanban, module: "projects" },
      { to: "/wbs", label: "WBS", icon: Network, module: "wbs" },
    ],
  },
  {
    label: "Work",
    items: [
      { to: "/tasks", label: "Tasks", icon: ClipboardList, module: "tasks" },
      { to: "/timesheets", label: "Timesheets", icon: Clock, module: "timesheets" },
      { to: "/approvals", label: "Approvals", icon: CheckSquare, module: "approvals",
        roles: ["admin", "project_manager", "supervisor", "accountant", "qaqc_inspector"] },
      { to: "/workload", label: "Workload", icon: Activity,
        roles: ["admin", "project_manager", "supervisor"] },
      { to: "/rfis", label: "RFIs", icon: HelpCircle, module: "rfis" },
    ],
  },
  {
    label: "Design",
    items: [
      { to: "/architecture", label: "Architecture", icon: Layout, module: "architecture" },
      { to: "/structural", label: "Structural Engineering", icon: HardHat, module: "structural" },
      { to: "/mep", label: "MEP Engineering", icon: Zap, module: "mep" },
    ],
  },
  {
    label: "Procurement",
    items: [
      { to: "/procurement", label: "Procurement & MTO", icon: ShoppingCart, module: "procurement" },
      { to: "/procurement/rfqs", label: "RFQs", icon: FileText, module: "procurement" },
      { to: "/procurement/pos", label: "Purchase Orders", icon: ClipboardList, module: "procurement" },
      { to: "/procurement/invoices", label: "Invoices", icon: FileText, module: "procurement" },
      { to: "/procurement/grns", label: "GRNs", icon: Package, module: "procurement" },
      { to: "/procurement/budgets", label: "Budgets", icon: DollarSign, module: "procurement" },
      { to: "/procurement/inventory", label: "Inventory / Stock", icon: Package, module: "inventory" },
      { to: "/procurement/subcontractors", label: "Subcontractors", icon: Building2, module: "subcontractors" },
    ],
  },
  {
    label: "Construction",
    items: [
      { to: "/construction", label: "Construction Management", icon: HardHat, module: "construction" },
      { to: "/daily-reports", label: "Daily Reports", icon: ClipboardCheck, module: "daily_reports",
        roles: ["admin", "project_manager", "engineer", "supervisor", "accountant", "qaqc_inspector", "worker"] },
      { to: "/equipment-tracking", label: "Equipment Tracking", icon: Truck, module: "construction" },
      { to: "/quality", label: "Quality (QA/QC)", icon: ShieldCheck, module: "qaqc" },
      { to: "/hse", label: "Safety & HSE", icon: ShieldCheck, module: "hse" },
    ],
  },
  {
    label: "Project Closure",
    items: [
      { to: "/handover", label: "Handover & Commissioning", icon: Package, module: "construction" },
      { to: "/dlp", label: "Defect Liability (DLP)", icon: AlertTriangle, module: "construction" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/financials", label: "Financial Control", icon: BarChart3, module: "financials" },
      { to: "/financial-reports", label: "Financial Reports", icon: BarChart3, module: "financials" },
      { to: "/kpi-alerts", label: "KPI Alerts", icon: AlertTriangle, module: "financials" },
      { to: "/report-schedules", label: "Report Schedules", icon: Calendar, module: "financials" },

      { to: "/account/client-invoices", label: "Client Invoices", icon: Receipt, module: "financials" },
      { to: "/account/payment-requests", label: "Payment Requests", icon: ClipboardList, module: "financials" },
      { to: "/account/variation-orders", label: "Variation Orders", icon: GitCompareArrows, module: "financials" },
      { to: "/account/cash-flow", label: "Cash Flow", icon: TrendingUp, module: "financials" },
      { to: "/account/chart-of-accounts", label: "Chart of Accounts", icon: BookOpen, module: "financials" },
      { to: "/account/resource-rates", label: "Resource Rates", icon: Calculator, module: "financials" },
      { to: "/account/final-account", label: "Final Account", icon: FileText, module: "financials" },
      { to: "/payroll", label: "Payroll", icon: DollarSign,
        roles: ["admin", "accountant"] },
    ],
  },
  {
    label: "HR Management",
    items: [
      { to: "/hr", label: "HR Dashboard", icon: Activity, module: "hr" },
      { to: "/hr/leave", label: "Leave", icon: Calendar, module: "hr" },
      { to: "/hr/attendance", label: "Attendance", icon: Clock, module: "hr" },
      { to: "/hr/people", label: "People", icon: Users, module: "hr" },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/analytics", label: "Progress & Analytics", icon: BarChart2, module: "analytics" },
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/executive-dashboard", label: "Executive Dashboard", icon: BarChart3,
        roles: ["admin", "project_manager"] },
      { to: "/client-dashboard", label: "Client Dashboard", icon: BarChart3,
        roles: ["admin"] },
      { to: "/documents", label: "Document Register", icon: FileText },
      { to: "/transmittals", label: "Transmittals", icon: Mail },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/stakeholders", label: "Stakeholders", icon: Building2, module: "stakeholders", roles: ["admin", "project_manager"] },
      { to: "/team", label: "Team & Roles", icon: Users, roles: ["admin"] },
      { to: "/permissions", label: "Permissions", icon: ShieldCheck, roles: ["admin"] },
      { to: "/audit", label: "Audit Log", icon: ShieldCheck, roles: ["admin"] },
      { to: "/admin/config", label: "Admin Config", icon: Settings, roles: ["admin"] },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function AppSidebar() {
  const { roles } = useAuth();
  const { can } = usePermissions();
  const { totalTaskUnread } = useTaskUnread();
  const { totalApprovalUnread } = useApprovalUnread();
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(
    () => new Set(NAV_GROUPS.length > 0 ? [NAV_GROUPS[0].label] : [])
  );
  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };
  
  const canSee = (item: NavItem) => {
    // If it has a module, check dynamic permissions
    if (item.module) {
      return can("view", item.module);
    }
    // Fallback to legacy roles check
    return !item.roles || item.roles.some((r) => roles.includes(r));
  };

  const badgeFor = (to: string): number => {
    if (to === "/tasks") return totalTaskUnread;
    if (to === "/approvals") return totalApprovalUnread;
    return 0;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground shrink-0">
            <HardHat className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-sidebar-foreground">BuildTrack</span>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Construction OS</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(canSee);
          if (items.length === 0) return null;
          const isOpen = openGroups.has(group.label);
          return (
            <SidebarGroup key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
              >
                {group.label}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    isOpen ? "" : "-rotate-90"
                  }`}
                />
              </button>
              <SidebarGroupContent
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <SidebarMenu>
                  {items.map((item) => {
                    const count = badgeFor(item.to);
                    const tooltip = count > 0 ? `${item.label} (${count} new)` : item.label;
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild tooltip={tooltip}>
                          <NavLink
                            to={item.to}
                            end={item.to === "/"}
                            className={({ isActive }) =>
                              isActive ? "data-[active=true]:bg-sidebar-accent" : ""
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span className="relative flex items-center justify-center">
                                  <item.icon className={isActive ? "text-sidebar-primary" : ""} />
                                  {count > 0 && (
                                    <span
                                      aria-hidden
                                      className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar group-data-[collapsible=icon]:block hidden"
                                    />
                                  )}
                                </span>
                                <span className="flex-1">{item.label}</span>
                                {count > 0 && (
                                  <span
                                    aria-label={`${count} unread`}
                                    className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-none group-data-[collapsible=icon]:hidden"
                                  >
                                    {count > 9 ? "9+" : count}
                                  </span>
                                )}
                              </>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1 text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          v0.1 · Phase 1
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, roles, signOut, user } = useAuth();
  const navigate = useNavigate();

  const initials =
    (profile?.full_name || user?.email || "?")
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const primaryRole = roles[0];

  const onSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 border-b bg-card flex items-center px-4 gap-3 sticky top-0 z-20">
            <SidebarTrigger />
            <div className="hidden md:block">
              <ProjectSwitcher />
            </div>
            <div className="flex-1" />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 h-9">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-sm font-medium">{profile?.full_name || user?.email}</span>
                    {primaryRole && (
                      <span className="text-[10px] text-muted-foreground">{ROLE_LABELS[primaryRole]}</span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{profile?.full_name || "Account"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {roles.map((r) => (
                        <Badge key={r} variant="secondary" className="text-[10px]">
                          {ROLE_LABELS[r]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 px-4 lg:px-6 py-6 w-full min-w-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
