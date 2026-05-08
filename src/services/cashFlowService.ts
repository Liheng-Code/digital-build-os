import { supabase } from "@/integrations/supabase/client";
import type { CashFlowProjection, CashFlowCategory, CashFlowItemStatus } from "@/lib/financialMeta";

export const fetchCashFlowProjections = async (projectId: string): Promise<CashFlowProjection[]> => {
  const { data, error } = await supabase
    .from("cash_flow_projections")
    .select("*")
    .eq("project_id", projectId)
    .order("period_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CashFlowProjection[];
};

export const createCashFlowItem = async (item: {
  project_id: string;
  period_date: string;
  category: CashFlowCategory;
  description?: string;
  forecast_amount: number;
  is_inflow: boolean;
  notes?: string;
}): Promise<CashFlowProjection> => {
  const { data, error } = await supabase
    .from("cash_flow_projections")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as CashFlowProjection;
};

export const updateCashFlowActual = async (
  id: string,
  actualAmount: number,
): Promise<void> => {
  const { error } = await supabase
    .from("cash_flow_projections")
    .update({ actual_amount: actualAmount, status: "actual" })
    .eq("id", id);
  if (error) throw error;
};

export const updateCashFlowItem = async (
  id: string,
  updates: Partial<CashFlowProjection>,
): Promise<void> => {
  const { error } = await supabase
    .from("cash_flow_projections")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
};

export const deleteCashFlowItem = async (id: string): Promise<void> => {
  const { error } = await supabase.from("cash_flow_projections").delete().eq("id", id);
  if (error) throw error;
};
