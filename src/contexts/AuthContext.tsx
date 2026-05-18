import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
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
  // Track the last user whose profile we loaded so we don't re-fetch profile/roles
  // on every TOKEN_REFRESHED / SIGNED_IN event for the same account.
  const loadedUserIdRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);

  const loadProfileAndRoles = async (userId: string) => {
    if (loadedUserIdRef.current === userId || inFlightRef.current === userId) return;
    inFlightRef.current = userId;
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      setProfile((profileRes.data as Profile) ?? null);
      setRoles(((rolesRes.data ?? []) as { role: AppRole }[]).map((r) => r.role));
      loadedUserIdRef.current = userId;
    } finally {
      inFlightRef.current = null;
    }
  };

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer to avoid auth deadlocks. Dedup is handled inside loadProfileAndRoles.
        setTimeout(() => loadProfileAndRoles(newSession.user.id), 0);
      } else {
        loadedUserIdRef.current = null;
        setProfile(null);
        setRoles([]);
      }
    });

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

  const value = useMemo<AuthContextValue>(
    () => ({
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
        if (user) {
          loadedUserIdRef.current = null;
          await loadProfileAndRoles(user.id);
        }
      },
    }),
    [user, session, profile, roles, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
