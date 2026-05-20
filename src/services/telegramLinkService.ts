import { supabase } from "@/integrations/supabase/client";

export interface TelegramStatus {
  linked: boolean;
  chat_id: number | null;
  username: string | null;
  linked_at: string | null;
}

export const TELEGRAM_BOT_USERNAME = "dcos_alerts_bot";

export async function getTelegramStatus(userId: string): Promise<TelegramStatus> {
  const { data, error } = await supabase
    .from("profiles")
    .select("telegram_chat_id, telegram_username, telegram_linked_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    linked: !!data?.telegram_chat_id,
    chat_id: (data?.telegram_chat_id as number | null) ?? null,
    username: (data?.telegram_username as string | null) ?? null,
    linked_at: (data?.telegram_linked_at as string | null) ?? null,
  };
}

export async function generateLinkCode(userId: string): Promise<{ code: string; deepLink: string; expiresAt: string }> {
  const { data, error } = await supabase.functions.invoke("telegram-link-code", {
    body: { user_id: userId }
  });
  if (error) throw error;
  if (!data?.ok || !data?.code || !data?.deepLink || !data?.expiresAt) {
    throw new Error(data?.error ?? "Failed to generate Telegram link code");
  }
  return {
    code: data.code,
    expiresAt: data.expiresAt,
    deepLink: data.deepLink
  };
}

export async function unlinkTelegram(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      telegram_chat_id: null,
      telegram_username: null,
      telegram_linked_at: null,
    })
    .eq("id", userId);
  if (error) throw error;
}
