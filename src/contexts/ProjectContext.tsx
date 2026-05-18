import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface Project {
  id: string;
  code: string;
  name: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  client_name: string | null;
  client_id: string | null;
  client?: {
    organization_name: string;
  } | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  description: string | null;
}

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  setActiveProjectId: (id: string | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const STORAGE_KEY = "buildtrack.activeProjectId";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", "list", user?.id ?? null],
    enabled: !!user,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select(`*, client:stakeholders(organization_name)`)
        .order("created_at", { ascending: false });
      return (data ?? []) as Project[];
    },
  });

  // Default active project to first one if none selected
  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProjectIdState(projects[0].id);
      localStorage.setItem(STORAGE_KEY, projects[0].id);
    }
    if (activeProjectId && projects.length > 0 && !projects.find((p) => p.id === activeProjectId)) {
      setActiveProjectIdState(projects[0].id);
      localStorage.setItem(STORAGE_KEY, projects[0].id);
    }
  }, [projects, activeProjectId]);

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
  }, [queryClient]);

  const value = useMemo<ProjectContextValue>(() => {
    const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
    return {
      projects,
      activeProject,
      setActiveProjectId,
      loading: isLoading,
      refresh,
    };
  }, [projects, activeProjectId, isLoading, setActiveProjectId, refresh]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be used inside ProjectProvider");
  return ctx;
}

export const PROJECT_STATUS_LABELS: Record<Project["status"], string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};
