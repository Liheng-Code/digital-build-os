import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectHoliday {
  id: string;
  project_id: string;
  holiday_date: string;
  label: string | null;
  created_at: string;
}

export function useProjectHolidays(projectId: string | null | undefined) {
  const query = useQuery<ProjectHoliday[]>({
    queryKey: ["project-holidays", projectId ?? null],
    enabled: !!projectId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("project_holidays")
        .select("*")
        .eq("project_id", projectId!)
        .order("holiday_date", { ascending: true });
      return (data ?? []) as ProjectHoliday[];
    },
  });

  const holidays = query.data ?? [];
  const dateSet = useMemo(() => new Set(holidays.map((h) => h.holiday_date)), [holidays]);
  const refresh = useMemo(() => async () => { await query.refetch(); }, [query]);

  return { holidays, dateSet, loading: query.isLoading, refresh };
}
