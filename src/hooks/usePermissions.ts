import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Permission {
  module: string;
  action: string;
  is_allowed: boolean;
}

export function usePermissions() {
  const { roles } = useAuth();
  const rolesKey = React.useMemo(() => [...roles].sort().join(","), [roles]);

  const { data: permissions = [], isLoading, refetch } = useQuery({
    queryKey: ["role_permissions", rolesKey],
    enabled: roles.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("module, action, is_allowed")
        .in("role", roles)
        .eq("is_allowed", true);
      if (error) throw error;
      return (data ?? []) as Permission[];
    },
  });

  const isAdmin = roles.includes("admin");
  const permSet = React.useMemo(() => {
    const s = new Set<string>();
    for (const p of permissions) s.add(`${p.module}:${p.action}`);
    return s;
  }, [permissions]);

  const can = React.useCallback(
    (action: string, module: string) => {
      if (isAdmin) return true;
      return permSet.has(`${module}:${action}`);
    },
    [isAdmin, permSet],
  );

  return { can, loading: isLoading, refresh: refetch };
}
