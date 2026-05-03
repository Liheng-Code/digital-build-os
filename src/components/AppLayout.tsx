import { NavLink, useNavigate } from "react-router-dom";
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
  Package,
} from "lucide-react";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { useAuth, ROLE_LABELS, AppRole } from "@/contexts/AuthContext";
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
  roles?: AppRole[]; // if omitted, available to everyone signed in
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/wbs", label: "WBS", icon: Network },
    ],
  },
  {
    label: "Work",
    items: [
      { to: "/tasks", label: "Tasks", icon: ClipboardList },
      { to: "/daily-reports", label: "Daily Reports", icon: ClipboardCheck,
        roles: ["admin", "project_manager", "engineer", "supervisor", "accountant", "qaqc_inspector", "worker"] },
      { to: "/timesheets", label: "Timesheets", icon: Clock },
      { to: "/approvals", label: "Approvals", icon: CheckSquare,
        roles: ["admin", "project_manager", "supervisor", "accountant", "qaqc_inspector"] },
      { to: "/workload", label: "Workload", icon: Activity,
        roles: ["admin", "project_manager", "supervisor"] },
      { to: "/materials", label: "Materials", icon: Package },
      { to: "/quality", label: "Quality (QA/QC)", icon: ShieldCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/payroll", label: "Payroll", icon: DollarSign,
        roles: ["admin", "accountant"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/reports", label: "Reports", icon: BarChart3,
        roles: ["admin", "project_manager", "accountant"] },
      { to: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/team", label: "Team & Roles", icon: Users, roles: ["admin"] },
      { to: "/audit", label: "Audit Log", icon: ShieldCheck, roles: ["admin"] },
      { to: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
    ],
  },
];

function AppSidebar() {
  const { roles } = useAuth();
  const { totalTaskUnread } = useTaskUnread();
  const { totalApprovalUnread } = useApprovalUnread();
  const canSee = (item: NavItem) =>
    !item.roles || item.roles.some((r) => roles.includes(r));

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
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
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

          <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
