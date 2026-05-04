import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProgressClaim, ResourceRate, ProjectCostSummary } from '@/lib/financialMeta';
import { toast } from 'sonner';

export function useProjectCostSummaries(projectId: string) {
  return useQuery({
    queryKey: ['project_cost_summaries', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_cost_summaries')
        .select('*')
        .eq('project_id', projectId);
      if (error) throw error;
      return data as any[] as ProjectCostSummary[];
    },
    enabled: !!projectId,
  });
}

export function useProgressClaims(projectId: string) {
  return useQuery({
    queryKey: ['progress_claims', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_claims')
        .select('*')
        .eq('project_id', projectId)
        .order('period_end', { ascending: false });
      if (error) throw error;
      return data as any[] as ProgressClaim[];
    },
    enabled: !!projectId,
  });
}

export function useResourceRates(projectId: string) {
  return useQuery({
    queryKey: ['resource_rates', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resource_rates')
        .select('*')
        .eq('project_id', projectId);
      if (error) throw error;
      return data as any[] as ResourceRate[];
    },
    enabled: !!projectId,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ProgressClaim>) => {
      const { data, error } = await supabase
        .from('progress_claims')
        .insert([values as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress_claims', variables.project_id] });
      toast.success('Progress claim created');
    },
  });
}
