import { supabase } from "@/integrations/supabase/client";

export interface BriefPrefs {
  morning_at: string | null; // "HH:MM:SS" or null
  evening_at: string | null;
  timezone: string;
}

export async function getBriefPrefs(userId: string): Promise<BriefPrefs | null> {
  const { data, error } = await (supabase as any)
    .from("telegram_brief_prefs")
    .select("morning_at, evening_at, timezone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function upsertBriefPrefs(
  userId: string,
  prefs: BriefPrefs
): Promise<void> {
  const { error } = await (supabase as any)
    .from("telegram_brief_prefs")
    .upsert(
      { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
