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
  received: "Received",
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

async function tgSendMessage(chatId: number, text: string, reply_markup?: any): Promise<number | null> {
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
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
  try {
    const j = await res.json();
    return j?.result?.message_id ?? null;
  } catch {
    return null;
  }
}

async function tgEditMessage(chatId: number, messageId: number, text: string, reply_markup?: any) {
  await fetch(`${GATEWAY_URL}/editMessageText`, {
    method: "POST",
    headers: tgHeaders(),
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: reply_markup ?? { inline_keyboard: [] },
    }),
  });
}

async function tgDeleteMessage(chatId: number, messageId: number) {
  try {
    await fetch(`${GATEWAY_URL}/deleteMessage`, {
      method: "POST",
      headers: tgHeaders(),
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
  } catch {
    /* ignore */
  }
}

async function tgAnswerCallback(callbackId: string, text?: string) {
  await fetch(`${GATEWAY_URL}/answerCallbackQuery`, {
    method: "POST",
    headers: tgHeaders(),
    body: JSON.stringify({ callback_query_id: callbackId, text: text ?? "" }),
  });
}

// ---------- Card rendering ----------

function cardHeader(task: { title: string; code?: string | null; progress_pct?: number | null; status?: string | null }) {
  const titleLine = `<b>${escapeHtml(task.title)}</b>${task.code ? ` <code>${escapeHtml(task.code)}</code>` : ""}`;
  const currentBits: string[] = [];
  if (typeof task.progress_pct === "number") currentBits.push(`${task.progress_pct}%`);
  if (task.status) currentBits.push(STATUS_LABELS[task.status] ?? task.status);
  const current = currentBits.length ? `Current: ${currentBits.join(" • ")}` : "";
  return `✍️ <b>Update Progress</b>\n${titleLine}${current ? `\n<i>${escapeHtml(current)}</i>` : ""}\n────────────────`;
}

function renderProgressStep(task: any, lastPct: number | null, warning?: string) {
  const body = warning
    ? `⚠️ ${escapeHtml(warning)}`
    : `Reply with a number <b>0–100</b>${lastPct !== null ? ` (last: ${lastPct}%)` : ""}.`;
  return {
    text: `${cardHeader(task)}\n<b>Step 1/3 — Progress</b>\n${body}`,
    keyboard: { inline_keyboard: [[{ text: "❌ Cancel", callback_data: "nav:cancel" }]] },
  };
}

function renderStatusStep(task: any, pct: number) {
  return {
    text: `${cardHeader(task)}\n<b>Step 2/3 — Status</b>\nProgress: <b>${pct}%</b>. Pick a status:`,
    keyboard: {
      inline_keyboard: [
        [
          { text: "In Progress", callback_data: "st:in_progress" },
          { text: "Pending Approval", callback_data: "st:pending_approval" },
        ],
        [
          { text: "Completed", callback_data: "st:completed" },
          { text: "Blocked", callback_data: "st:blocked" },
        ],
        [{ text: "Keep current", callback_data: "st:keep" }],
        [
          { text: "⬅ Back", callback_data: "nav:back" },
          { text: "❌ Cancel", callback_data: "nav:cancel" },
        ],
      ],
    },
  };
}

function renderNoteStep(task: any, pct: number, status: string) {
  const label = status === "keep" ? "Keep current" : STATUS_LABELS[status] ?? status;
  return {
    text: `${cardHeader(task)}\n<b>Step 3/3 — Note</b>\nProgress: <b>${pct}%</b> • Status: <b>${escapeHtml(label)}</b>\nReply with a note, or send /skip.`,
    keyboard: {
      inline_keyboard: [
        [
          { text: "⏭ Skip note", callback_data: "nav:skip" },
        ],
        [
          { text: "⬅ Back", callback_data: "nav:back" },
          { text: "❌ Cancel", callback_data: "nav:cancel" },
        ],
      ],
    },
  };
}

function renderSummary(task: any, pct: number, finalStatus: string, note: string | null, byName: string | null) {
  const label = STATUS_LABELS[finalStatus] ?? finalStatus;
  const lines = [
    `✅ <b>Task updated</b>`,
    `<b>${escapeHtml(task.title)}</b>${task.code ? ` <code>${escapeHtml(task.code)}</code>` : ""}`,
    `Progress: <b>${pct}%</b>`,
    `Status: <b>${escapeHtml(label)}</b>`,
    `Note: ${note ? escapeHtml(note) : "—"}`,
  ];
  if (byName) lines.push(`<i>By ${escapeHtml(byName)} • ${new Date().toLocaleString("en-GB", { hour12: false })}</i>`);
  return { text: lines.join("\n"), keyboard: { inline_keyboard: [] } };
}

function renderCancelled(task: any) {
  return {
    text: `${cardHeader(task)}\n❌ <b>Update cancelled.</b>`,
    keyboard: { inline_keyboard: [] },
  };
}

// ---------- State helpers ----------

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

async function loadTask(db: any, taskId: string) {
  const { data } = await db
    .from("tasks")
    .select("id, title, code, progress_pct, status")
    .eq("id", taskId)
    .maybeSingle();
  return data;
}

async function finalizeTaskUpdate(
  db: any,
  args: { userId: string; taskId: string; progressPct: number; status: string | null; note: string | null },
) {
  const { userId, taskId, progressPct, status, note } = args;

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
  return finalStatus as string;
}

async function startUpdateFlow(db: any, chatId: number, taskId: string): Promise<void> {
  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  if (!profile) {
    await tgSendMessage(chatId, "❌ Your Telegram is not linked. Open DCOS → Settings → Telegram.");
    return;
  }
  const { data: assignment } = await db
    .from("task_assignments")
    .select("id")
    .eq("task_id", taskId)
    .eq("user_id", profile.id)
    .is("unassigned_at", null)
    .maybeSingle();
  if (!assignment) {
    await tgSendMessage(chatId, "❌ You are not assigned to this task.");
    return;
  }
  const task = await loadTask(db, taskId);
  if (!task) {
    await tgSendMessage(chatId, "❌ Task not found.");
    return;
  }

  // If existing flow card exists for this chat, drop it so we don't have orphans
  const existing = await getActiveState(db, chatId);
  if (existing?.card_message_id) {
    await tgDeleteMessage(chatId, existing.card_message_id);
  }

  const view = renderProgressStep(task, task.progress_pct ?? null);
  const messageId = await tgSendMessage(chatId, view.text, view.keyboard);

  await setState(db, chatId, {
    user_id: profile.id,
    task_id: taskId,
    step: "awaiting_progress",
    progress_pct: null,
    status: null,
    card_message_id: messageId,
  });
}

async function refreshCard(db: any, chatId: number, state: any, step: string, opts?: { warning?: string }) {
  const task = await loadTask(db, state.task_id);
  if (!task || !state.card_message_id) return;
  let view;
  if (step === "awaiting_progress") view = renderProgressStep(task, state.progress_pct ?? null, opts?.warning);
  else if (step === "awaiting_status") view = renderStatusStep(task, state.progress_pct ?? 0);
  else view = renderNoteStep(task, state.progress_pct ?? 0, state.status ?? "keep");
  await tgEditMessage(chatId, state.card_message_id, view.text, view.keyboard);
}

function buildTaskKeyboard(taskId: string, actionUrl: string | null, status?: string | null) {
  const kb: any[][] = [];
  // Once the task is finished, hide all action buttons.
  const isDone = status === "completed" || status === "closed" || status === "approved";
  if (actionUrl) kb.push([{ text: "🔎 Open in DCOS", url: actionUrl }]);
  if (isDone) return { inline_keyboard: kb };
  let baseUrl: string | null = null;
  if (actionUrl) {
    try {
      const u = new URL(actionUrl);
      if (u.protocol === "https:") baseUrl = `${u.protocol}//${u.host}`;
    } catch (_) { /* ignore */ }
  }
  if (!baseUrl) baseUrl = "https://build-flow-dcos.lovable.app";
  const updateUrl = `${baseUrl}/telegram/task-update/${taskId}`;
  if (status === "assigned" || status === "open") {
    kb.push([{ text: "✅ Received Task", callback_data: `rcv:${taskId}` }]);
  }
  kb.push([{ text: "✍️ Update Status", callback_data: `upd:${taskId}` }]);
  kb.push([{ text: "📈 Open Mini App", web_app: { url: updateUrl } }]);
  return { inline_keyboard: kb };
}

async function appendUpdateToOriginalCard(
  db: any,
  chatId: number,
  taskId: string,
  pct: number,
  finalStatus: string,
  note: string | null,
  byName: string | null,
): Promise<boolean> {
  // Find the most recent telegram_outbox row for this chat + task that has a message_id
  const { data: rows } = await db
    .from("telegram_outbox")
    .select("notification_id, message_id, message_text")
    .eq("chat_id", chatId)
    .eq("entity_type", "task")
    .eq("entity_id", taskId)
    .not("message_id", "is", null)
    .order("sent_at", { ascending: false })
    .limit(1);
  const row = rows?.[0];
  if (!row?.message_id) return false;

  // Look up the action_url to rebuild the same inline keyboard
  const { data: notif } = await db
    .from("notifications")
    .select("action_url")
    .eq("id", row.notification_id)
    .maybeSingle();

  const label = STATUS_LABELS[finalStatus] ?? finalStatus;
  const ts = new Date().toLocaleString("en-GB", { hour12: false });
  const updateBlock = [
    "",
    "────────────────",
    `✅ <b>Update</b> — ${escapeHtml(ts)}${byName ? ` • <i>${escapeHtml(byName)}</i>` : ""}`,
    `Progress: <b>${pct}%</b> • Status: <b>${escapeHtml(label)}</b>`,
    `Note: ${note ? escapeHtml(note) : "—"}`,
  ].join("\n");

  const newText = (row.message_text ?? "") + "\n" + updateBlock;
  const keyboard = buildTaskKeyboard(taskId, notif?.action_url ?? null, finalStatus);

  try {
    await tgEditMessage(chatId, row.message_id, newText, keyboard);
    await db
      .from("telegram_outbox")
      .update({ message_text: newText })
      .eq("notification_id", row.notification_id);
    return true;
  } catch (e) {
    console.error("appendUpdateToOriginalCard edit failed:", e);
    return false;
  }
}

async function finalizeAndShow(db: any, chatId: number, state: any, note: string | null) {
  const task = await loadTask(db, state.task_id);
  if (!task) return;
  let finalStatus = state.status ?? task.status;
  try {
    finalStatus = await finalizeTaskUpdate(db, {
      userId: state.user_id,
      taskId: state.task_id,
      progressPct: state.progress_pct ?? 0,
      status: state.status,
      note,
    });
  } catch (e) {
    console.error("finalizeTaskUpdate failed:", e);
    if (state.card_message_id) {
      await tgEditMessage(
        chatId,
        state.card_message_id,
        `${cardHeader(task)}\n⚠️ <b>Failed to save the update.</b> Please try again.`,
        { inline_keyboard: [] },
      );
    }
    await clearState(db, chatId);
    return;
  }
  const { data: profile } = await db.from("profiles").select("full_name").eq("id", state.user_id).maybeSingle();
  const pct = state.progress_pct ?? 0;
  const byName = profile?.full_name ?? null;

  // Try to append the update into the original task card so it sits
  // between the task details and the action buttons.
  const appended = await appendUpdateToOriginalCard(
    db, chatId, state.task_id, pct, finalStatus, note, byName,
  );

  if (appended) {
    // Remove the standalone flow card so only the original (now-updated)
    // task card remains in chat.
    if (state.card_message_id) await tgDeleteMessage(chatId, state.card_message_id);
  } else {
    // Fallback: original card not found — show standalone summary in place of the flow card.
    const view = renderSummary(task, pct, finalStatus, note, byName);
    if (state.card_message_id) {
      await tgEditMessage(chatId, state.card_message_id, view.text, view.keyboard);
    } else {
      await tgSendMessage(chatId, view.text);
    }
  }
  await clearState(db, chatId);
}

// ---------- Receive (acknowledge) flow ----------

async function handleReceived(
  db: any,
  chatId: number,
  taskId: string,
  messageId: number | undefined,
  callbackId: string,
) {
  // Resolve user from chat
  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  if (!profile) {
    await tgAnswerCallback(callbackId, "Telegram not linked");
    return;
  }

  // Must be assigned to this task
  const { data: assignment } = await db
    .from("task_assignments")
    .select("id")
    .eq("task_id", taskId)
    .eq("user_id", profile.id)
    .is("unassigned_at", null)
    .maybeSingle();
  if (!assignment) {
    await tgAnswerCallback(callbackId, "You are not assigned");
    return;
  }

  const { data: task } = await db
    .from("tasks")
    .select("id, code, title, status, project_id, created_by")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) {
    await tgAnswerCallback(callbackId, "Task not found");
    return;
  }

  // Only transition from open/assigned
  if (task.status !== "open" && task.status !== "assigned" && task.status !== "received") {
    await tgAnswerCallback(callbackId, "Already started");
    return;
  }

  if (task.status !== "received") {
    const { error: upErr } = await db
      .from("tasks")
      .update({ status: "received", updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (upErr) {
      console.error("Received update failed:", upErr);
      await tgAnswerCallback(callbackId, "Failed to update");
      return;
    }

    // Notify task creator and any other assignees (excluding the actor)
    const body = `${task.code ? task.code + " — " : ""}${task.title} • Received by ${profile.full_name ?? "assignee"}`;
    const recipients = new Set<string>();
    if (task.created_by && task.created_by !== profile.id) recipients.add(task.created_by);
    const { data: others } = await db
      .from("task_assignments")
      .select("user_id")
      .eq("task_id", taskId)
      .is("unassigned_at", null);
    for (const r of others ?? []) {
      if (r.user_id && r.user_id !== profile.id) recipients.add(r.user_id);
    }
    for (const uid of recipients) {
      try {
        await db.rpc("create_notification", {
          _user_id: uid,
          _type: "task_received",
          _title: "Task received by assignee",
          _body: body,
          _entity_type: "task",
          _entity_id: taskId,
          _project_id: task.project_id,
          _priority: "normal",
          _actor_id: profile.id,
          _metadata: {},
        });
      } catch (e) {
        console.error("create_notification failed:", e);
      }
    }
  }

  // Edit the existing card to reflect new status and remove the Received button
  if (messageId) {
    const { data: outboxRow } = await db
      .from("telegram_outbox")
      .select("notification_id, message_text")
      .eq("chat_id", chatId)
      .eq("message_id", messageId)
      .maybeSingle();
    const { data: notif } = outboxRow?.notification_id
      ? await db.from("notifications").select("action_url").eq("id", outboxRow.notification_id).maybeSingle()
      : { data: null };
    const ts = new Date().toLocaleString("en-GB", { hour12: false });
    const ack = [
      "",
      "────────────────",
      `✅ <b>Received</b> — ${escapeHtml(ts)}${profile.full_name ? ` • <i>${escapeHtml(profile.full_name)}</i>` : ""}`,
      `Status: <b>Received</b>`,
    ].join("\n");
    const newText = (outboxRow?.message_text ?? "") + ack;
    const keyboard = buildTaskKeyboard(taskId, notif?.action_url ?? null, "received");
    try {
      await tgEditMessage(chatId, messageId, newText, keyboard);
      if (outboxRow?.notification_id) {
        await db
          .from("telegram_outbox")
          .update({ message_text: newText })
          .eq("notification_id", outboxRow.notification_id);
      }
    } catch (e) {
      console.error("handleReceived edit failed:", e);
    }
  }

  await tgAnswerCallback(callbackId, "Marked as received");
}

// ---------- Menu / dashboard / lists ----------

const WEB_BASE_URL = "https://build-flow-dcos.lovable.app";

const BTN_DASHBOARD = "📊 Dashboard";
const BTN_MYTASKS = "📋 My Tasks";
const BTN_UPDATE = "➕ Update";
const BTN_TODAY = "⏰ Due Today";
const BTN_OVERDUE = "⚠️ Overdue";
const BTN_SETTINGS = "⚙️ Settings";

function mainKeyboard() {
  return {
    keyboard: [
      [{ text: BTN_DASHBOARD }, { text: BTN_MYTASKS }, { text: BTN_UPDATE }],
      [{ text: BTN_TODAY }, { text: BTN_OVERDUE }, { text: BTN_SETTINGS }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

const DONE_STATUSES = new Set(["completed", "closed", "approved"]);
const ACTIVE_STATUSES = new Set(["assigned", "received", "in_progress", "blocked", "rejected", "pending_approval"]);

function statusDot(status: string): string {
  if (DONE_STATUSES.has(status)) return "🟢";
  if (status === "blocked" || status === "rejected") return "🔴";
  if (status === "in_progress") return "🟡";
  if (status === "pending_approval") return "🟠";
  return "⚪";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function resolveProfile(db: any, chatId: number) {
  const { data } = await db
    .from("profiles")
    .select("id, full_name")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  return data;
}

async function fetchMyTasks(db: any, userId: string) {
  const { data } = await db
    .from("task_assignments")
    .select("task_id, tasks!inner(id, code, title, status, progress_pct, planned_end, project_id, projects(code))")
    .eq("user_id", userId)
    .is("unassigned_at", null)
    .limit(500);
  return (data ?? [])
    .map((r: any) => r.tasks)
    .filter(Boolean);
}

function filterTasks(tasks: any[], filter: string): any[] {
  const today = todayISO();
  switch (filter) {
    case "today":
      return tasks.filter((t) => t.planned_end === today && !DONE_STATUSES.has(t.status));
    case "overdue":
      return tasks.filter((t) => t.planned_end && t.planned_end < today && !DONE_STATUSES.has(t.status));
    case "active":
      return tasks.filter((t) => ACTIVE_STATUSES.has(t.status));
    case "done":
      return tasks.filter((t) => DONE_STATUSES.has(t.status));
    default:
      return tasks;
  }
}

async function renderDashboard(db: any, profile: any) {
  const tasks = await fetchMyTasks(db, profile.id);
  const today = todayISO();
  const completed = tasks.filter((t) => DONE_STATUSES.has(t.status)).length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter((t) => t.planned_end && t.planned_end < today && !DONE_STATUSES.has(t.status)).length;
  const notStarted = tasks.filter((t) => t.status === "assigned" || t.status === "open").length;
  const dueToday = tasks.filter((t) => t.planned_end === today && !DONE_STATUSES.has(t.status)).length;

  // 30-day completion rate
  const since = new Date(Date.now() - 30 * 86400_000);
  const recent = tasks.filter((t) => {
    if (DONE_STATUSES.has(t.status)) return true;
    return true; // include all open
  });
  const recentCompleted = tasks.filter((t) => DONE_STATUSES.has(t.status)).length;
  const total = recent.length || 1;
  const rate = Math.round((recentCompleted / total) * 100);

  const lines = [
    `📊 <b>My Dashboard</b>`,
    ``,
    `🟢 Completed       <b>${completed}</b>`,
    `🟡 In Progress     <b>${inProgress}</b>`,
    `🔴 Overdue         <b>${overdue}</b>`,
    `⚪ Not Started     <b>${notStarted}</b>`,
    ``,
    `📅 Due Today       <b>${dueToday}</b>`,
    `🔥 Completion 30d  <b>${rate}%</b>`,
  ];
  return {
    text: lines.join("\n"),
    keyboard: {
      inline_keyboard: [
        [
          { text: "📋 My Tasks", callback_data: "list:all:0" },
          { text: "⏰ Due Today", callback_data: "list:today:0" },
          { text: "⚠️ Overdue", callback_data: "list:overdue:0" },
        ],
      ],
    },
  };
}

const FILTER_LABELS: Record<string, string> = {
  all: "All", today: "Today", overdue: "Overdue", active: "Active", done: "Done",
};

async function renderTaskList(db: any, profile: any, filter: string, page: number) {
  const all = await fetchMyTasks(db, profile.id);
  const filtered = filterTasks(all, filter);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const p = Math.min(Math.max(0, page), totalPages - 1);
  const slice = filtered.slice(p * pageSize, p * pageSize + pageSize);

  const head = `📋 <b>My Tasks</b> · Page ${p + 1}/${totalPages} · ${FILTER_LABELS[filter] ?? "All"} (${filtered.length})`;
  const today = todayISO();
  const body = slice.length === 0
    ? "\n\n<i>No tasks in this view.</i>"
    : "\n\n" + slice.map((t, i) => {
        const idx = p * pageSize + i + 1;
        const dot = statusDot(t.status);
        const projCode = t.projects?.code ? `<code>${escapeHtml(t.projects.code)}</code>` : "";
        const dueBit = t.planned_end
          ? (t.planned_end < today && !DONE_STATUSES.has(t.status)
              ? ` · <b>overdue</b>`
              : ` · due ${escapeHtml(t.planned_end)}`)
          : "";
        const pct = typeof t.progress_pct === "number" ? `${t.progress_pct}%` : "—";
        const label = STATUS_LABELS[t.status] ?? t.status;
        return `<b>${idx}.</b> ${escapeHtml(t.title)} ${projCode}\n   ${dot} ${escapeHtml(label)} · ${pct}${dueBit}`;
      }).join("\n");

  // Filter row
  const filterRow = ["all", "today", "overdue", "active", "done"].map((f) => ({
    text: f === filter ? `• ${FILTER_LABELS[f]} •` : FILTER_LABELS[f],
    callback_data: `list:${f}:0`,
  }));

  // Pager
  const pager: any[] = [];
  if (p > 0) pager.push({ text: "⬅ Prev", callback_data: `list:${filter}:${p - 1}` });
  if (p < totalPages - 1) pager.push({ text: "Next ➡", callback_data: `list:${filter}:${p + 1}` });

  // Number buttons
  const numRow = slice.map((t, i) => ({
    text: `${p * pageSize + i + 1}`,
    callback_data: `open:${t.id}`,
  }));

  const inline_keyboard: any[][] = [filterRow];
  if (pager.length) inline_keyboard.push(pager);
  if (numRow.length) inline_keyboard.push(numRow);

  return { text: head + body, keyboard: { inline_keyboard } };
}

async function renderTaskPicker(db: any, profile: any, page: number) {
  const all = await fetchMyTasks(db, profile.id);
  const open = all.filter((t) => !DONE_STATUSES.has(t.status));
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(open.length / pageSize));
  const p = Math.min(Math.max(0, page), totalPages - 1);
  const slice = open.slice(p * pageSize, p * pageSize + pageSize);

  const head = `✍️ <b>Update which task?</b> · Page ${p + 1}/${totalPages}`;
  const lines = slice.map((t, i) => {
    const idx = p * pageSize + i + 1;
    const pct = typeof t.progress_pct === "number" ? `${t.progress_pct}%` : "—";
    return `<b>${idx}.</b> ${escapeHtml(t.title)} · ${statusDot(t.status)} ${pct}`;
  });

  const numRow = slice.map((t, i) => ({
    text: `${p * pageSize + i + 1}`,
    callback_data: `pick:${t.id}`,
  }));
  const pager: any[] = [];
  if (p > 0) pager.push({ text: "⬅ Prev", callback_data: `pkr:${p - 1}` });
  if (p < totalPages - 1) pager.push({ text: "Next ➡", callback_data: `pkr:${p + 1}` });

  const inline_keyboard: any[][] = [];
  if (numRow.length) inline_keyboard.push(numRow);
  if (pager.length) inline_keyboard.push(pager);

  const body = lines.length ? "\n\n" + lines.join("\n") : "\n\n<i>No open tasks.</i>";
  return { text: head + body, keyboard: { inline_keyboard } };
}

async function sendTaskDetail(db: any, chatId: number, taskId: string) {
  const { data: task } = await db
    .from("tasks")
    .select("id, code, title, status, progress_pct, planned_end, description, projects(code, name)")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) {
    await tgSendMessage(chatId, "❌ Task not found.", mainKeyboard());
    return;
  }
  const today = todayISO();
  const overdue = task.planned_end && task.planned_end < today && !DONE_STATUSES.has(task.status);
  const lines = [
    `${statusDot(task.status)} <b>${escapeHtml(task.title)}</b>${task.code ? ` <code>${escapeHtml(task.code)}</code>` : ""}`,
    task.projects?.name ? `Project: ${escapeHtml(task.projects.name)}` : "",
    `Status: <b>${escapeHtml(STATUS_LABELS[task.status] ?? task.status)}</b> · Progress: <b>${task.progress_pct ?? 0}%</b>`,
    task.planned_end ? `Due: ${escapeHtml(task.planned_end)}${overdue ? " ⚠️" : ""}` : "",
    task.description ? `\n${escapeHtml(String(task.description).slice(0, 400))}` : "",
  ].filter(Boolean).join("\n");

  const actionUrl = `${WEB_BASE_URL}/tasks/${task.id}`;
  const keyboard = buildTaskKeyboard(task.id, actionUrl, task.status);
  await tgSendMessage(chatId, lines, keyboard);
}

// ---------- Settings (brief prefs) ----------

const TIME_SLOTS = ["off", "07:00", "08:00", "09:00", "18:00", "19:00", "20:00"];

function nextSlot(current: string | null, slots: string[]): string {
  const idx = current ? slots.indexOf(current) : 0;
  return slots[(idx + 1) % slots.length] ?? "off";
}

const TIMEZONES = ["UTC", "Asia/Singapore", "Asia/Kuala_Lumpur", "Asia/Bangkok", "Asia/Dubai", "Europe/London", "America/New_York"];

async function getPrefs(db: any, userId: string) {
  const { data } = await db
    .from("telegram_brief_prefs")
    .select("morning_at, evening_at, timezone")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? { morning_at: null, evening_at: null, timezone: "Asia/Singapore" };
}

async function renderSettings(db: any, profile: any) {
  const p = await getPrefs(db, profile.id);
  const morn = p.morning_at ? String(p.morning_at).slice(0, 5) : "Off";
  const eve = p.evening_at ? String(p.evening_at).slice(0, 5) : "Off";
  const tz = p.timezone || "UTC";
  const lines = [
    `⚙️ <b>Settings</b>`,
    ``,
    `🌅 Morning brief: <b>${morn}</b>`,
    `🌙 Evening brief: <b>${eve}</b>`,
    `🌐 Timezone: <b>${escapeHtml(tz)}</b>`,
    ``,
    `<i>Tap to cycle through options.</i>`,
  ];
  return {
    text: lines.join("\n"),
    keyboard: {
      inline_keyboard: [
        [{ text: `🌅 Morning: ${morn}`, callback_data: "set:morning" }],
        [{ text: `🌙 Evening: ${eve}`, callback_data: "set:evening" }],
        [{ text: `🌐 TZ: ${tz}`, callback_data: "set:tz" }],
        [{ text: "🔗 Unlink Telegram", callback_data: "set:unlink" }],
      ],
    },
  };
}

async function cyclePref(db: any, userId: string, kind: "morning" | "evening" | "tz") {
  const p = await getPrefs(db, userId);
  const patch: any = { user_id: userId };
  if (kind === "morning") {
    const cur = p.morning_at ? String(p.morning_at).slice(0, 5) : "off";
    const nxt = nextSlot(cur === "off" ? "off" : cur, TIME_SLOTS);
    patch.morning_at = nxt === "off" ? null : nxt;
    patch.evening_at = p.evening_at;
    patch.timezone = p.timezone || "Asia/Singapore";
  } else if (kind === "evening") {
    const cur = p.evening_at ? String(p.evening_at).slice(0, 5) : "off";
    const nxt = nextSlot(cur === "off" ? "off" : cur, TIME_SLOTS);
    patch.morning_at = p.morning_at;
    patch.evening_at = nxt === "off" ? null : nxt;
    patch.timezone = p.timezone || "Asia/Singapore";
  } else {
    const cur = p.timezone || "UTC";
    const idx = TIMEZONES.indexOf(cur);
    patch.timezone = TIMEZONES[(idx + 1) % TIMEZONES.length];
    patch.morning_at = p.morning_at;
    patch.evening_at = p.evening_at;
  }
  await db.from("telegram_brief_prefs").upsert(patch, { onConflict: "user_id" });
}

// ---------- Inline search ----------

async function handleInlineQuery(db: any, iq: any) {
  const fromId: number | undefined = iq.from?.id;
  const q: string = (iq.query ?? "").trim();
  // Resolve user via chat_id == from id (private chats only — Telegram passes user id, chat_id == user id for private)
  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", fromId)
    .maybeSingle();
  let results: any[] = [];
  if (profile && q.length > 0) {
    const all = await fetchMyTasks(db, profile.id);
    const ql = q.toLowerCase();
    results = all
      .filter((t) => (t.title ?? "").toLowerCase().includes(ql) || (t.code ?? "").toLowerCase().includes(ql))
      .slice(0, 20)
      .map((t) => ({
        type: "article",
        id: t.id,
        title: `${t.title}${t.code ? ` (${t.code})` : ""}`,
        description: `${STATUS_LABELS[t.status] ?? t.status} · ${t.progress_pct ?? 0}%${t.planned_end ? ` · due ${t.planned_end}` : ""}`,
        input_message_content: {
          message_text: `🔎 <b>${escapeHtml(t.title)}</b>${t.code ? ` <code>${escapeHtml(t.code)}</code>` : ""}\n${statusDot(t.status)} ${escapeHtml(STATUS_LABELS[t.status] ?? t.status)} · ${t.progress_pct ?? 0}%`,
          parse_mode: "HTML",
        },
        reply_markup: {
          inline_keyboard: [[{ text: "🔎 Open in DCOS", url: `${WEB_BASE_URL}/tasks/${t.id}` }]],
        },
      }));
  }
  try {
    await fetch(`${GATEWAY_URL}/answerInlineQuery`, {
      method: "POST",
      headers: tgHeaders(),
      body: JSON.stringify({
        inline_query_id: iq.id,
        results,
        cache_time: 5,
        is_personal: true,
      }),
    });
  } catch (e) {
    console.error("answerInlineQuery failed:", e);
  }
}

// ---------- HTTP entry ----------

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

    // ---------- inline_query (search) ----------
    if (update.inline_query) {
      await handleInlineQuery(db, update.inline_query);
      return new Response(JSON.stringify({ ok: true }));
    }

    // ---------- callback_query (button taps) ----------
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId: number | undefined = cq.message?.chat?.id;
      const data: string = cq.data ?? "";
      if (!chatId) {
        await tgAnswerCallback(cq.id);
        return new Response(JSON.stringify({ ok: true }));
      }

      // Start flow: "upd:<task_id>"
      if (data.startsWith("upd:")) {
        await tgAnswerCallback(cq.id);
        await startUpdateFlow(db, chatId, data.slice(4));
        return new Response(JSON.stringify({ ok: true }));
      }

      // Receive task: "rcv:<task_id>"
      if (data.startsWith("rcv:")) {
        const taskId = data.slice(4);
        const messageId: number | undefined = cq.message?.message_id;
        await handleReceived(db, chatId, taskId, messageId, cq.id);
        return new Response(JSON.stringify({ ok: true }));
      }

      const state = await getActiveState(db, chatId);

      // Navigation buttons
      if (data === "nav:cancel") {
        await tgAnswerCallback(cq.id, "Cancelled");
        if (state) {
          if (state.card_message_id) {
            await tgDeleteMessage(chatId, state.card_message_id);
          }
          await clearState(db, chatId);
        }
        return new Response(JSON.stringify({ ok: true }));
      }

      if (data === "nav:back") {
        await tgAnswerCallback(cq.id);
        if (!state) return new Response(JSON.stringify({ ok: true }));
        if (state.step === "awaiting_status") {
          await setState(db, chatId, {
            user_id: state.user_id,
            task_id: state.task_id,
            progress_pct: state.progress_pct,
            status: null,
            card_message_id: state.card_message_id,
            step: "awaiting_progress",
          });
          await refreshCard(db, chatId, { ...state, status: null }, "awaiting_progress");
        } else if (state.step === "awaiting_note") {
          await setState(db, chatId, {
            user_id: state.user_id,
            task_id: state.task_id,
            progress_pct: state.progress_pct,
            status: state.status,
            card_message_id: state.card_message_id,
            step: "awaiting_status",
          });
          await refreshCard(db, chatId, state, "awaiting_status");
        }
        return new Response(JSON.stringify({ ok: true }));
      }

      if (data === "nav:skip") {
        await tgAnswerCallback(cq.id);
        if (state?.step === "awaiting_note") {
          await finalizeAndShow(db, chatId, state, null);
        }
        return new Response(JSON.stringify({ ok: true }));
      }

      // Status pick: "st:<value>"
      if (data.startsWith("st:")) {
        const value = data.slice(3);
        if (!state || state.step !== "awaiting_status") {
          await tgAnswerCallback(cq.id, "Flow expired");
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
          card_message_id: state.card_message_id,
          step: "awaiting_note",
        });
        await tgAnswerCallback(cq.id);
        await refreshCard(db, chatId, { ...state, status: value }, "awaiting_note");
        return new Response(JSON.stringify({ ok: true }));
      }

      // ---------- Menu navigation callbacks ----------
      // list:<filter>:<page>
      if (data.startsWith("list:")) {
        await tgAnswerCallback(cq.id);
        const [, filter, pageStr] = data.split(":");
        const profile = await resolveProfile(db, chatId);
        if (!profile) {
          await tgSendMessage(chatId, "❌ Telegram not linked.", mainKeyboard());
          return new Response(JSON.stringify({ ok: true }));
        }
        const view = await renderTaskList(db, profile, filter, Number(pageStr) || 0);
        const messageId: number | undefined = cq.message?.message_id;
        if (messageId) await tgEditMessage(chatId, messageId, view.text, view.keyboard);
        else await tgSendMessage(chatId, view.text, view.keyboard);
        return new Response(JSON.stringify({ ok: true }));
      }

      // open:<taskId>
      if (data.startsWith("open:")) {
        await tgAnswerCallback(cq.id);
        await sendTaskDetail(db, chatId, data.slice(5));
        return new Response(JSON.stringify({ ok: true }));
      }

      // pick:<taskId> — selected from updater picker
      if (data.startsWith("pick:")) {
        await tgAnswerCallback(cq.id);
        await startUpdateFlow(db, chatId, data.slice(5));
        return new Response(JSON.stringify({ ok: true }));
      }

      // pkr:<page> — picker pagination
      if (data.startsWith("pkr:")) {
        await tgAnswerCallback(cq.id);
        const profile = await resolveProfile(db, chatId);
        if (!profile) return new Response(JSON.stringify({ ok: true }));
        const view = await renderTaskPicker(db, profile, Number(data.slice(4)) || 0);
        const messageId: number | undefined = cq.message?.message_id;
        if (messageId) await tgEditMessage(chatId, messageId, view.text, view.keyboard);
        return new Response(JSON.stringify({ ok: true }));
      }

      // set:morning | set:evening | set:tz | set:unlink
      if (data.startsWith("set:")) {
        const kind = data.slice(4);
        const profile = await resolveProfile(db, chatId);
        if (!profile) {
          await tgAnswerCallback(cq.id, "Not linked");
          return new Response(JSON.stringify({ ok: true }));
        }
        if (kind === "unlink") {
          await db.from("profiles").update({
            telegram_chat_id: null, telegram_username: null, telegram_linked_at: null,
          }).eq("id", profile.id);
          await tgAnswerCallback(cq.id, "Unlinked");
          const messageId: number | undefined = cq.message?.message_id;
          if (messageId) await tgEditMessage(chatId, messageId, "🔗 <b>Telegram unlinked.</b>\nGenerate a new code in DCOS Settings → Telegram to relink.", { inline_keyboard: [] });
          return new Response(JSON.stringify({ ok: true }));
        }
        if (kind === "morning" || kind === "evening" || kind === "tz") {
          await cyclePref(db, profile.id, kind);
          await tgAnswerCallback(cq.id, "Saved");
          const view = await renderSettings(db, profile);
          const messageId: number | undefined = cq.message?.message_id;
          if (messageId) await tgEditMessage(chatId, messageId, view.text, view.keyboard);
          return new Response(JSON.stringify({ ok: true }));
        }
      }

      await tgAnswerCallback(cq.id);
      return new Response(JSON.stringify({ ok: true }));
    }

    // ---------- regular messages ----------
    const msg = update.message ?? update.edited_message;
    const chatId: number | undefined = msg?.chat?.id;
    const text: string | undefined = msg?.text;
    const username: string | undefined = msg?.from?.username;
    const messageId: number | undefined = msg?.message_id;

    if (!chatId || !text) {
      return new Response(JSON.stringify({ ok: true, ignored: true }));
    }

    // /cancel — always exits any in-progress flow
    if (/^\/cancel\b/i.test(text)) {
      const state = await getActiveState(db, chatId);
      if (state) {
        if (state.card_message_id) {
          await tgDeleteMessage(chatId, state.card_message_id);
        }
        await clearState(db, chatId);
      }
      if (messageId) await tgDeleteMessage(chatId, messageId);
      return new Response(JSON.stringify({ ok: true }));
    }

    // Main Menu intercept
    if (text === "☰ Main Menu" || text.trim() === "/start") {
      await tgSendMessage(
        chatId,
        "👋 Welcome to <b>DCOS Alerts</b>.\n\nTo receive task notifications, open <b>Settings → Telegram</b> in DCOS, generate a link code, then send:\n<code>YOURCODE</code>",
        { 
          inline_keyboard: [[{ text: "🚀 Open DCOS Web App", web_app: { url: "https://build-flow-dcos.lovable.app" } }]],
        }
      );
      return new Response(JSON.stringify({ ok: true }));
    }

    // Code linking (allows just pasting the code, e.g., "ABCD12" or "/start ABCD12")
    const codeMatch = text.match(/^(?:\/start\s+)?([A-Z0-9]{4,12})$/i);
    const isExplicitStart = text.toLowerCase().startsWith("/start ");
    
    if (codeMatch) {
      const code = codeMatch[1]?.toUpperCase();
      
      const { data: row } = await db
        .from("telegram_link_codes")
        .select("user_id, expires_at, used_at")
        .eq("code", code)
        .maybeSingle();

      if (row) {
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
          "✅ <b>Successfully connected to DCOS Web App!</b>\n\nYour Telegram account is now linked. You will receive task assignments, approvals, and system alerts here.\n\nOpen the web app anytime from the button below.",
          {
            inline_keyboard: [[{ text: "🚀 Open DCOS Web App", web_app: { url: "https://build-flow-dcos.lovable.app" } }]],
          },
        );
        return new Response(JSON.stringify({ ok: true }));
      } else if (isExplicitStart) {
        // If they explicitly used /start but it's invalid
        await tgSendMessage(chatId, "❌ Invalid code. Please generate a new one in DCOS Settings → Telegram.");
        return new Response(JSON.stringify({ ok: true }));
      }
      // If it wasn't explicit /start and row wasn't found, it might just be a regular message (e.g. note), so let it fall through.
    }

    // ---------- in-flight conversation? ----------
    const state = await getActiveState(db, chatId);
    if (state) {
      if (state.step === "awaiting_progress") {
        const trimmed = text.trim();
        const num = Number(trimmed);
        if (!Number.isFinite(num) || num < 0 || num > 100 || !/^\d+(\.\d+)?$/.test(trimmed)) {
          if (messageId) await tgDeleteMessage(chatId, messageId);
          await refreshCard(db, chatId, state, "awaiting_progress", { warning: "Send a number 0–100." });
          return new Response(JSON.stringify({ ok: true }));
        }
        const pct = Math.round(num);
        if (messageId) await tgDeleteMessage(chatId, messageId);

        // Auto-complete shortcut: 100% skips status + note steps.
        if (pct === 100) {
          await finalizeAndShow(
            db,
            chatId,
            { ...state, progress_pct: 100, status: "completed" },
            null,
          );
          return new Response(JSON.stringify({ ok: true }));
        }

        await setState(db, chatId, {
          user_id: state.user_id,
          task_id: state.task_id,
          progress_pct: pct,
          status: state.status,
          card_message_id: state.card_message_id,
          step: "awaiting_status",
        });
        await refreshCard(db, chatId, { ...state, progress_pct: pct }, "awaiting_status");
        return new Response(JSON.stringify({ ok: true }));
      }

      if (state.step === "awaiting_status") {
        if (messageId) await tgDeleteMessage(chatId, messageId);
        // user typed text; nudge to tap a button
        return new Response(JSON.stringify({ ok: true }));
      }

      if (state.step === "awaiting_note") {
        const note = /^\/skip\b/i.test(text) ? null : text.trim().slice(0, 1000);
        if (messageId) await tgDeleteMessage(chatId, messageId);
        await finalizeAndShow(db, chatId, state, note);
        return new Response(JSON.stringify({ ok: true }));
      }
    }

    // Default reply
    await tgSendMessage(
      chatId,
      "ℹ️ Tap <b>✍️ Update Progress (in chat)</b> on a task notification to update it from here.",
      {
         keyboard: [[{ text: "☰ Main Menu" }]],
         resize_keyboard: true,
         is_persistent: true
      }
    );
    return new Response(JSON.stringify({ ok: true }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("telegram-webhook error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
});
