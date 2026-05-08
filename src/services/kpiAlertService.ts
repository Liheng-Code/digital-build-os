import { supabase } from "@/integrations/supabase/client";
import type { KpiAlertThreshold, KpiAlertEvent, KpiAlertCategory } from "@/lib/reportingMeta";

// ============================================================
// Threshold CRUD
// ============================================================

export async function fetchKpiAlertThresholds(projectId: string): Promise<KpiAlertThreshold[]> {
  const { data, error } = await (supabase as any)
    .from("kpi_alert_thresholds")
    .select("*")
    .eq("project_id", projectId)
    .order("kpi_category", { ascending: true })
    .order("kpi_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertKpiAlertThreshold(threshold: Partial<KpiAlertThreshold> & { project_id: string }): Promise<KpiAlertThreshold> {
  const { data, error } = await (supabase as any)
    .from("kpi_alert_thresholds")
    .upsert(threshold, { onConflict: "project_id,kpi_name,operator" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteKpiAlertThreshold(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("kpi_alert_thresholds")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================================
// Alert Events
// ============================================================

export async function fetchKpiAlertEvents(projectId: string): Promise<KpiAlertEvent[]> {
  const { data, error } = await (supabase as any)
    .from("kpi_alert_events")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function markKpiAlertEventRead(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("kpi_alert_events")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllKpiAlertEventsRead(projectId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("kpi_alert_events")
    .update({ read_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .is("read_at", null);

  if (error) throw error;
}

export async function clearKpiAlertEvents(projectId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("kpi_alert_events")
    .delete()
    .eq("project_id", projectId);

  if (error) throw error;
}

// ============================================================
// Evaluation
// ============================================================

function evaluateOperator(actual: number, threshold: number, operator: string): boolean {
  switch (operator) {
    case "gt": return actual > threshold;
    case "lt": return actual < threshold;
    case "gte": return actual >= threshold;
    case "lte": return actual <= threshold;
    case "eq": return Math.abs(actual - threshold) < 0.001;
    default: return false;
  }
}

export async function evaluateKpiAlerts(
  projectId: string,
  kpiData: Record<string, number>
): Promise<number> {
  const thresholds = await fetchKpiAlertThresholds(projectId);
  const activeThresholds = thresholds.filter((t: KpiAlertThreshold) => t.enabled);

  let newAlertCount = 0;

  for (const threshold of activeThresholds) {
    const actualValue = kpiData[threshold.kpi_name];
    if (actualValue === undefined) continue;

    const breached = evaluateOperator(actualValue, threshold.threshold_value, threshold.operator);
    if (!breached) continue;

    const message = `${threshold.label} ${KPI_ALERT_OPERATOR_LABELS[threshold.operator]} ${threshold.threshold_value} (actual: ${actualValue})`;

    const { error } = await (supabase as any)
      .from("kpi_alert_events")
      .insert({
        project_id: projectId,
        kpi_name: threshold.kpi_name,
        kpi_category: threshold.kpi_category,
        actual_value: actualValue,
        threshold_value: threshold.threshold_value,
        operator: threshold.operator,
        severity: threshold.severity,
        message,
      });

    if (!error) newAlertCount++;
  }

  return newAlertCount;
}

const KPI_ALERT_OPERATOR_LABELS: Record<string, string> = {
  gt: "exceeded",
  lt: "fell below",
  gte: "exceeded or met",
  lte: "fell below or met",
  eq: "equaled",
};
