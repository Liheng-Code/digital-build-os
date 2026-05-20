import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const TELEGRAM_BOT_USERNAME = "dcos_alerts_bot";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(len = 8): string {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Server misconfigured");
    if (!authHeader.toLowerCase().startsWith("bearer ")) throw new Error("Unauthorized");

    const service = createClient(SUPABASE_URL, SERVICE_KEY);
    const jwt = authHeader.replace(/^bearer\s+/i, "");
    const { data: userData, error: userErr } = await service.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userId = userData.user.id;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await service
      .from("telegram_link_codes")
      .delete()
      .eq("user_id", userId)
      .is("used_at", null);

    let code = "";
    let insertError: Error | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      code = makeCode();
      const { error } = await service
        .from("telegram_link_codes")
        .insert({ code, user_id: userId, expires_at: expiresAt });
      if (!error) {
        insertError = null;
        break;
      }
      insertError = error;
    }

    if (insertError) throw insertError;

    return new Response(JSON.stringify({
      ok: true,
      code,
      expiresAt,
      deepLink: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${code}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("telegram-link-code error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
