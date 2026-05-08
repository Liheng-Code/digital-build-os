import { supabase } from "@/integrations/supabase/client";
import type { VariationOrder, VoStatus } from "@/lib/financialMeta";

export const fetchVariationOrders = async (projectId: string): Promise<VariationOrder[]> => {
  const { data, error } = await supabase
    .from("variation_orders")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as VariationOrder[];
};

export const fetchVariationOrderById = async (id: string): Promise<VariationOrder> => {
  const { data, error } = await supabase
    .from("variation_orders")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as VariationOrder;
};

export const createVariationOrder = async (vo: {
  project_id: string;
  wbs_node_id?: string;
  vo_number: string;
  title: string;
  description?: string;
  amount_change: number;
  currency?: string;
  reason?: string;
  budget_id?: string;
}): Promise<VariationOrder> => {
  const { data, error } = await supabase
    .from("variation_orders")
    .insert(vo)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as VariationOrder;
};

export const updateVariationOrderStatus = async (
  id: string,
  status: VoStatus,
  userId: string,
  rejectionReason?: string,
): Promise<void> => {
  const updates: any = { status };
  if (status === "approved") {
    updates.approved_by = userId;
    updates.approved_at = new Date().toISOString();
  }
  if (rejectionReason) updates.rejection_reason = rejectionReason;
  const { error } = await supabase.from("variation_orders").update(updates).eq("id", id);
  if (error) throw error;
};
