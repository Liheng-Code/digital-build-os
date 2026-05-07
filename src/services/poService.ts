import { supabase } from "@/integrations/supabase/client";
import { QueryFunctionContext } from "@tanstack/react-query";

export interface PurchaseOrder {
  id: string;
  project_id: string;
  rfq_id?: string;
  quotation_id?: string;
  po_number: string;
  supplier_id: string;
  status: 'draft' | 'submitted' | 'review' | 'finance_approved' | 'issued' | 'partially_delivered' | 'completed' | 'cancelled';
  po_date: string;
  delivery_terms?: string;
  payment_terms?: string;
  total_amount: number;
  currency?: string;
  expected_delivery?: string;
  actual_delivery?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    name: string;
    contact_person?: string;
    email?: string;
  };
  rfq?: {
    rfq_number: string;
  };
  supplier_quotations?: {
    quotation_number?: string;
  };
  po_items?: POItem[];
}

export interface POItem {
  id: string;
  po_id: string;
  quotation_item_id?: string;
  pr_item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivered_quantity: number;
  created_at: string;
}

// Fetch all POs for a project
export const fetchPOs = async (projectId: string): Promise<PurchaseOrder[]> => {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      suppliers(id, name, contact_person, email),
      rfq(rfq_number),
      supplier_quotations(quotation_number),
      po_items(count)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Fetch single PO with details
export const fetchPOById = async (poId: string): Promise<PurchaseOrder> => {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      suppliers(id, name, contact_person, email, phone, address),
      rfq(rfq_number, issue_date, due_date),
      supplier_quotations(
        *,
        quotation_items(*)
      ),
      po_items(*)
    `)
    .eq("id", poId)
    .single();

  if (error) throw error;
  return data;
};

// Create new PO from quotation
export const createPO = async (po: {
  project_id: string;
  rfq_id?: string;
  quotation_id?: string;
  supplier_id: string;
  status?: 'draft' | 'submitted';
  po_date?: string;
  delivery_terms?: string;
  payment_terms?: string;
  total_amount?: number;
  expected_delivery?: string;
}): Promise<PurchaseOrder> => {
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      project_id: po.project_id,
      rfq_id: po.rfq_id || null,
      quotation_id: po.quotation_id || null,
      supplier_id: po.supplier_id,
      status: po.status || 'draft',
      po_date: po.po_date || new Date().toISOString().split('T')[0],
      delivery_terms: po.delivery_terms,
      payment_terms: po.payment_terms,
      total_amount: po.total_amount || 0,
      expected_delivery: po.expected_delivery,
    })
    .select(`
      *,
      suppliers(id, name)
    `)
    .single();

  if (error) throw error;
  return data;
};

// Update PO status (for workflow)
export const updatePOStatus = async (id: string, status: PurchaseOrder['status']): Promise<PurchaseOrder> => {
  const updateData: any = { status };

  
  if (status === 'finance_approved') {
    updateData.approved_at = new Date().toISOString();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      updateData.approved_by = userData.user.id;
    }
  }

  const { data, error } = await supabase
    .from("purchase_orders")
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

// Fetch approved quotations that can be converted to PO
export const fetchApprovedQuotations = async (projectId: string) => {
  const { data, error } = await supabase
    .from("supplier_quotations")
    .select(`
      *,
      rfq!inner(project_id),
      suppliers(id, name),
      quotation_items(*)
    `)
    .eq("rfq.project_id", projectId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Create PO items from quotation items
export const createPOItemsFromQuotation = async (poId: string, quotationItems: any[]): Promise<void> => {
  const poItems = quotationItems.map(item => ({
    po_id: poId,
    quotation_item_id: item.id,
    pr_item_id: item.pr_item_id,
    description: item.item_description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    delivered_quantity: 0,
  }));

  const { error } = await supabase
    .from("po_items")
    .insert(poItems);

  if (error) throw error;
};

// Update PO
export const updatePO = async (id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
  const { data, error } = await supabase
    .from("purchase_orders")
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
