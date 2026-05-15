
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stakeholder, StakeholderContact, ProjectStakeholder } from "@/lib/stakeholderMeta";
import { toast } from "sonner";

export function useStakeholders() {
  const queryClient = useQueryClient();

  const stakeholdersQuery = useQuery({
    queryKey: ["stakeholders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stakeholders")
        .select("*")
        .order("organization_name");
      if (error) throw error;
      return data as Stakeholder[];
    },
  });

  const createStakeholder = useMutation({
    mutationFn: async (stakeholder: Partial<Stakeholder>) => {
      const { data, error } = await supabase
        .from("stakeholders")
        .insert(stakeholder)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholders"] });
      toast.success("Stakeholder created successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updateStakeholder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Stakeholder> & { id: string }) => {
      const { data, error } = await supabase
        .from("stakeholders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholders"] });
      toast.success("Stakeholder updated successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteStakeholder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stakeholders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholders"] });
      toast.success("Stakeholder deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return {
    stakeholdersQuery,
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,
  };
}

export function useStakeholderContacts(stakeholderId?: string) {
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ["stakeholder-contacts", stakeholderId],
    queryFn: async () => {
      if (!stakeholderId) return [];
      const { data, error } = await supabase
        .from("stakeholder_contacts")
        .select("*")
        .eq("stakeholder_id", stakeholderId)
        .order("is_primary", { ascending: false })
        .order("full_name");
      if (error) throw error;
      return data as StakeholderContact[];
    },
    enabled: !!stakeholderId,
  });

  const createContact = useMutation({
    mutationFn: async (contact: Partial<StakeholderContact>) => {
      const { data, error } = await supabase
        .from("stakeholder_contacts")
        .insert(contact)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-contacts", stakeholderId] });
      toast.success("Contact added successfully");
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stakeholder_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-contacts", stakeholderId] });
      toast.success("Contact deleted");
    },
  });

  return { contactsQuery, createContact, deleteContact };
}

export function useStakeholderProjects(stakeholderId?: string) {
  const queryClient = useQueryClient();

  const stakeholderProjectsQuery = useQuery({
    queryKey: ["stakeholder-projects", stakeholderId],
    queryFn: async () => {
      if (!stakeholderId) return [];
      const { data, error } = await supabase
        .from("project_stakeholders")
        .select(`
          *,
          project:projects(id, name, code)
        `)
        .eq("stakeholder_id", stakeholderId);
      if (error) throw error;
      return data as (ProjectStakeholder & { project: { id: string; name: string; code: string } })[];
    },
    enabled: !!stakeholderId,
  });

  const linkProject = useMutation({
    mutationFn: async (link: Partial<ProjectStakeholder>) => {
      const { data, error } = await supabase
        .from("project_stakeholders")
        .insert(link)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-projects", stakeholderId] });
      toast.success("Project linked successfully");
    },
    onError: (error) => {
      toast.error(`Error linking project: ${error.message}`);
    },
  });

  const unlinkProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_stakeholders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-projects", stakeholderId] });
      toast.success("Project unlinked");
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectStakeholder> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_stakeholders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stakeholder-projects", stakeholderId] });
      toast.success("Assignment updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating assignment: ${error.message}`);
    },
  });

  return { stakeholderProjectsQuery, linkProject, unlinkProject, updateAssignment };
}

export function useProjectStakeholders(projectId?: string) {
  const queryClient = useQueryClient();

  const projectStakeholdersQuery = useQuery({
    queryKey: ["project-stakeholders", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_stakeholders")
        .select(`
          *,
          stakeholder:stakeholders(*)
        `)
        .eq("project_id", projectId);
      if (error) throw error;
      return data as ProjectStakeholder[];
    },
    enabled: !!projectId,
  });

  const linkStakeholder = useMutation({
    mutationFn: async (link: Partial<ProjectStakeholder>) => {
      const { data, error } = await supabase
        .from("project_stakeholders")
        .insert(link)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-stakeholders", projectId] });
      toast.success("Stakeholder linked to project");
    },
  });

  return { projectStakeholdersQuery, linkStakeholder };
}
