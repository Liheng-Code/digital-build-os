import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressGaugeProps {
  value: number;
  max?: number;
  label?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

const SIZE_CONFIG = {
  sm: { outer: 64, stroke: 6, fontSize: "text-xs" as const, labelSize: "text-[10px]" as const },
  md: { outer: 96, stroke: 8, fontSize: "text-sm" as const, labelSize: "text-xs" as const },
  lg: { outer: 128, stroke: 10, fontSize: "text-base" as const, labelSize: "text-sm" as const },
};

const TONE_COLORS: Record<string, { stroke: string; bg: string }> = {
  default: { stroke: "stroke-primary", bg: "stroke-primary/20" },
  success: { stroke: "stroke-success", bg: "stroke-success/20" },
  warning: { stroke: "stroke-warning", bg: "stroke-warning/20" },
  destructive: { stroke: "stroke-destructive", bg: "stroke-destructive/20" },
};

export function ProgressGauge({
  value,
  max = 100,
  label,
  subtitle,
  size = "md",
  tone = "default",
  className,
}: ProgressGaugeProps) {
  const config = SIZE_CONFIG[size];
  const colors = TONE_COLORS[tone];
  const radius = (config.outer - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), max);
  const progress = clampedValue / max;
  const offset = circumference * (1 - progress);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg
        width={config.outer}
        height={config.outer}
        viewBox={`0 0 ${config.outer} ${config.outer}`}
        className="transform -rotate-90"
      >
        <circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          className={colors.bg}
          strokeWidth={config.stroke}
        />
        <circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          className={colors.stroke}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: config.outer, height: config.outer }}>
        <span className={cn("font-bold", config.fontSize, colors.stroke.replace("stroke-", "text-"))}>
          {Math.round(clampedValue)}%
        </span>
      </div>
      {label && (
        <span className={cn("font-medium text-muted-foreground", config.labelSize)}>
          {label}
        </span>
      )}
      {subtitle && (
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}
