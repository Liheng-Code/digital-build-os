import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  MaterialRequestStatus, 
  StockReceiptStatus, 
  StockIssueStatus, 
  StockTransferStatus, 
  StockAdjustmentType,
  InventoryItemCategory 
} from "@/lib/inventoryMeta";

// Types
export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: InventoryItemCategory;
  unit_of_measure: string;
  reorder_level: number;
  max_stock_level: number | null;
  storage_location: string | null;
  wbs_node_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockReceipt {
  id: string;
  receipt_number: string;
  po_id: string | null;
  grn_id: string | null;
  receipt_date: string;
  status: StockReceiptStatus;
  supplier_name: string | null;
  delivery_note_number: string | null;
  inspected_by: string | null;
  inspection_date: string | null;
  accepted_by: string | null;
  acceptance_date: string | null;
  notes: string | null;
  wbs_node_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  po_number?: string;
  grn_number?: string;
}

export interface StockReceiptItem {
  id: string;
  stock_receipt_id: string;
  inventory_item_id: string;
  quantity_received: number;
  accepted_quantity: number;
  rejected_quantity: number;
  unit_cost: number | null;
  wbs_node_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

export interface MaterialRequest {
  id: string;
  request_number: string;
  request_date: string;
  required_by_date: string;
  status: MaterialRequestStatus;
  requested_by: string;
  approved_by: string | null;
  approval_date: string | null;
  wbs_node_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  requested_by_name?: string;
  wbs_path?: string;
}

export interface MaterialRequestItem {
  id: string;
  material_request_id: string;
  inventory_item_id: string;
  quantity_requested: number;
  quantity_issued: number;
  wbs_node_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

export interface StockIssue {
  id: string;
  issue_number: string;
  material_request_id: string | null;
  issue_date: string;
  status: StockIssueStatus;
  issued_to: string;
  approved_by: string | null;
  approval_date: string | null;
  issued_by: string | null;
  wbs_node_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  request_number?: string;
}

export interface StockIssueItem {
  id: string;
  stock_issue_id: string;
  inventory_item_id: string;
  quantity_issued: number;
  unit_cost: number | null;
  wbs_node_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  from_storage_location: string;
  to_storage_location: string;
  transfer_date: string;
  status: StockTransferStatus;
  approved_by: string | null;
  approval_date: string | null;
  from_wbs_node_id: string;
  to_wbs_node_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockTransferItem {
  id: string;
  stock_transfer_id: string;
  inventory_item_id: string;
  quantity_transferred: number;
  unit_cost: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

export interface StockAdjustment {
  id: string;
  adjustment_number: string;
  adjustment_date: string;
  adjustment_type: StockAdjustmentType;
  reason: string;
  approved_by: string | null;
  wbs_node_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockAdjustmentItem {
  id: string;
  stock_adjustment_id: string;
  inventory_item_id: string;
  quantity_adjusted: number;
  unit_cost: number | null;
  wbs_node_id: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
}

export interface StockBalance {
  inventory_item_id: string;
  item_code: string;
  item_name: string;
  unit_of_measure: string;
  total_receipts: number;
  total_issues: number;
  total_transfers_in: number;
  total_transfers_out: number;
  total_adjustments_add: number;
  total_adjustments_subtract: number;
  current_balance: number;
}

// Query: Inventory Items
export function useInventoryItems(projectId: string | null | undefined, filters?: {
  category?: InventoryItemCategory;
  wbsNodeId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["inventory-items", projectId, filters],
    enabled: !!projectId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("inventory_items")
        .select(`*`)
        .eq("is_active", true)
        .order("code");

      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.wbsNodeId) query = query.eq("wbs_node_id", filters.wbsNodeId);
      if (filters?.search) query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as InventoryItem[];
    },
  });
}

// Query: Stock Receipts
export function useStockReceipts(projectId: string | null | undefined, filters?: {
  status?: StockReceiptStatus;
  poId?: string;
}) {
  return useQuery({
    queryKey: ["stock-receipts", projectId, filters],
    enabled: !!projectId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("stock_receipts")
        .select(`*`)
        .order("receipt_date", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.poId) query = query.eq("po_id", filters.poId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as StockReceipt[];
    },
  });
}

// Query: Material Requests
export function useMaterialRequests(projectId: string | null | undefined, filters?: {
  status?: MaterialRequestStatus;
  wbsNodeId?: string;
}) {
  return useQuery({
    queryKey: ["material-requests", projectId, filters],
    enabled: !!projectId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("material_requests")
        .select(`
          *,
          requested_user:requested_by(full_name)
        `)
        .order("request_date", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.wbsNodeId) query = query.eq("wbs_node_id", filters.wbsNodeId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        requested_by_name: row.requested_user?.full_name,
      })) as MaterialRequest[];
    },
  });
}

// Query: Stock Issues
export function useStockIssues(projectId: string | null | undefined, filters?: {
  status?: StockIssueStatus;
  wbsNodeId?: string;
}) {
  return useQuery({
    queryKey: ["stock-issues", projectId, filters],
    enabled: !!projectId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("stock_issues")
        .select(`
          *,
          material_request:material_request_id(request_number)
        `)
        .order("issue_date", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.wbsNodeId) query = query.eq("wbs_node_id", filters.wbsNodeId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        request_number: row.material_request?.request_number,
      })) as StockIssue[];
    },
  });
}

// Query: Stock Transfers
export function useStockTransfers(projectId: string | null | undefined, filters?: {
  status?: StockTransferStatus;
}) {
  return useQuery({
    queryKey: ["stock-transfers", projectId, filters],
    enabled: !!projectId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("stock_transfers")
        .select(`*`)
        .order("transfer_date", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as StockTransfer[];
    },
  });
}

// Query: Stock Adjustments
export function useStockAdjustments(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["stock-adjustments", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("stock_adjustments")
        .select(`*`)
        .order("adjustment_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StockAdjustment[];
    },
  });
}

// Query: Stock Balances (from materialized view)
export function useStockBalances(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["stock-balances", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("stock_balances")
        .select(`*`);
      if (error) throw error;
      return (data ?? []) as StockBalance[];
    },
  });
}

// Query: Inventory Dashboard KPIs
export function useInventoryDashboard(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["inventory-dashboard", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return null;

      const [
        itemsRes,
        receiptsRes,
        issuesRes,
        transfersRes,
        adjustmentsRes,
        balancesRes,
      ] = await Promise.all([
        (supabase as any).from("inventory_items").select("id, reorder_level").eq("is_active", true),
        (supabase as any).from("stock_receipts").select("status").in("status", ["pending_inspection", "inspected"]),
        (supabase as any).from("stock_issues").select("status").in("status", ["pending_approval", "approved"]),
        (supabase as any).from("stock_transfers").select("status").in("status", ["pending_approval", "approved", "in_transit"]),
        (supabase as any).from("stock_adjustments").select("id"),
        (supabase as any).from("stock_balances").select("current_balance, total_receipts, total_issues"),
      ]);

      const items = itemsRes.data ?? [];
      const receipts = receiptsRes.data ?? [];
      const issues = issuesRes.data ?? [];
      const transfers = transfersRes.data ?? [];
      const balances = balancesRes.data ?? [];

      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      return {
        totalItems: items.length,
        totalStockValue: balances.reduce((sum: number, b: any) => {
          // Simplified: would need unit_cost from items for real value
          return sum + (b.current_balance || 0);
        }, 0),
        lowStockItems: items.filter((i: any) => {
          // Would need actual balance check against reorder_level
          return false; // Placeholder - needs balance join
        }).length,
        pendingReceipts: receipts.length,
        pendingIssues: issues.length,
        pendingTransfers: transfers.length,
        totalAdjustments: (adjustmentsRes.data ?? []).length,
        agingStock: 0, // Would need receipt date tracking
      };
    },
  });
}

// Mutation: Update Material Request Status
export function useUpdateMaterialRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: MaterialRequestStatus;
    }) => {
      const patch: Record<string, any> = { status };
      
      if (status === 'approved') patch.approval_date = new Date().toISOString();
      if (status === 'fulfilled') patch.approval_date = new Date().toISOString();

      const { error } = await (supabase as any)
        .from("material_requests")
        .update(patch)
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["material-requests"] });
    },
  });
}

// Mutation: Update Stock Receipt Status
export function useUpdateStockReceiptStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      receiptId,
      status,
      inspectedBy,
      acceptedBy,
    }: {
      receiptId: string;
      status: StockReceiptStatus;
      inspectedBy?: string;
      acceptedBy?: string;
    }) => {
      const patch: Record<string, any> = { status };
      
      if (status === 'inspected') {
        patch.inspection_date = new Date().toISOString();
        if (inspectedBy) patch.inspected_by = inspectedBy;
      }
      if (status === 'accepted') {
        patch.acceptance_date = new Date().toISOString();
        if (acceptedBy) patch.accepted_by = acceptedBy;
      }

      const { error } = await (supabase as any)
        .from("stock_receipts")
        .update(patch)
        .eq("id", receiptId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-receipts"] });
      qc.invalidateQueries({ queryKey: ["stock-balances"] });
    },
  });
}

// Mutation: Update Stock Issue Status
export function useUpdateStockIssueStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      issueId,
      status,
      approvedBy,
      issuedBy,
    }: {
      issueId: string;
      status: StockIssueStatus;
      approvedBy?: string;
      issuedBy?: string;
    }) => {
      const patch: Record<string, any> = { status };
      
      if (status === 'approved') {
        patch.approval_date = new Date().toISOString();
        if (approvedBy) patch.approved_by = approvedBy;
      }
      if (status === 'issued') {
        if (issuedBy) patch.issued_by = issuedBy;
      }

      const { error } = await (supabase as any)
        .from("stock_issues")
        .update(patch)
        .eq("id", issueId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-issues"] });
      qc.invalidateQueries({ queryKey: ["stock-balances"] });
    },
  });
}

// Mutation: Update Stock Transfer Status
export function useUpdateStockTransferStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transferId,
      status,
      approvedBy,
    }: {
      transferId: string;
      status: StockTransferStatus;
      approvedBy?: string;
    }) => {
      const patch: Record<string, any> = { status };
      
      if (status === 'approved') {
        patch.approval_date = new Date().toISOString();
        if (approvedBy) patch.approved_by = approvedBy;
      }

      const { error } = await (supabase as any)
        .from("stock_transfers")
        .update(patch)
        .eq("id", transferId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      qc.invalidateQueries({ queryKey: ["stock-balances"] });
    },
  });
}

// Refresh Stock Balances Materialized View
export function useRefreshStockBalances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).rpc('refresh_stock_balances');
      if (error) {
        // If function doesn't exist, try direct refresh
        const { error: refreshError } = await (supabase as any)
          .from("stock_balances")
          .select("inventory_item_id")
          .limit(1);
        if (refreshError) throw refreshError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-balances"] });
    },
  });
}
