import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin"
  | "project_manager"
  | "engineer"
  | "supervisor"
  | "worker"
  | "qaqc_inspector"
  | "accountant";

export interface Profile {
  id: string;
  full_name: string;
  employee_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  job_title: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileAndRoles = async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((profileRes.data as Profile) ?? null);
    setRoles(((rolesRes.data ?? []) as { role: AppRole }[]).map((r) => r.role));
  };

  useEffect(() => {
    // Set up listener FIRST to avoid missing events
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer Supabase calls to avoid auth deadlocks
        setTimeout(() => loadProfileAndRoles(newSession.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        loadProfileAndRoles(existing.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    roles,
    loading,
    hasRole: (role) => roles.includes(role),
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile: async () => {
      if (user) await loadProfileAndRoles(user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  engineer: "Engineer",
  supervisor: "Supervisor",
  worker: "Worker",
  qaqc_inspector: "QA/QC Inspector",
  accountant: "Accountant",
};
