import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BoqItem,
  MaterialRequest,
  MaterialRequestItem,
  PurchaseOrder,
  PurchaseOrderItem,
  Grn,
  GrnItem,
  StockBalance,
  MaterialIssue
} from '@/lib/materialsMeta';

export function useBoqItems(projectId: string, taskId?: string) {
  return useQuery({
    queryKey: ['boq_items', projectId, taskId],
    queryFn: async () => {
      let query = supabase.from('boq_items').select('*').eq('project_id', projectId);
      if (taskId) {
        query = query.eq('task_id', taskId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as any[] as BoqItem[];
    },
    enabled: !!projectId,
  });
}

export function useMaterialRequests(projectId: string) {
  return useQuery({
    queryKey: ['material_requests', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          *,
          requested_by_profile:profiles!material_requests_requested_by_fkey(full_name),
          items:material_request_items(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!projectId,
  });
}

export function useStockBalances(projectId: string) {
  return useQuery({
    queryKey: ['stock_balances', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_balances')
        .select('*')
        .eq('project_id', projectId)
        .order('material_name', { ascending: true });
      if (error) throw error;
      return data as any[] as StockBalance[];
    },
    enabled: !!projectId,
  });
}

export function usePurchaseOrders(projectId: string) {
  return useQuery({
    queryKey: ['purchase_orders', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[] as PurchaseOrder[];
    },
    enabled: !!projectId,
  });
}

export function useMaterialIssues(projectId: string, taskId?: string) {
  return useQuery({
    queryKey: ['material_issues', projectId, taskId],
    queryFn: async () => {
      let query = supabase
        .from('material_issues')
        .select(`
          *,
          issued_by_profile:profiles!material_issues_issued_by_fkey(full_name)
        `)
        .eq('project_id', projectId);
      if (taskId) {
        query = query.eq('task_id', taskId);
      }
      const { data, error } = await query.order('issue_date', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!projectId,
  });
}

export function useIssueMaterial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (issueData: {
      project_id: string;
      task_id: string;
      material_name: string;
      qty_issued: number;
      issued_by: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('material_issues')
        .insert(issueData)
        .select()
        .single();
      
      if (error) throw error;
      return data as any as MaterialIssue;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock_balances', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['material_issues', variables.project_id] });
      toast({
        title: "Material Issued",
        description: `Successfully issued ${variables.qty_issued} of ${variables.material_name}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Issuing Material",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useCreateMaterialRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      mr: Omit<MaterialRequest, 'id' | 'created_at' | 'updated_at' | 'status'>;
      items: Omit<MaterialRequestItem, 'id' | 'mr_id'>[];
    }) => {
      // Create MR
      const { data: mrData, error: mrError } = await supabase
        .from('material_requests')
        .insert({
          project_id: payload.mr.project_id,
          request_number: payload.mr.request_number,
          requested_by: payload.mr.requested_by,
          request_date: payload.mr.request_date,
          required_date: payload.mr.required_date,
          notes: payload.mr.notes,
          status: 'draft'
        })
        .select()
        .single();

      if (mrError) throw mrError;

      // Create MR Items
      const itemsToInsert = payload.items.map(item => ({
        mr_id: mrData.id,
        ...item
      }));

      const { error: itemsError } = await supabase
        .from('material_request_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return mrData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['material_requests', data.project_id] });
      toast({
        title: "Material Request Created",
        description: `MR ${data.request_number} has been drafted.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating MR",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
