import { ArrowDown, ArrowUp, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  delta?: number;
  unit?: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive";
};

const accentMap = {
  primary: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  destructive: "text-destructive bg-destructive/10",
};

export function KpiCard({ label, value, delta, unit, icon: Icon, accent = "primary" }: Props) {
  return (
    <Card className="relative p-5 shadow-card overflow-hidden group hover:border-primary/30 transition-colors">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--gradient-glow)" }} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono-tabular tracking-tight">{value}</span>
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
          {delta !== undefined && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-mono-tabular",
              delta >= 0 ? "text-success" : "text-destructive",
            )}>
              {delta >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}% vs last period
            </div>
          )}
        </div>
        <div className={cn("h-10 w-10 rounded-lg grid place-items-center shrink-0", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
