import * as React from "react";
import { cn } from "@/lib/utils";

export interface KpiGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLUMN_CLASSES: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function KpiGrid({ children, columns = 4, className }: KpiGridProps) {
  return (
    <div className={cn("grid gap-4", COLUMN_CLASSES[columns], className)}>
      {children}
    </div>
  );
}
