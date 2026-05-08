import { describe, it, expect } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { fetchDocumentTypes, fetchDisciplines } from "@/services/adminConfigService";

interface QueryResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

interface TestQuery<T> extends PromiseLike<QueryResult<T>> {
  limit(count: number): TestQuery<T>;
  order(column: string): TestQuery<T>;
}

interface TestTable<T> {
  select(columns: string): TestQuery<T>;
}

interface TestClient {
  from<T>(table: string): TestTable<T>;
}

const testClient = supabase as unknown as TestClient;

const TABLES = [
  "disciplines",
  "project_types",
  "wbs_node_types",
  "document_types",
  "cost_codes",
  "material_codes",
  "equipment_types",
  "public_holidays",
  "notification_rules",
  "approval_templates",
  "checklist_templates",
  "labor_rates",
] as const;

describe("Module 18: Admin Configuration", () => {
  describe("Database tables", () => {
    for (const table of TABLES) {
      it(`should have ${table} table accessible`, async () => {
        const { data, error } = await testClient
          .from<{ id: string }>(table)
          .select("id")
          .limit(1);
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });
    }
  });

  describe("Seed data", () => {
    it("should have seed disciplines", async () => {
      const { data, error } = await testClient
        .from<{ code: string }>("disciplines")
        .select("code")
        .order("sort_order");
      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(5);
    });

    it("should have seed document_types matching DOCUMENT_DISCIPLINES", async () => {
      const { data, error } = await testClient
        .from<{ code: string; name: string }>("document_types")
        .select("code, name")
        .order("sort_order");
      expect(error).toBeNull();
      expect(data!.length).toBe(11);
      expect(data!.map((r) => r.code)).toEqual([
        "GEN", "ARC", "STR", "MEP", "PLB", "ELC", "CIV", "QAQC", "HSE", "PRO", "CON",
      ]);
    });

    it("should have seed project_types", async () => {
      const { data, error } = await testClient
        .from<{ code: string }>("project_types")
        .select("code")
        .order("sort_order");
      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(3);
    });

    it("should have seed wbs_node_types", async () => {
      const { data, error } = await testClient
        .from<{ code: string }>("wbs_node_types")
        .select("code")
        .order("sort_order");
      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("Service functions", () => {
    it("fetchDocumentTypes should return active types sorted by sort_order", async () => {
      const types = await fetchDocumentTypes();
      expect(types.length).toBeGreaterThanOrEqual(11);
      expect(types[0].code).toBe("GEN");
    });

    it("fetchDisciplines should return active disciplines sorted by sort_order", async () => {
      const disciplines = await fetchDisciplines();
      expect(disciplines.length).toBeGreaterThanOrEqual(5);
      expect(disciplines[0].code).toBe("architecture");
    });
  });
});
