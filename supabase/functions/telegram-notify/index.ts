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

const TASK_TYPE_LABELS: Record<string, string> = {
  design: "Design",
  procurement: "Procurement",
  construction: "Construction",
  inspection: "Inspection",
  approval: "Approval",
  documentation: "Documentation",
  meeting: "Meeting",
  other: "Other",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  submitted: "Submitted for Approval",
  approved: "Approved",
  rejected: "Rejected",
  blocked: "Blocked",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return String(d).slice(0, 10);
}

function labelize(v: string | null | undefined, map?: Record<string, string>): string {
  if (!v) return "—";
  if (map && map[v]) return map[v];
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMessage(n: any, task: any | null): string {
  const emoji = PRIORITY_EMOJI[n.priority] ?? "🔔";
  const lines = [`${emoji} <b>${escapeHtml(n.title ?? "Notification")}</b>`];
  if (n.body) lines.push(escapeHtml(n.body));

  if (task) {
    lines.push("");
    lines.push(`<b>Task Name:</b> ${escapeHtml(task.title ?? "—")}${task.code ? ` (${escapeHtml(task.code)})` : ""}`);
    lines.push(`<b>Task Type:</b> ${escapeHtml(labelize(task.task_type, TASK_TYPE_LABELS))}`);
    lines.push(`<b>Task Category:</b> ${escapeHtml(labelize(task.category))}`);
    const wbsParts: string[] = [];
    if (task.project_name) wbsParts.push(task.project_name);
    if (Array.isArray(task.wbs_path) && task.wbs_path.length) {
      for (const p of task.wbs_path) wbsParts.push(p);
    }
    if (task.location_zone) wbsParts.push(task.location_zone);
    const wbs = wbsParts.length ? wbsParts.join(" / ") : "—";
    lines.push(`<b>WBS Location:</b> ${escapeHtml(wbs)}`);
    lines.push(`<b>Plan Start:</b> ${escapeHtml(fmtDate(task.planned_start))}`);
    lines.push(`<b>Plan End:</b> ${escapeHtml(fmtDate(task.planned_end))}`);
    lines.push(`<b>Status:</b> ${escapeHtml(labelize(task.status, TASK_STATUS_LABELS))}`);
  }

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
      .select("id, user_id, title, body, priority, action_url, type, entity_type, entity_id")
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

    // Fetch task details if notification refers to a task
    let task: any = null;
    if (n.entity_type === "task" && n.entity_id) {
      const { data: t } = await db
        .from("tasks")
        .select("id, code, title, task_type, category, status, planned_start, planned_end, location_zone, wbs_node_id, project_id")
        .eq("id", n.entity_id)
        .maybeSingle();
      if (t) {
        task = t;

        // Project name
        if (t.project_id) {
          const { data: p } = await db
            .from("projects")
            .select("name")
            .eq("id", t.project_id)
            .maybeSingle();
          task.project_name = p?.name ?? null;
        }

        // WBS ancestor chain (root → leaf), names only
        if (t.wbs_node_id) {
          const chain: string[] = [];
          let currentId: string | null = t.wbs_node_id;
          let guard = 0;
          while (currentId && guard < 12) {
            const { data: node } = await db
              .from("wbs_nodes")
              .select("name, parent_id")
              .eq("id", currentId)
              .maybeSingle();
            if (!node) break;
            chain.unshift(node.name);
            currentId = node.parent_id;
            guard++;
          }
          task.wbs_path = chain;
        }
      }
    }


    const text = formatMessage(n, task);

    const inline_keyboard: any[][] = [];
    if (n.action_url) {
      inline_keyboard.push([{ text: "🔎 Open in DCOS", url: n.action_url }]);
    }

    // Update Progress button for tasks — try Mini App (web_app) first if HTTPS,
    // otherwise fall back to a regular URL button so the user always has a way
    // to update progress from Telegram.
    if (n.entity_type === "task" && n.entity_id) {
      let baseUrl: string | null = null;
      if (n.action_url) {
        try {
          const u = new URL(n.action_url);
          if (u.protocol === "https:") baseUrl = `${u.protocol}//${u.host}`;
        } catch (_) { /* ignore */ }
      }
      // Fallback to published app host if action_url is not usable
      if (!baseUrl) baseUrl = "https://build-flow-dcos.lovable.app";

      const updateUrl = `${baseUrl}/telegram/task-update/${n.entity_id}`;
      // Use web_app for in-Telegram Mini App experience (works in private chats
      // once the bot's Mini App domain is configured). Also add a plain URL
      // button as a guaranteed fallback so the button always appears.
      // In-chat quick update flow (no Mini App needed)
      inline_keyboard.push([{ text: "✍️ Update Progress (in chat)", callback_data: `upd:${n.entity_id}` }]);
      // Mini App + browser fallback
      inline_keyboard.push([{ text: "📈 Open Mini App", web_app: { url: updateUrl } }]);
      inline_keyboard.push([{ text: "🌐 Update in Browser", url: updateUrl }]);
    }

    const reply_markup = inline_keyboard.length > 0
      ? { inline_keyboard }
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
      message_id: tgData?.result?.message_id ?? null,
      message_text: text,
      entity_type: n.entity_type ?? null,
      entity_id: n.entity_id ?? null,
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
