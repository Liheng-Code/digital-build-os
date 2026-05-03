import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  InspectionChecklist, 
  InspectionRequest, 
  NCR, 
  PunchListItem 
} from '@/lib/qaqcMeta';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useInspectionRequests(projectId: string) {
  return useQuery({
    queryKey: ['inspection_requests', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('inspection_requests')
        .select(`
          *,
          requested_by_profile:profiles!inspection_requests_requested_by_fkey(full_name),
          inspected_by_profile:profiles!inspection_requests_inspected_by_fkey(full_name),
          task:tasks(title, code)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any as InspectionRequest[];
    },
    enabled: !!projectId,
  });
}

export function useChecklists(projectId: string) {
  return useQuery({
    queryKey: ['inspection_checklists', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('inspection_checklists')
        .select('*')
        .eq('project_id', projectId)
        .order('name');

      if (error) throw error;
      return data as InspectionChecklist[];
    },
    enabled: !!projectId,
  });
}

export function useNCRs(projectId: string) {
  return useQuery({
    queryKey: ['ncrs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('ncrs')
        .select(`
          *,
          reported_by_profile:profiles!ncrs_reported_by_fkey(full_name),
          assigned_to_profile:profiles!ncrs_assigned_to_fkey(full_name),
          task:tasks(title, code)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any as NCR[];
    },
    enabled: !!projectId,
  });
}

export function usePunchListItems(projectId: string) {
  return useQuery({
    queryKey: ['punch_list_items', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('punch_list_items')
        .select(`
          *,
          created_by_profile:profiles!punch_list_items_created_by_fkey(full_name),
          task:tasks(title, code)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any as PunchListItem[];
    },
    enabled: !!projectId,
  });
}

export function useCreateIR() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (values: Partial<InspectionRequest> & { checklist_id?: string }) => {
      const { checklist_id, ...irValues } = values;
      
      // 1. Create IR
      const { data: ir, error: irError } = await supabase
        .from('inspection_requests')
        .insert([irValues])
        .select()
        .single();

      if (irError) throw irError;

      // 2. If checklist selected, initialize inspection_results
      if (checklist_id && ir) {
        const { data: items, error: itemsError } = await supabase
          .from('inspection_checklist_items')
          .select('id')
          .eq('checklist_id', checklist_id);

        if (itemsError) throw itemsError;

        if (items && items.length > 0) {
          const results = items.map(item => ({
            inspection_request_id: ir.id,
            checklist_item_id: item.id,
            status: null
          }));

          const { error: resultsError } = await supabase
            .from('inspection_results')
            .insert(results);

          if (resultsError) throw resultsError;
        }
      }

      return ir;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection_requests', variables.project_id] });
      toast.success('Inspection Request raised successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to raise IR: ' + error.message);
    }
  });
}

export function useIrResults(irId: string) {
  return useQuery({
    queryKey: ['inspection_results', irId],
    queryFn: async () => {
      if (!irId) return [];
      const { data, error } = await supabase
        .from('inspection_results')
        .select(`
          *,
          checklist_item:inspection_checklist_items(*)
        `)
        .eq('inspection_request_id', irId)
        .order('checklist_item(order_index)');

      if (error) throw error;
      return data as any[];
    },
    enabled: !!irId,
  });
}

export function useUpdateIrResult() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, comments }: { id: string, status: ChecklistResult | null, comments?: string | null }) => {
      const { error } = await supabase
        .from('inspection_results')
        .update({ status, comments, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // We don't have the irId here easily, but we can invalidate all results or specific one
      queryClient.invalidateQueries({ queryKey: ['inspection_results'] });
    }
  });
}

export function useUpdateIrStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, remarks, inspected_by }: { id: string, status: IrStatus, remarks?: string, inspected_by?: string }) => {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          status, 
          remarks, 
          inspected_by,
          inspection_date: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection_requests'] });
      toast.success('Inspection status updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });
}

export function useTaskQaQc(taskId: string) {
  return useQuery({
    queryKey: ['task_qaqc', taskId],
    queryFn: async () => {
      if (!taskId) return { irs: [], ncrs: [], punchItems: [] };
      
      const [irRes, ncrRes, punchRes] = await Promise.all([
        supabase
          .from('inspection_requests')
          .select(`
            *,
            requested_by_profile:profiles!inspection_requests_requested_by_fkey(full_name),
            inspected_by_profile:profiles!inspection_requests_inspected_by_fkey(full_name)
          `)
          .eq('task_id', taskId)
          .order('created_at', { ascending: false }),
        supabase
          .from('ncrs')
          .select(`
            *,
            reported_by_profile:profiles!ncrs_reported_by_fkey(full_name),
            assigned_to_profile:profiles!ncrs_assigned_to_fkey(full_name)
          `)
          .eq('task_id', taskId)
          .order('created_at', { ascending: false }),
        supabase
          .from('punch_list_items')
          .select(`
            *,
            created_by_profile:profiles!punch_list_items_created_by_fkey(full_name)
          `)
          .eq('task_id', taskId)
          .order('created_at', { ascending: false })
      ]);

      return {
        irs: (irRes.data || []) as any as InspectionRequest[],
        ncrs: (ncrRes.data || []) as any as NCR[],
        punchItems: (punchRes.data || []) as any as PunchListItem[]
      };
    },
    enabled: !!taskId,
  });
}

export function useCreateChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (values: Partial<InspectionChecklist>) => {
      const { data, error } = await supabase
        .from('inspection_checklists')
        .insert([values])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspection_checklists', variables.project_id] });
      toast.success('Checklist template created');
    }
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (values: Partial<InspectionChecklistItem>) => {
      const { data, error } = await supabase
        .from('inspection_checklist_items')
        .insert([values])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection_checklists'] });
    }
  });
}
