import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";

// Mock user for testing
const TEST_PROJECT_ID = "test-project-id";
const TEST_USER_ID = "test-user-id";

describe("Construction Module - Task Status Flow (Module 14.3)", () => {
  let taskId: string;

  beforeEach(async () => {
    // Create a test task
    const { data, error } = await supabase
      .from("construction_tasks")
      .insert({
        project_id: TEST_PROJECT_ID,
        task_code: `TEST-${Date.now()}`,
        title: "Test Construction Task",
        status: "open",
        priority: "medium",
        created_by: TEST_USER_ID,
      })
      .select()
      .single();
    
    if (error) throw error;
    taskId = data.id;
  });

  afterEach(async () => {
    // Cleanup
    await supabase
      .from("construction_tasks")
      .delete()
      .eq("id", taskId);
  });

  it("should create task with default status 'open'", async () => {
    const { data, error } = await supabase
      .from("construction_tasks")
      .select("status")
      .eq("id", taskId)
      .single();
    
    expect(error).toBeNull();
    expect(data?.status).toBe("open");
  });

  it("should transition from open → assigned → in_progress → completed", async () => {
    // Open → Assigned
    let { error } = await supabase
      .from("construction_tasks")
      .update({ status: "assigned", assigned_to: TEST_USER_ID })
      .eq("id", taskId);
    expect(error).toBeNull();

    // Assigned → In Progress
    ({ error } = await supabase
      .from("construction_tasks")
      .update({ status: "in_progress", actual_start: new Date().toISOString() })
      .eq("id", taskId));
    expect(error).toBeNull();

    // In Progress → Completed
    ({ error } = await supabase
      .from("construction_tasks")
      .update({ status: "completed", progress_pct: 100 })
      .eq("id", taskId));
    expect(error).toBeNull();

    const { data } = await supabase
      .from("construction_tasks")
      .select("status")
      .eq("id", taskId)
      .single();
    
    expect(data?.status).toBe("completed");
  });

  it("should not allow submit for approval with progress < 100%", async () => {
    const { error } = await supabase
      .from("construction_tasks")
      .update({ status: "submitted_for_approval", progress_pct: 50 })
      .eq("id", taskId);
    
    // Should fail due to trigger validation
    expect(error).not.toBeNull();
  });

  it("should allow submit for approval with progress = 100%", async () => {
    const { error } = await supabase
      .from("construction_tasks")
      .update({ status: "submitted_for_approval", progress_pct: 100 })
      .eq("id", taskId);
    
    expect(error).toBeNull();
  });
});

describe("Construction Module - WBS Progress Roll-up (Module 8.4, 8.6)", () => {
  it("should update WBS node progress when task progress changes", async () => {
    // This test verifies the trigger: trg_construction_task_progress_rollup
    // 1. Create WBS node
    const { data: wbsNode } = await supabase
      .from("wbs_nodes")
      .insert({
        project_id: TEST_PROJECT_ID,
        node_type: "element",
        wbs_code: "TEST-E001",
        wbs_name: "Test Element",
        full_path: "P001-B01-L01-TEST-E001",
      })
      .select()
      .single();
    
    expect(wbsNode).not.toBeNull();
    
    // 2. Create task linked to WBS
    const { data: task } = await supabase
      .from("construction_tasks")
      .insert({
        project_id: TEST_PROJECT_ID,
        wbs_node_id: wbsNode!.id,
        task_code: `TEST-ROLLUP-${Date.now()}`,
        title: "Rollup Test Task",
        status: "in_progress",
        progress_pct: 50,
        created_by: TEST_USER_ID,
      })
      .select()
      .single();
    
    // 3. Verify WBS progress updated
    const { data: updatedWbs } = await supabase
      .from("wbs_nodes")
      .select("progress_percent")
      .eq("id", wbsNode!.id)
      .single();
    
    expect(updatedWbs?.progress_percent).toBe(50);
    
    // 4. Update task progress to 100%
    await supabase
      .from("construction_tasks")
      .update({ progress_pct: 100 })
      .eq("id", task!.id);
    
    const { data: finalWbs } = await supabase
      .from("wbs_nodes")
      .select("progress_percent")
      .eq("id", wbsNode!.id)
      .single();
    
    expect(finalWbs?.progress_percent).toBe(100);
    
    // Cleanup
    await supabase.from("construction_tasks").delete().eq("id", task!.id);
    await supabase.from("wbs_nodes").delete().eq("id", wbsNode!.id);
  });
});

describe("Construction Module - Site Issues (Module 14.2)", () => {
  it("should create site issue with correct severity", async () => {
    const { data, error } = await supabase
      .from("site_issue_logs")
      .insert({
        project_id: TEST_PROJECT_ID,
        issue_number: `ISS-TEST-${Date.now()}`,
        title: "Test Site Issue",
        description: "Test issue description",
        severity: "high",
        status: "open",
        reported_by: TEST_USER_ID,
      })
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data?.severity).toBe("high");
    expect(data?.status).toBe("open");
    
    // Cleanup
    await supabase.from("site_issue_logs").delete().eq("id", data!.id);
  });
});

describe("Construction Module - Concrete Pour Records (Module 14.2)", () => {
  it("should create concrete pour record", async () => {
    const { data, error } = await supabase
      .from("concrete_pour_records")
      .insert({
        project_id: TEST_PROJECT_ID,
        pour_number: `POUR-TEST-${Date.now()}`,
        pour_date: new Date().toISOString().split("T")[0],
        concrete_grade: "C30",
        quantity_m3: 50.5,
        created_by: TEST_USER_ID,
      })
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data?.concrete_grade).toBe("C30");
    expect(data?.quantity_m3).toBe(50.5);
    
    // Cleanup
    await supabase.from("concrete_pour_records").delete().eq("id", data!.id);
  });
});
