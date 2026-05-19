import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Missing required env vars");
    }

    const { task_id, progress_pct, note, telegram_username } = await req.json();

    if (!task_id || progress_pct === undefined || !telegram_username) {
      throw new Error("Missing required fields: task_id, progress_pct, and telegram_username are required.");
    }

    const db = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Find user by telegram_username
    // Remove '@' if present
    const sanitizedUsername = telegram_username.replace(/^@/, "");
    
    const { data: profile, error: profileErr } = await db
      .from("profiles")
      .select("id")
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

    // 4. Update task progress and potentially status
    const updateData: any = { 
      progress_pct,
      updated_at: new Date().toISOString()
    };
    
    // Automatically move to 'in_progress' if progress > 0 and it was 'assigned' or 'open'
    // Or move to 'completed' if progress is 100? Let's be conservative and just update progress.
    // The user can change status in the main app, but maybe we should at least ensure it's in_progress?
    
    const { data: currentTask } = await db
      .from("tasks")
      .select("status")
      .eq("id", task_id)
      .single();

    if (currentTask && (currentTask.status === 'open' || currentTask.status === 'assigned') && progress_pct > 0) {
      updateData.status = 'in_progress';
      updateData.actual_start = new Date().toISOString();
    }
    
    if (progress_pct === 100 && currentTask?.status !== 'completed' && currentTask?.status !== 'closed') {
        // We might want to set to completed, but usually that requires approval in this system
        // Let's just stick to the progress update for now as per plan.
    }

    const { error: taskUpdateErr } = await db
      .from("tasks")
      .update(updateData)
      .eq("id", task_id);

    if (taskUpdateErr) throw taskUpdateErr;

    return new Response(JSON.stringify({ ok: true, message: "Task updated successfully." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("telegram-task-update error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
