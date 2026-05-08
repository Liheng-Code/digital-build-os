import { supabase } from "@/integrations/supabase/client";
import type { ClientInvoice, ClientInvoicePayment, ArInvoiceStatus } from "@/lib/financialMeta";

export const fetchClientInvoices = async (projectId: string): Promise<ClientInvoice[]> => {
  const { data, error } = await supabase
    .from("client_invoices")
    .select("*")
    .eq("project_id", projectId)
    .order("invoice_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ClientInvoice[];
};

export const fetchClientInvoiceById = async (id: string): Promise<ClientInvoice> => {
  const { data, error } = await supabase
    .from("client_invoices")
    .select("*, client_invoice_payments(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as ClientInvoice;
};

export const createClientInvoice = async (inv: {
  project_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  period_start?: string;
  period_end?: string;
  amount: number;
  tax_amount?: number;
  claim_id?: string;
  retention_pct?: number;
  notes?: string;
}): Promise<ClientInvoice> => {
  const { data, error } = await supabase
    .from("client_invoices")
    .insert(inv)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ClientInvoice;
};

export const updateClientInvoiceStatus = async (
  id: string,
  status: ArInvoiceStatus,
): Promise<void> => {
  const { error } = await supabase.from("client_invoices").update({ status }).eq("id", id);
  if (error) throw error;
};

export const recordClientPayment = async (payment: {
  client_invoice_id: string;
  payment_date: string;
  amount: number;
  payment_ref?: string;
  notes?: string;
}): Promise<ClientInvoicePayment> => {
  const { data, error } = await supabase
    .from("client_invoice_payments")
    .insert(payment)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ClientInvoicePayment;
};
