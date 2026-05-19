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

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  closed: "Closed",
  blocked: "Blocked",
};
const ALLOWED_STATUSES = new Set(Object.keys(STATUS_LABELS));

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tgHeaders() {
  return {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "X-Connection-Api-Key": Deno.env.get("TELEGRAM_API_KEY")!,
    "Content-Type": "application/json",
  };
}

async function tgSendMessage(chatId: number, text: string, reply_markup?: any) {
  await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: tgHeaders(),
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup,
    }),
  });
}

async function tgAnswerCallback(callbackId: string, text?: string) {
  await fetch(`${GATEWAY_URL}/answerCallbackQuery`, {
    method: "POST",
    headers: tgHeaders(),
    body: JSON.stringify({ callback_query_id: callbackId, text: text ?? "" }),
  });
}

function statusKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "In Progress", callback_data: "st:in_progress" },
        { text: "Pending Approval", callback_data: "st:pending_approval" },
      ],
      [
        { text: "Blocked", callback_data: "st:blocked" },
        { text: "Keep current", callback_data: "st:keep" },
      ],
      [{ text: "❌ Cancel", callback_data: "st:cancel" }],
    ],
  };
}

async function getActiveState(db: any, chatId: number) {
  const { data } = await db
    .from("telegram_conversation_state")
    .select("*")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await db.from("telegram_conversation_state").delete().eq("chat_id", chatId);
    return null;
  }
  return data;
}

async function setState(db: any, chatId: number, patch: Record<string, unknown>) {
  await db.from("telegram_conversation_state").upsert({
    chat_id: chatId,
    expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    updated_at: new Date().toISOString(),
    ...patch,
  });
}

async function clearState(db: any, chatId: number) {
  await db.from("telegram_conversation_state").delete().eq("chat_id", chatId);
}

async function finalizeTaskUpdate(
  db: any,
  args: { chatId: number; userId: string; taskId: string; progressPct: number; status: string | null; note: string | null },
) {
  const { chatId, userId, taskId, progressPct, status, note } = args;

  await db.from("task_updates").insert({
    task_id: taskId,
    user_id: userId,
    progress_pct: progressPct,
    note: note || null,
  });

  const { data: currentTask } = await db
    .from("tasks")
    .select("status, code, title")
    .eq("id", taskId)
    .single();

  const updateData: any = { progress_pct: progressPct, updated_at: new Date().toISOString() };
  let finalStatus = currentTask?.status;

  if (status && status !== "keep" && status !== currentTask?.status) {
    updateData.status = status;
    finalStatus = status;
    if (status === "in_progress") updateData.actual_start = new Date().toISOString();
    if (status === "completed") updateData.actual_finish = new Date().toISOString();
  } else if (
    currentTask &&
    (currentTask.status === "open" || currentTask.status === "assigned") &&
    progressPct > 0
  ) {
    updateData.status = "in_progress";
    updateData.actual_start = new Date().toISOString();
    finalStatus = "in_progress";
  }

  await db.from("tasks").update(updateData).eq("id", taskId);

  const statusLabel = STATUS_LABELS[finalStatus ?? ""] ?? finalStatus ?? "—";
  const lines = [
    `✅ <b>Task updated</b>`,
    `<b>Task:</b> ${escapeHtml(currentTask?.title ?? "")}${currentTask?.code ? ` (${escapeHtml(currentTask.code)})` : ""}`,
    `<b>Progress:</b> ${progressPct}%`,
    `<b>Status:</b> ${escapeHtml(statusLabel)}`,
  ];
  if (note) lines.push(`<b>Note:</b> ${escapeHtml(note)}`);
  await tgSendMessage(chatId, lines.join("\n"));
}

async function handleStartUpdateFlow(db: any, chatId: number, taskId: string): Promise<string> {
  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  if (!profile) {
    return "❌ Your Telegram is not linked. Open DCOS → Settings → Telegram.";
  }
  const { data: assignment } = await db
    .from("task_assignments")
    .select("id")
    .eq("task_id", taskId)
    .eq("user_id", profile.id)
    .is("unassigned_at", null)
    .maybeSingle();
  if (!assignment) {
    return "❌ You are not assigned to this task.";
  }
  const { data: task } = await db
    .from("tasks")
    .select("title, code")
    .eq("id", taskId)
    .maybeSingle();
  await setState(db, chatId, {
    user_id: profile.id,
    task_id: taskId,
    step: "awaiting_progress",
    progress_pct: null,
    status: null,
  });
  const label = task ? `<b>${escapeHtml(task.title)}</b>${task.code ? ` (${escapeHtml(task.code)})` : ""}` : "this task";
  return `✍️ Reply with progress % for ${label}.\nSend a number from <b>0 to 100</b>.\n\nReply /cancel to abort.`;
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

    // ---------- callback_query (button taps) ----------
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId: number | undefined = cq.message?.chat?.id;
      const data: string = cq.data ?? "";
      if (!chatId) {
        await tgAnswerCallback(cq.id);
        return new Response(JSON.stringify({ ok: true }));
      }

      // Start update flow: "upd:<task_id>"
      if (data.startsWith("upd:")) {
        const taskId = data.slice(4);
        const reply = await handleStartUpdateFlow(db, chatId, taskId);
        await tgAnswerCallback(cq.id);
        await tgSendMessage(chatId, reply);
        return new Response(JSON.stringify({ ok: true }));
      }

      // Status pick: "st:<value>"
      if (data.startsWith("st:")) {
        const value = data.slice(3);
        const state = await getActiveState(db, chatId);
        if (!state || state.step !== "awaiting_status") {
          await tgAnswerCallback(cq.id, "Flow expired");
          return new Response(JSON.stringify({ ok: true }));
        }
        if (value === "cancel") {
          await clearState(db, chatId);
          await tgAnswerCallback(cq.id, "Cancelled");
          await tgSendMessage(chatId, "❌ Update cancelled.");
          return new Response(JSON.stringify({ ok: true }));
        }
        if (value !== "keep" && !ALLOWED_STATUSES.has(value)) {
          await tgAnswerCallback(cq.id, "Invalid status");
          return new Response(JSON.stringify({ ok: true }));
        }
        await setState(db, chatId, {
          user_id: state.user_id,
          task_id: state.task_id,
          progress_pct: state.progress_pct,
          status: value,
          step: "awaiting_note",
        });
        await tgAnswerCallback(cq.id);
        await tgSendMessage(chatId, "📝 Add a note? Reply with text, or send /skip.");
        return new Response(JSON.stringify({ ok: true }));
      }

      await tgAnswerCallback(cq.id);
      return new Response(JSON.stringify({ ok: true }));
    }

    // ---------- regular messages ----------
    const msg = update.message ?? update.edited_message;
    const chatId: number | undefined = msg?.chat?.id;
    const text: string | undefined = msg?.text;
    const username: string | undefined = msg?.from?.username;

    if (!chatId || !text) {
      return new Response(JSON.stringify({ ok: true, ignored: true }));
    }

    // /cancel — always exits any in-progress flow
    if (/^\/cancel\b/i.test(text)) {
      await clearState(db, chatId);
      await tgSendMessage(chatId, "❌ Update cancelled.");
      return new Response(JSON.stringify({ ok: true }));
    }

    // /start <code> linking
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

    // ---------- in-flight conversation? ----------
    const state = await getActiveState(db, chatId);
    if (state) {
      if (state.step === "awaiting_progress") {
        const trimmed = text.trim();
        const num = Number(trimmed);
        if (!Number.isFinite(num) || num < 0 || num > 100 || !/^\d+(\.\d+)?$/.test(trimmed)) {
          await tgSendMessage(chatId, "⚠️ Please reply with a number from 0 to 100. Or /cancel.");
          return new Response(JSON.stringify({ ok: true }));
        }
        const pct = Math.round(num);
        await setState(db, chatId, {
          user_id: state.user_id,
          task_id: state.task_id,
          progress_pct: pct,
          status: state.status,
          step: "awaiting_status",
        });
        await tgSendMessage(chatId, `Got <b>${pct}%</b>. Now pick a status:`, statusKeyboard());
        return new Response(JSON.stringify({ ok: true }));
      }

      if (state.step === "awaiting_status") {
        await tgSendMessage(chatId, "Please tap one of the status buttons above, or /cancel.");
        return new Response(JSON.stringify({ ok: true }));
      }

      if (state.step === "awaiting_note") {
        const note = /^\/skip\b/i.test(text) ? null : text.trim().slice(0, 1000);
        try {
          await finalizeTaskUpdate(db, {
            chatId,
            userId: state.user_id,
            taskId: state.task_id,
            progressPct: state.progress_pct ?? 0,
            status: state.status,
            note,
          });
        } catch (e) {
          console.error("finalizeTaskUpdate failed:", e);
          await tgSendMessage(chatId, "⚠️ Failed to save the update. Please try again.");
        }
        await clearState(db, chatId);
        return new Response(JSON.stringify({ ok: true }));
      }
    }

    // Default reply
    await tgSendMessage(
      chatId,
      "ℹ️ Tap <b>✍️ Update Progress (in chat)</b> on a task notification to update it from here.",
    );
    return new Response(JSON.stringify({ ok: true }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("telegram-webhook error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
});
