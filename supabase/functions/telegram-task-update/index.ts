import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

function botUrl(apiKey: string, method: string): string {
  return `https://api.telegram.org/bot${apiKey}/${method}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");

    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Missing required env vars");
    }

    const { task_id, progress_pct, note, status, telegram_username } = await req.json();

    if (!task_id || progress_pct === undefined || !telegram_username) {
      throw new Error("Missing required fields: task_id, progress_pct, and telegram_username are required.");
    }

    if (status && !ALLOWED_STATUSES.has(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Find user by telegram_username
    const sanitizedUsername = telegram_username.replace(/^@/, "");

    const { data: profile, error: profileErr } = await db
      .from("profiles")
      .select("id, telegram_chat_id, full_name")
      .eq("telegram_username", sanitizedUsername)
      .maybeSingle();

    if (profileErr || !profile) {
      console.error("Profile not found for username:", sanitizedUsername, profileErr);
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized: Telegram username not found in DCOS." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = profile.id;

    // 2. Verify task assignment
    const { data: assignment, error: assignErr } = await db
      .from("task_assignments")
      .select("id")
      .eq("task_id", task_id)
      .eq("user_id", userId)
      .is("unassigned_at", null)
      .maybeSingle();

    if (assignErr || !assignment) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized: You are not assigned to this task." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Insert task update
    const { error: updateInsertErr } = await db
      .from("task_updates")
      .insert({
        task_id,
        user_id: userId,
        progress_pct,
        note: note || null,
      });

    if (updateInsertErr) throw updateInsertErr;

    // 4. Fetch current task
    const { data: currentTask } = await db
      .from("tasks")
      .select("status, code, title")
      .eq("id", task_id)
      .single();

    // 5. Build update payload
    const updateData: any = {
      progress_pct,
      updated_at: new Date().toISOString(),
    };

    let finalStatus = currentTask?.status;

    if (status && status !== currentTask?.status) {
      // User explicitly chose a status
      updateData.status = status;
      finalStatus = status;
      if (status === "in_progress" && !currentTask?.status?.includes("progress")) {
        updateData.actual_start = new Date().toISOString();
      }
      if (status === "completed") {
        updateData.actual_finish = new Date().toISOString();
      }
    } else if (
      currentTask &&
      (currentTask.status === "open" || currentTask.status === "assigned") &&
      progress_pct > 0
    ) {
      // Auto-advance to in_progress on first progress
      updateData.status = "in_progress";
      updateData.actual_start = new Date().toISOString();
      finalStatus = "in_progress";
    }

    const { error: taskUpdateErr } = await db
      .from("tasks")
      .update(updateData)
      .eq("id", task_id);

    if (taskUpdateErr) throw taskUpdateErr;

    // 6. Send confirmation back to Telegram chat
    if (TELEGRAM_API_KEY && profile.telegram_chat_id) {
      const statusLabel = STATUS_LABELS[finalStatus ?? ""] ?? finalStatus ?? "—";
      const lines = [
        `✅ <b>Task updated</b>`,
        `<b>Task:</b> ${escapeHtml(currentTask?.title ?? "")}${currentTask?.code ? ` (${escapeHtml(currentTask.code)})` : ""}`,
        `<b>Progress:</b> ${progress_pct}%`,
        `<b>Status:</b> ${escapeHtml(statusLabel)}`,
      ];
      if (note) lines.push(`<b>Note:</b> ${escapeHtml(String(note))}`);

      try {
        await fetch(botUrl(TELEGRAM_API_KEY, "sendMessage"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: profile.telegram_chat_id,
            text: lines.join("\n"),
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        });
      } catch (e) {
        console.error("Failed to send Telegram confirmation:", e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Task updated successfully.", status: finalStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("telegram-task-update error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
