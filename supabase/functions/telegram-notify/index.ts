import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

const PRIORITY_EMOJI: Record<string, string> = {
  low: "🔵",
  normal: "🔔",
  high: "⚠️",
  critical: "🚨",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMessage(n: any): string {
  const emoji = PRIORITY_EMOJI[n.priority] ?? "🔔";
  const lines = [`${emoji} <b>${escapeHtml(n.title ?? "Notification")}</b>`];
  if (n.body) lines.push(escapeHtml(n.body));
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Missing required env vars");
    }

    const { notification_id } = await req.json();
    if (!notification_id) throw new Error("notification_id required");

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // Idempotency
    const { data: existing } = await db
      .from("telegram_outbox")
      .select("notification_id, status")
      .eq("notification_id", notification_id)
      .maybeSingle();
    if (existing?.status === "sent") {
      return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: n, error: nErr } = await db
      .from("notifications")
      .select("id, user_id, title, body, priority, action_url, type")
      .eq("id", notification_id)
      .maybeSingle();
    if (nErr || !n) throw new Error(nErr?.message ?? "notification not found");

    const { data: profile } = await db
      .from("profiles")
      .select("telegram_chat_id, full_name")
      .eq("id", n.user_id)
      .maybeSingle();

    const chatId = profile?.telegram_chat_id;
    if (!chatId) {
      await db.from("telegram_outbox").upsert({
        notification_id: n.id,
        user_id: n.user_id,
        status: "skipped",
        error: "user_not_linked",
      });
      return new Response(JSON.stringify({ ok: true, skipped: "not_linked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = formatMessage(n);
    const reply_markup = n.action_url
      ? { inline_keyboard: [[{ text: "Open in DCOS", url: n.action_url }]] }
      : undefined;

    const tgRes = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup,
      }),
    });
    const tgData = await tgRes.json();

    if (!tgRes.ok || !tgData.ok) {
      await db.from("telegram_outbox").upsert({
        notification_id: n.id,
        user_id: n.user_id,
        chat_id: chatId,
        status: "failed",
        error: JSON.stringify(tgData).slice(0, 500),
      });
      throw new Error(`Telegram failed [${tgRes.status}]: ${JSON.stringify(tgData)}`);
    }

    await db.from("telegram_outbox").upsert({
      notification_id: n.id,
      user_id: n.user_id,
      chat_id: chatId,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("telegram-notify error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
