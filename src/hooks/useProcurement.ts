import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchPRs,
  fetchPRById,
  createPR,
  createPRItems,
  updatePRStatus,
  fetchMaterialCatalog,
  createCatalogItem,
  fetchRdsData,
  createMtoTakeoff,
  fetchSuppliers,
  fetchProcurementDashboard,
} from "@/services/procurementService";

// ─── PR Queries ──────────────────────────────────────────────

export function usePRs(projectId: string | null) {
  return useQuery({
    queryKey: ["procurement", "prs", projectId],
    queryFn: () => fetchPRs(projectId!),
    enabled: !!projectId,
  });
}

export function usePRById(prId: string | null) {
  return useQuery({
    queryKey: ["procurement", "pr", prId],
    queryFn: () => fetchPRById(prId!),
    enabled: !!prId,
  });
}

export function useCreatePR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      subject: string;
      description?: string;
      required_date?: string;
      total_estimate?: number;
      items: { material_id: string; quantity: number; unit_price: number }[];
    }) => {
      const pr = await createPR(payload);
      if (payload.items.length > 0) {
        await createPRItems(
          payload.items.map(item => ({ ...item, pr_id: pr.id }))
        );
      }
      return pr;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["procurement", "prs", data.project_id] });
      toast.success(`PR ${data.pr_number} created successfully`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdatePRStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePRStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procurement", "prs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ─── Material Catalog ────────────────────────────────────────

export function useMaterialCatalog() {
  return useQuery({
    queryKey: ["procurement", "catalog"],
    queryFn: fetchMaterialCatalog,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCatalogItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procurement", "catalog"] });
      toast.success("Material added to catalog");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ─── MTO ─────────────────────────────────────────────────────

export function useRdsData(projectId: string | null) {
  return useQuery({
    queryKey: ["procurement", "rds", projectId],
    queryFn: () => fetchRdsData(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateMtoTakeoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMtoTakeoff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procurement", "rds"] });
      toast.success("Material take-off created");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

// ─── Suppliers ───────────────────────────────────────────────

export function useSuppliers() {
  return useQuery({
    queryKey: ["procurement", "suppliers"],
    queryFn: fetchSuppliers,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Dashboard ───────────────────────────────────────────────

export function useProcurementDashboard(projectId: string | null) {
  return useQuery({
    queryKey: ["procurement", "dashboard", projectId],
    queryFn: () => fetchProcurementDashboard(projectId!),
    enabled: !!projectId,
  });
}

// ─── Available PRs for RFQ ───────────────────────────────────

export function useAvailablePRs(projectId: string | null) {
  return useQuery({
    queryKey: ["procurement", "available-prs", projectId],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await (supabase as any)
        .from("purchase_requisitions")
        .select("id, pr_number, status, project_id")
        .eq("project_id", projectId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}
