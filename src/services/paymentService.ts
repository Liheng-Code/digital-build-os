import { supabase } from "@/integrations/supabase/client";
import type { PaymentRequest, PaymentRequestItem, PaymentRequestStatus, PaymentRequestType } from "@/lib/financialMeta";

export const fetchPaymentRequests = async (projectId: string): Promise<PaymentRequest[]> => {
  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PaymentRequest[];
};

export const fetchPaymentRequestById = async (id: string): Promise<PaymentRequest> => {
  const { data, error } = await supabase
    .from("payment_requests")
    .select("*, payment_request_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as PaymentRequest;
};

export const createPaymentRequest = async (req: {
  project_id: string;
  request_number: string;
  request_type: PaymentRequestType;
  payee_name: string;
  amount: number;
  due_date?: string;
  description?: string;
  notes?: string;
}): Promise<PaymentRequest> => {
  const { data, error } = await supabase
    .from("payment_requests")
    .insert(req)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PaymentRequest;
};

export const updatePaymentRequestStatus = async (
  id: string,
  status: PaymentRequestStatus,
  userId: string,
  rejectionReason?: string,
): Promise<void> => {
  const updates: any = { status };
  if (status === "approved") {
    updates.approved_by = userId;
    updates.approved_at = new Date().toISOString();
  }
  if (status === "paid") {
    updates.paid_at = new Date().toISOString();
  }
  if (rejectionReason) updates.rejection_reason = rejectionReason;
  const { error } = await supabase.from("payment_requests").update(updates).eq("id", id);
  if (error) throw error;
};

export const addPaymentRequestItem = async (item: {
  payment_request_id: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  reference_type?: string;
  reference_id?: string;
}): Promise<PaymentRequestItem> => {
  const { data, error } = await supabase
    .from("payment_request_items")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PaymentRequestItem;
};
