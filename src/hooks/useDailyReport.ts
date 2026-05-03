import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDailyReport(dsrId: string | undefined) {
  return useQuery({
    queryKey: ["dsr", dsrId],
    enabled: !!dsrId,
    queryFn: async () => {
      const id = dsrId!;
      const [report, manpower, equipment, progress, delays, visitors, attachments] = await Promise.all([
        supabase.from("daily_site_reports").select("*").eq("id", id).maybeSingle(),
        supabase.from("daily_manpower").select("*").eq("dsr_id", id).order("created_at"),
        supabase.from("daily_equipment").select("*").eq("dsr_id", id).order("created_at"),
        supabase.from("daily_progress_entries").select("*").eq("dsr_id", id).order("created_at"),
        supabase.from("daily_delays").select("*").eq("dsr_id", id).order("created_at"),
        supabase.from("daily_visitors").select("*").eq("dsr_id", id).order("created_at"),
        supabase.from("dsr_attachments").select("*").eq("dsr_id", id).order("created_at"),
      ]);
      return {
        report: report.data,
        manpower: manpower.data ?? [],
        equipment: equipment.data ?? [],
        progress: progress.data ?? [],
        delays: delays.data ?? [],
        visitors: visitors.data ?? [],
        attachments: attachments.data ?? [],
      };
    },
  });
}

export function useDsrList(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["dsr-list", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_site_reports")
        .select("*")
        .eq("project_id", projectId!)
        .order("report_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}
