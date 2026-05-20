// Telegram morning + evening briefs dispatcher.
// Triggered every 15 minutes by pg_cron. Sends one brief per (user, kind, local_date).
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function tgHeaders() {
  return {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "X-Connection-Api-Key": Deno.env.get("TELEGRAM_API_KEY")!,
    "Content-Type": "application/json",
  };
}

async function tgSend(chatId: number, text: string) {
  try {
    await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: tgHeaders(),
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error("tgSend failed:", e);
  }
}

function localParts(tz: string, now: Date) {
  // Returns { hh, mm, dateISO } in the user's timezone.
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
    return {
      hh: Number(parts.hour),
      mm: Number(parts.minute),
      dateISO: `${parts.year}-${parts.month}-${parts.day}`,
    };
  } catch {
    return null;
  }
}

function withinSlot(targetHHMM: string | null, hh: number, mm: number): boolean {
  if (!targetHHMM) return false;
  const [th, tm] = targetHHMM.split(":").map(Number);
  // Match the 15-minute slot containing the target time
  const slotMin = Math.floor((hh * 60 + mm) / 15) * 15;
  const targetSlot = Math.floor((th * 60 + tm) / 15) * 15;
  return slotMin === targetSlot;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) return new Response("Misconfigured", { status: 500 });
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  const now = new Date();

  const { data: prefs } = await db
    .from("telegram_brief_prefs")
    .select("user_id, morning_at, evening_at, timezone");

  let sent = 0;
  for (const p of prefs ?? []) {
    const lp = localParts(p.timezone || "UTC", now);
    if (!lp) continue;

    const wantMorning = withinSlot(p.morning_at, lp.hh, lp.mm);
    const wantEvening = withinSlot(p.evening_at, lp.hh, lp.mm);
    if (!wantMorning && !wantEvening) continue;

    const { data: prof } = await db
      .from("profiles")
      .select("id, full_name, telegram_chat_id")
      .eq("id", p.user_id)
      .maybeSingle();
    if (!prof?.telegram_chat_id) continue;

    if (wantMorning) {
      const ok = await tryClaim(db, p.user_id, "morning", lp.dateISO);
      if (ok) { await sendMorning(db, prof); sent++; }
    }
    if (wantEvening) {
      const ok = await tryClaim(db, p.user_id, "evening", lp.dateISO);
      if (ok) { await sendEvening(db, prof, lp.dateISO, p.timezone || "UTC"); sent++; }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function tryClaim(db: any, userId: string, kind: string, dateISO: string): Promise<boolean> {
  const { error } = await db
    .from("telegram_brief_log")
    .insert({ user_id: userId, brief_kind: kind, local_date: dateISO });
  return !error;
}

async function sendMorning(db: any, prof: any) {
  // Counts: due today, overdue
  const today = new Date().toISOString().slice(0, 10);
  const { data: assigns } = await db
    .from("task_assignments")
    .select("task_id, tasks!inner(id, status, planned_end)")
    .eq("user_id", prof.id)
    .is("unassigned_at", null);

  const open = (assigns ?? []).filter((a: any) =>
    !["completed", "closed", "approved"].includes(a.tasks?.status));
  const dueToday = open.filter((a: any) => a.tasks?.planned_end === today).length;
  const overdue = open.filter((a: any) => a.tasks?.planned_end && a.tasks.planned_end < today).length;

  const name = prof.full_name?.split(" ")[0] ?? "";
  const text = [
    `🌅 <b>Morning Brief${name ? " — " + escapeHtml(name) : ""}</b>`,
    "",
    `📌 Today: <b>${dueToday}</b> task${dueToday === 1 ? "" : "s"} due`,
    `⚠️ Overdue: <b>${overdue}</b>`,
    "",
    `👉 Tap <b>📋 My Tasks</b> below.`,
  ].join("\n");
  await tgSend(prof.telegram_chat_id, text);
}

async function sendEvening(db: any, prof: any, _dateISO: string, _tz: string) {
  // Today's activity: progress updates by this user
  const since = new Date(Date.now() - 12 * 3600_000).toISOString();
  const { data: updates } = await db
    .from("task_updates")
    .select("task_id, progress_pct, created_at, tasks!inner(status)")
    .eq("user_id", prof.id)
    .gte("created_at", since);

  const total = updates?.length ?? 0;
  const completed = (updates ?? []).filter((u: any) =>
    u.tasks?.status === "completed" || u.progress_pct === 100).length;

  const text = [
    `🌙 <b>Daily Wrap</b>`,
    "",
    `✅ Completed today: <b>${completed}</b>`,
    `📈 Progress updates: <b>${total}</b>`,
    "",
    `Keep pushing. 💪`,
  ].join("\n");
  await tgSend(prof.telegram_chat_id, text);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
