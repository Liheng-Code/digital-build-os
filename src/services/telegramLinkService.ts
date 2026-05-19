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

function makeCode(len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  for (let i = 0; i < len; i++) out += alphabet[buf[i] % alphabet.length];
  return out;
}

export async function generateLinkCode(userId: string): Promise<{ code: string; deepLink: string; expiresAt: string }> {
  const code = makeCode(8);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("telegram_link_codes")
    .insert({ code, user_id: userId, expires_at: expiresAt });
  if (error) throw error;
  return {
    code,
    expiresAt,
    deepLink: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${code}`,
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
