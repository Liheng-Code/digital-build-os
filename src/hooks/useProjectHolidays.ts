import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectHoliday {
  id: string;
  project_id: string;
  holiday_date: string; // ISO date
  label: string | null;
  created_at: string;
}

export function useProjectHolidays(projectId: string | null | undefined) {
  const [holidays, setHolidays] = useState<ProjectHoliday[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setHolidays([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("project_holidays")
      .select("*")
      .eq("project_id", projectId)
      .order("holiday_date", { ascending: true });
    setHolidays((data ?? []) as ProjectHoliday[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const dateSet = useMemo(
    () => new Set(holidays.map((h) => h.holiday_date)),
    [holidays],
  );

  return { holidays, dateSet, loading, refresh };
}
