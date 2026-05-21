import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Permission {
  module: string;
  action: string;
  is_allowed: boolean;
}

export function usePermissions() {
  const { roles } = useAuth();
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadPermissions = React.useCallback(async () => {
    if (roles.length === 0) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("module, action, is_allowed")
        .in("role", roles)
        .eq("is_allowed", true);

      if (error) throw error;
      setPermissions(data || []);
    } catch (e) {
      console.error("Error loading permissions:", e);
    } finally {
      setLoading(false);
    }
  }, [roles]);

  React.useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const can = (action: string, module: string) => {
    // Admins can do everything by default
    if (roles.includes("admin")) return true;
    
    return permissions.some(
      (p) => p.module === module && p.action === action
    );
  };

  return { can, loading, refresh: loadPermissions };
}
