
import * as React from "react";
import { Stakeholder, STAKEHOLDER_TYPE_LABELS, StakeholderType } from "@/lib/stakeholderMeta";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Building2, HardHat, Compass, Truck, ShieldCheck, TestTube2, HelpCircle } from "lucide-react";

interface StakeholderSidebarProps {
  stakeholders: Stakeholder[];
  activeType: StakeholderType | "all";
  onTypeChange: (type: StakeholderType | "all") => void;
}

const TYPE_ICONS: Record<string, any> = {
  all: LayoutGrid,
  client: Building2,
  contractor: HardHat,
  consultant: Compass,
  subcontractor: HardHat,
  supplier: Truck,
  authority: ShieldCheck,
  testing_agency: TestTube2,
  other: HelpCircle,
};

export function StakeholderSidebar({ stakeholders, activeType, onTypeChange }: StakeholderSidebarProps) {
  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: stakeholders.length };
    stakeholders.forEach((s) => {
      c[s.type] = (c[s.type] || 0) + 1;
    });
    return c;
  }, [stakeholders]);

  const items: { id: StakeholderType | "all"; label: string; icon: any }[] = [
    { id: "all", label: "All Stakeholders", icon: LayoutGrid },
    { id: "client", label: "Client / Owner", icon: Building2 },
    { id: "consultant", label: "Consultant", icon: Compass },
    { id: "contractor", label: "Main Contractor", icon: HardHat },
    { id: "subcontractor", label: "Subcontractor", icon: HardHat },
    { id: "supplier", label: "Supplier / Vendor", icon: Truck },
    { id: "authority", label: "Authority", icon: ShieldCheck },
    { id: "other", label: "Other", icon: HelpCircle },
  ];

  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-1 pr-4 border-r h-full">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight text-primary">
          Classification
        </h2>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTypeChange(item.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
                <Badge 
                  variant={isActive ? "secondary" : "outline"} 
                  className={cn("px-1.5 py-0 text-[10px] h-4 min-w-[20px] justify-center", isActive ? "bg-white/20 border-transparent text-white" : "text-muted-foreground")}
                >
                  {counts[item.id] || 0}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
