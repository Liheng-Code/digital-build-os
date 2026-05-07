import { supabase } from "@/integrations/supabase/client";
import { QueryFunctionContext } from "@tanstack/react-query";

export interface GRN {
  id: string;
  po_id: string;
  project_id: string;
  grn_number: string;
  delivery_note_number?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  received_by?: string;
  delivery_date: string;
  actual_delivery_date?: string;
  inspection_required?: boolean;
  inspection_passed?: boolean;
  inspection_notes?: string;
  delivery_status: 'pending' | 'partially_received' | 'completed' | 'rejected';
  po_match_status: 'pending' | 'matched' | 'mismatch_quantity' | 'mismatch_price' | 'no_po';
  created_at: string;
  purchase_orders?: {
    po_number: string;
    total_amount: number;
    suppliers?: { name: string };
  };
  grn_items?: GRNItem[];
}

export interface GRNItem {
  id: string;
  grn_id: string;
  po_item_id?: string;
  material_name: string;
  uom: string;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  po_quantity?: number;
  quantity_match_status: 'pending' | 'matched' | 'mismatch' | 'no_po_item';
  quality_status: 'pending' | 'passed' | 'failed';
  rejected_reason?: string;
}

// Fetch all GRNs for a project
export const fetchGRNs = async (projectId: string): Promise<GRN[]> => {
  const { data, error } = await supabase
    .from("grns")
    .select(`
      *,
      purchase_orders(
        po_number, 
        total_amount,
        suppliers(name)
      ),
      grn_items(count)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Fetch single GRN with details
export const fetchGRNById = async (grnId: string): Promise<GRN> => {
  const { data, error } = await supabase
    .from("grns")
    .select(`
      *,
      purchase_orders(
        *,
        po_items(*)
      ),
      grn_items(*)
    `)
    .eq("id", grnId)
    .single();

  if (error) throw error;
  return data;
};

// Create new GRN from PO
export const createGRN = async (grn: {
  project_id: string;
  po_id: string;
  grn_number: string;
  delivery_date?: string;
  delivery_note_number?: string;
  vehicle_number?: string;
  driver_name?: string;
}): Promise<GRN> => {
  const { data, error } = await supabase
    .from("grns")
    .insert({
      project_id: grn.project_id,
      po_id: grn.po_id,
      grn_number: grn.grn_number,
      delivery_date: grn.delivery_date || new Date().toISOString().split('T')[0],
      delivery_note_number: grn.delivery_note_number,
      vehicle_number: grn.vehicle_number,
      driver_name: grn.driver_name,
    })
    .select(`
      *,
      purchase_orders(po_number, total_amount)
    `)
    .single();

  if (error) throw error;
  return data;
};

// Update GRN status
export const updateGRNStatus = async (
  id: string,
  status: GRN['delivery_status']
): Promise<GRN> => {
  const { data, error } = await supabase
    .from("grns")
    .update({ delivery_status: status })
    .eq("id", id)
    .select(`
      *,
      purchase_orders(po_number)
    `)
    .single();

  if (error) throw error;
  return data;
};

// Fetch issued POs for GRN creation
export const fetchPOsForGRN = async (projectId: string) => {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      suppliers(name),
      po_items(*)
    `)
    .eq("project_id", projectId)
    .in("status", ['issued', 'partially_received', 'completed'])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Create GRN item
export const createGRNItem = async (item: {
  grn_id: string;
  po_item_id?: string;
  material_name: string;
  uom: string;
  received_qty: number;
  po_quantity?: number;
}): Promise<GRNItem> => {
  const { data, error } = await supabase
    .from("grn_items")
    .insert({
      grn_id: item.grn_id,
      po_item_id: item.po_item_id,
      material_name: item.material_name,
      uom: item.uom,
      received_qty: item.received_qty,
      accepted_qty: item.received_qty,
      rejected_qty: 0,
      po_quantity: item.po_quantity,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update GRN item (accept/reject)
export const updateGRNItem = async (
  itemId: string,
  updates: Partial<GRNItem>
): Promise<GRNItem> => {
  const { data, error } = await supabase
    .from("grn_items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
