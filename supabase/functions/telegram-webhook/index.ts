import { createClient } from "npm:@supabase/supabase-js@2";

async function deriveWebhookSecret(apiKey: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${apiKey}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

async function tgSendMessage(chatId: number, text: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;
  await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!TELEGRAM_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const expected = await deriveWebhookSecret(TELEGRAM_API_KEY);
  if (!safeEqual(req.headers.get("X-Telegram-Bot-Api-Secret-Token"), expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const update = await req.json();
    const msg = update.message ?? update.edited_message;
    const chatId: number | undefined = msg?.chat?.id;
    const text: string | undefined = msg?.text;
    const username: string | undefined = msg?.from?.username;

    if (!chatId || !text) {
      return new Response(JSON.stringify({ ok: true, ignored: true }));
    }

    // Phase 1: /start <code> linking
    const startMatch = text.match(/^\/start(?:\s+([A-Z0-9]{4,12}))?/i);
    if (startMatch) {
      const code = startMatch[1]?.toUpperCase();
      if (!code) {
        await tgSendMessage(
          chatId,
          "👋 Welcome to <b>DCOS Alerts</b>.\n\nTo receive task notifications, open <b>Settings → Telegram</b> in DCOS, generate a link code, then send:\n<code>/start YOURCODE</code>",
        );
        return new Response(JSON.stringify({ ok: true }));
      }

      const { data: row } = await db
        .from("telegram_link_codes")
        .select("user_id, expires_at, used_at")
        .eq("code", code)
        .maybeSingle();

      if (!row) {
        await tgSendMessage(chatId, "❌ Invalid code. Please generate a new one in DCOS Settings → Telegram.");
        return new Response(JSON.stringify({ ok: true }));
      }
      if (row.used_at) {
        await tgSendMessage(chatId, "❌ This code has already been used.");
        return new Response(JSON.stringify({ ok: true }));
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        await tgSendMessage(chatId, "❌ Code expired. Please generate a new one.");
        return new Response(JSON.stringify({ ok: true }));
      }

      // Link
      await db
        .from("profiles")
        .update({
          telegram_chat_id: chatId,
          telegram_username: username ?? null,
          telegram_linked_at: new Date().toISOString(),
        })
        .eq("id", row.user_id);

      await db
        .from("telegram_link_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("code", code);

      await tgSendMessage(
        chatId,
        "✅ <b>Linked successfully!</b>\n\nYou will now receive DCOS task and system alerts here.",
      );
      return new Response(JSON.stringify({ ok: true }));
    }

    // Default reply (Phase 2 will handle commands)
    await tgSendMessage(
      chatId,
      "ℹ️ Inbound commands are not enabled yet. Open DCOS to manage your tasks.",
    );
    return new Response(JSON.stringify({ ok: true }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("telegram-webhook error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
});
