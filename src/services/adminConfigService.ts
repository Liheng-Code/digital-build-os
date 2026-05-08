import { supabase } from "@/integrations/supabase/client";
import type { DocumentType, Discipline, WbsNodeType } from "@/lib/adminConfigMeta";

interface QueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

interface ConfigQuery<T> extends PromiseLike<QueryResult<T>> {
  eq(column: string, value: unknown): ConfigQuery<T>;
  order(column: string): ConfigQuery<T>;
}

interface ConfigTable<T> {
  select(columns: string): ConfigQuery<T>;
}

interface ConfigClient {
  from<T>(table: string): ConfigTable<T>;
}

const configClient = supabase as unknown as ConfigClient;

export async function fetchDocumentTypes(): Promise<DocumentType[]> {
  const { data, error } = await configClient
    .from<DocumentType>("document_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as DocumentType[];
}

export async function fetchDisciplines(): Promise<Discipline[]> {
  const { data, error } = await configClient
    .from<Discipline>("disciplines")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Discipline[];
}

export async function fetchWbsNodeTypes(): Promise<WbsNodeType[]> {
  const { data, error } = await configClient
    .from<WbsNodeType>("wbs_node_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}
