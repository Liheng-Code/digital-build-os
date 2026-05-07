import { supabase } from "@/integrations/supabase/client";
import { QueryFunctionContext } from "@tanstack/react-query";

export interface RFQ {
  id: string;
  project_id: string;
  pr_id?: string;
  rfq_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'issued' | 'closed' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
  purchase_requisitions?: {
    pr_number: string;
  };
  rfq_suppliers?: RFQSupplier[];
  _count?: {
    rfq_suppliers: number;
    supplier_quotations: number;
  };
}

export interface RFQSupplier {
  id: string;
  rfq_id: string;
  supplier_id: string;
  invitation_date?: string;
  response_status: 'pending' | 'responded' | 'declined';
  notes?: string;
  suppliers?: {
    id: string;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
  };
}

export interface SupplierQuotation {
  id: string;
  rfq_id: string;
  supplier_id: string;
  quotation_number?: string;
  quotation_date: string;
  total_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  attachment_url?: string;
  notes?: string;
  created_at: string;
  suppliers?: {
    id: string;
    name: string;
  };
  quotation_items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  technical_compliance?: string;
  pr_item_id?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
}

// Fetch all RFQs for a project
export const fetchRFQs = async (projectId: string): Promise<RFQ[]> => {
  const { data, error } = await supabase
    .from("rfq")
    .select(`
      *,
      purchase_requisitions(pr_number),
      rfq_suppliers(count),
      supplier_quotations(count)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Fetch single RFQ with details
export const fetchRFQById = async (rfqId: string): Promise<RFQ> => {
  const { data, error } = await supabase
    .from("rfq")
    .select(`
      *,
      purchase_requisitions(pr_number, pr_number),
      rfq_suppliers(
        *,
        suppliers(id, name, contact_person, email, phone)
      ),
      supplier_quotations(
        *,
        suppliers(id, name),
        quotation_items(*)
      )
    `)
    .eq("id", rfqId)
    .single();

  if (error) throw error;
  return data;
};

// Create new RFQ
export const createRFQ = async (rfq: {
  project_id: string;
  pr_id?: string;
  due_date: string;
  status?: 'draft' | 'issued';
}): Promise<RFQ> => {
  const { data, error } = await supabase
    .from("rfq")
    .insert({
      project_id: rfq.project_id,
      pr_id: rfq.pr_id || null,
      due_date: rfq.due_date,
      status: rfq.status || 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update RFQ
export const updateRFQ = async (id: string, updates: Partial<RFQ>): Promise<RFQ> => {
  const { data, error } = await supabase
    .from("rfq")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Add supplier to RFQ
export const addSupplierToRFQ = async (rfqSupplier: {
  rfq_id: string;
  supplier_id: string;
  invitation_date?: string;
}): Promise<RFQSupplier> => {
  const { data, error } = await supabase
    .from("rfq_suppliers")
    .insert({
      rfq_id: rfqSupplier.rfq_id,
      supplier_id: rfqSupplier.supplier_id,
      invitation_date: rfqSupplier.invitation_date || new Date().toISOString().split('T')[0],
      response_status: 'pending',
    })
    .select(`
      *,
      suppliers(id, name, contact_person, email, phone)
    `)
    .single();

  if (error) throw error;
  return data;
};

// Remove supplier from RFQ
export const removeSupplierFromRFQ = async (rfqSupplierId: string): Promise<void> => {
  const { error } = await supabase
    .from("rfq_suppliers")
    .delete()
    .eq("id", rfqSupplierId);

  if (error) throw error;
};

// Create supplier quotation
export const createQuotation = async (quotation: {
  rfq_id: string;
  supplier_id: string;
  quotation_date: string;
  quotation_number?: string;
  total_amount?: number;
  status?: 'draft' | 'submitted';
  attachment_url?: string;
  notes?: string;
}): Promise<SupplierQuotation> => {
  const { data, error } = await supabase
    .from("supplier_quotations")
    .insert({
      rfq_id: quotation.rfq_id,
      supplier_id: quotation.supplier_id,
      quotation_date: quotation.quotation_date,
      quotation_number: quotation.quotation_number,
      total_amount: quotation.total_amount || 0,
      status: quotation.status || 'draft',
      attachment_url: quotation.attachment_url,
      notes: quotation.notes,
    })
    .select(`
      *,
      suppliers(id, name)
    `)
    .single();

  if (error) throw error;
  return data;
};

// Add quotation item
export const addQuotationItem = async (item: {
  quotation_id: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  technical_compliance?: string;
  pr_item_id?: string;
}): Promise<QuotationItem> => {
  const { data, error } = await supabase
    .from("quotation_items")
    .insert({
      quotation_id: item.quotation_id,
      item_description: item.item_description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      technical_compliance: item.technical_compliance,
      pr_item_id: item.pr_item_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update quotation item with technical compliance
export const updateQuotationItem = async (itemId: string, updates: Partial<QuotationItem>): Promise<QuotationItem> => {
  const { data, error } = await supabase
    .from("quotation_items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update quotation status (for approval/rejection)
export const updateQuotationStatus = async (quotationId: string, status: 'draft' | 'submitted' | 'approved' | 'rejected'): Promise<SupplierQuotation> => {
  const { data, error } = await supabase
    .from("supplier_quotations")
    .update({ status })
    .eq("id", quotationId)
    .select(`
      *,
      suppliers(id, name)
    `)
    .single();

   if (error) throw error;
   return data;
};

// Fetch suppliers for RFQ
export const fetchSuppliers = async (projectId?: string) => {
   let query = supabase
     .from("suppliers")
     .select("id, name, contact_person, email, phone, address, status")
     .eq("status", "active")
     .order("name");

   if (projectId) {
     // Optionally filter to suppliers already used in this project
     query = query.or(`id.in.(select supplier_id from purchase_orders where project_id = '${projectId}'),status.eq.active`);
   }

   const { data, error } = await query;
   if (error) throw error;
   return data || [];
};

// Fetch PRs available for RFQ creation
export const fetchAvailablePRs = async (projectId: string) => {
  const { data, error } = await supabase
    .from("purchase_requisitions")
    .select("id, pr_number, status, project_id")
    .eq("project_id", projectId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};
