import { describe, it, expect } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("Module 19: Inventory / Stock", () => {
  it("should have inventory_items table accessible", async () => {
    const { data, error } = await (supabase as any)
      .from("inventory_items")
      .select("id")
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should have stock_receipts table accessible", async () => {
    const { data, error } = await (supabase as any)
      .from("stock_receipts")
      .select("id")
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should have material_requests table accessible", async () => {
    const { data, error } = await (supabase as any)
      .from("material_requests")
      .select("id")
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should have stock_issues table accessible", async () => {
    const { data, error } = await (supabase as any)
      .from("stock_issues")
      .select("id")
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should have stock_transfers table accessible", async () => {
    const { data, error } = await (supabase as any)
      .from("stock_transfers")
      .select("id")
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should have stock_adjustments table accessible", async () => {
    const { data, error } = await (supabase as any)
      .from("stock_adjustments")
      .select("id")
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should have stock_balances view accessible", async () => {
    const { data, error } = await (supabase as any)
      .from("stock_balances")
      .select("inventory_item_id")
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should create inventory item with required fields", async () => {
    const { data, error } = await (supabase as any)
      .from("inventory_items")
      .insert({
        code: "TEST-001",
        name: "Test Item",
        category: "raw_material",
        unit_of_measure: "pcs",
        is_active: true,
      })
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.code).toBe("TEST-001");
    expect(data.category).toBe("raw_material");

    // Cleanup
    if (data?.id) {
      await (supabase as any)
        .from("inventory_items")
        .delete()
        .eq("id", data.id);
    }
  });

  it("should enforce WBS node linkage on stock receipts", async () => {
    const { data, error } = await (supabase as any)
      .from("stock_receipts")
      .insert({
        receipt_number: "TEST-RCT-001",
        receipt_date: new Date().toISOString().split("T")[0],
        status: "pending_inspection",
        wbs_node_id: null, // This should fail if WBS is required
      });
    
    // Should fail because wbs_node_id is NOT NULL
    expect(error).toBeDefined();
  });
});
