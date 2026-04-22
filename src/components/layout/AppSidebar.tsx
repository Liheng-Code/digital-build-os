import { NavLink, useLocation } from "react-router-dom";
import { Building2, ChevronRight } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { MODULE_GROUPS, MODULES } from "@/lib/modules";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-md gradient-primary grid place-items-center shadow-glow shrink-0">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">DCOS</div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase">Construction OS</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {MODULE_GROUPS.map((group) => {
          const items = MODULES.filter((m) => m.group === group.id);
          if (!items.length) return null;
          return (
            <SidebarGroup key={group.id}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((m) => {
                    const Icon = m.icon;
                    const active = pathname === m.to || (m.to !== "/" && pathname.startsWith(m.to));
                    return (
                      <SidebarMenuItem key={m.key}>
                        <SidebarMenuButton asChild tooltip={m.title}>
                          <NavLink
                            to={m.to}
                            end={m.to === "/"}
                            className={cn(
                              "group flex items-center gap-2 rounded-md transition-all",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                                : "hover:bg-sidebar-accent/60",
                            )}
                          >
                            <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                            {!collapsed && (
                              <>
                                <span className="flex-1 text-sm">{m.title}</span>
                                {m.status === "coming" && (
                                  <Badge variant="outline" className="h-4 px-1 text-[9px] font-mono uppercase border-surface-3 text-muted-foreground">
                                    soon
                                  </Badge>
                                )}
                                {active && <ChevronRight className="h-3 w-3 text-primary" />}
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

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-2 py-2 text-[10px] font-mono text-muted-foreground/60">
            v1.0 · Iteration 1
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
