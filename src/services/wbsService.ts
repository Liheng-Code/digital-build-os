import { supabase } from "@/integrations/supabase/client";

export interface SavedView {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  zoom: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchSavedViews(projectId: string): Promise<SavedView[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("wbs_saved_views")
    .select("*")
    .eq("project_id", projectId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as SavedView[];
}

export async function saveView(
  projectId: string,
  userId: string,
  name: string,
  filters: Record<string, unknown>,
  zoom: string,
  isShared: boolean,
): Promise<SavedView> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("wbs_saved_views")
    .insert({
      project_id: projectId,
      user_id: userId,
      name,
      filters,
      zoom,
      is_shared: isShared,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SavedView;
}

export async function deleteView(viewId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("wbs_saved_views").delete().eq("id", viewId);
  if (error) throw error;
}

export async function updateView(
  viewId: string,
  updates: Partial<Pick<SavedView, "name" | "filters" | "zoom" | "is_shared">>,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("wbs_saved_views").update(updates).eq("id", viewId);
  if (error) throw error;
}
