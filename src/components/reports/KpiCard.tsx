import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

export type KpiTone = "default" | "success" | "warning" | "destructive";

export interface KpiCardProps {
  icon?: LucideIcon | React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
    tone?: KpiTone;
  };
  tone?: KpiTone;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

const TONE_STYLES: Record<KpiTone, { value: string; border: string; bg: string }> = {
  default: { value: "", border: "", bg: "" },
  success: { value: "text-success", border: "border-l-success", bg: "bg-success-soft" },
  warning: { value: "text-warning", border: "border-l-warning", bg: "bg-warning-soft" },
  destructive: { value: "text-destructive", border: "border-l-destructive", bg: "bg-destructive-soft" },
};

const TREND_ICONS: Record<string, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export function KpiCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  tone = "default",
  onClick,
  className,
  loading = false,
}: KpiCardProps) {
  const toneStyle = TONE_STYLES[tone];

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4 space-y-3">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          <div className="h-7 w-28 bg-muted rounded animate-pulse" />
          {subtitle && <div className="h-3 w-16 bg-muted rounded animate-pulse" />}
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trend ? TREND_ICONS[trend.direction] : null;

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-default transition-shadow hover:shadow-md",
        tone !== "default" && toneStyle.border ? "border-l-4" : "",
        tone !== "default" ? toneStyle.border : "",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
          {icon && (
            <span className={cn("shrink-0", toneStyle.value || "text-muted-foreground")}>
              {React.isValidElement(icon) ? icon : React.createElement(icon as LucideIcon, { className: "h-4 w-4" })}
            </span>
          )}
        </div>

        <div className={cn("mt-1 text-2xl font-bold tracking-tight", toneStyle.value)}>
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {trend && TrendIcon && (
              <span className={cn(
                "inline-flex items-center gap-0.5 shrink-0",
                trend.tone ? TONE_STYLES[trend.tone].value : toneStyle.value,
              )}>
                <TrendIcon className="h-3 w-3" />
                {trend.value}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
