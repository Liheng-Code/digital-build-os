
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/lib/companyMeta";
import { toast } from "sonner";

export function useCompany() {
  const queryClient = useQueryClient();

  const companyQuery = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      // For MVP we fetch the first company found
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Company | null;
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Company> & { id: string }) => {
      const { data, error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast.success("Company profile updated successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return {
    companyQuery,
    updateCompany,
  };
}
