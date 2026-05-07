import { supabase } from "@/integrations/supabase/client";
import { QueryFunctionContext } from "@tanstack/react-query";

export interface SupplierInvoice {
  id: string;
  project_id: string;
  po_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved_for_payment' | 'rejected' | 'paid' | 'cancelled';
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  paid_amount: number;
  supplier_id?: string;
  submitted_by?: string;
  approved_by?: string;
  approved_at?: string;
  po_match_status: 'pending' | 'matched' | 'mismatch_quantity' | 'mismatch_price' | 'mismatch_both';
  grn_match_status: 'pending' | 'matched' | 'mismatch_quantity' | 'no_grn';
  notes?: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    name: string;
  };
  purchase_orders?: {
    po_number: string;
    total_amount: number;
  };
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  po_item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  match_status: 'pending' | 'matched' | 'mismatch' | 'no_po_item';
  created_at: string;
}

// Fetch all invoices for a project
export const fetchInvoices = async (projectId: string): Promise<SupplierInvoice[]> => {
  const { data, error } = await supabase
    .from("supplier_invoices")
    .select(`
      *,
      suppliers(id, name),
      purchase_orders(po_number, total_amount),
      invoice_items(count)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Fetch single invoice with details
export const fetchInvoiceById = async (invoiceId: string): Promise<SupplierInvoice> => {
  const { data, error } = await supabase
    .from("supplier_invoices")
    .select(`
      *,
      suppliers(id, name, contact_person, email),
      purchase_orders(
        *,
        po_items(*)
      ),
      invoice_items(*)
    `)
    .eq("id", invoiceId)
    .single();

  if (error) throw error;
  return data;
};

// Create new invoice
export const createInvoice = async (invoice: {
  project_id: string;
  po_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  amount: number;
  tax_amount?: number;
  supplier_id?: string;
}): Promise<SupplierInvoice> => {
  const { data, error } = await supabase
    .from("supplier_invoices")
    .insert({
      project_id: invoice.project_id,
      po_id: invoice.po_id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date || null,
      amount: invoice.amount,
      tax_amount: invoice.tax_amount || 0,
      supplier_id: invoice.supplier_id || null,
    })
    .select(`
      *,
      suppliers(id, name),
      purchase_orders(po_number)
    `)
    .single();

  if (error) throw error;
  return data;
};

// Update invoice status
export const updateInvoiceStatus = async (
  id: string, 
  status: SupplierInvoice['status']
): Promise<SupplierInvoice> => {
  const updateData: any = { status };

  if (status === 'approved_for_payment') {
    updateData.approved_at = new Date().toISOString();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      updateData.approved_by = userData.user.id;
    }
  }

  const { data, error } = await supabase
    .from("supplier_invoices")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      suppliers(id, name)
    `)
    .single();

  if (error) throw error;
  return data;
};

// Create invoice item
export const createInvoiceItem = async (item: {
  invoice_id: string;
  po_item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}): Promise<InvoiceItem> => {
  const { data, error } = await supabase
    .from("invoice_items")
    .insert({
      invoice_id: item.invoice_id,
      po_item_id: item.po_item_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Fetch issued POs for invoice creation
export const fetchIssuedPOs = async (projectId: string) => {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      suppliers(id, name),
      po_items(*)
    `)
    .eq("project_id", projectId)
    .in("status", ['issued', 'partially_delivered', 'completed'])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Update invoice
export const updateInvoice = async (id: string, updates: Partial<SupplierInvoice>): Promise<SupplierInvoice> => {
  const { data, error } = await supabase
    .from("supplier_invoices")
    .update(updates)
    .eq("id", id)
    .select(`
      *,
      suppliers(id, name)
    `)
    .single();

  if (error) throw error;
  return data;
};
