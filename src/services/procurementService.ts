import { supabase } from "@/integrations/supabase/client";
import type {
  PurchaseRequisition,
  PrItem,
  MaterialCatalogItem,
  RdsMaterialTakeoff,
  PurchaseOrder,
  Supplier,
} from "@/lib/procurementMeta";
import { openModuleApproval, closeModuleApproval } from "@/services/moduleApprovalService";
import { recordAuditEventSafe } from "@/services/auditService";

// ─── Purchase Requisitions ───────────────────────────────────

export const fetchPRs = async (projectId: string): Promise<PurchaseRequisition[]> => {
  const { data, error } = await supabase
    .from("purchase_requisitions")
    .select("*, pr_items(count)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchPRById = async (prId: string): Promise<PurchaseRequisition> => {
  const { data, error } = await supabase
    .from("purchase_requisitions")
    .select("*, pr_items(*)")
    .eq("id", prId)
    .single();

  if (error) throw error;
  return data;
};

export const createPR = async (pr: {
  project_id: string;
  subject: string;
  description?: string;
  required_date?: string;
  total_estimate?: number;
  status?: string;
}): Promise<PurchaseRequisition> => {
  const { count } = await supabase
    .from("purchase_requisitions")
    .select("*", { count: "exact", head: true })
    .eq("project_id", pr.project_id);

  const prNum = `PR-${((count || 0) + 1).toString().padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("purchase_requisitions")
    .insert({
      project_id: pr.project_id,
      pr_number: prNum,
      subject: pr.subject,
      description: pr.description || null,
      required_date: pr.required_date || null,
      total_estimate: pr.total_estimate || 0,
      status: pr.status || "draft",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createPRItems = async (items: {
  pr_id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
}[]): Promise<void> => {
  const { error } = await supabase.from("pr_items").insert(items);
  if (error) throw error;
};

export const updatePRStatus = async (id: string, status: string): Promise<void> => {
  const before = await fetchPRById(id);
  const { error } = await supabase
    .from("purchase_requisitions")
    .update({ status })
    .eq("id", id);
  if (error) throw error;

  if (status === "submitted") {
    const { data: userData } = await supabase.auth.getUser();
    await openModuleApproval({
      projectId: before.project_id,
      moduleCode: "PROC",
      entityType: "purchase_requisition",
      entityId: id,
      title: before.pr_number ? `${before.pr_number} - ${before.subject}` : before.subject,
      requestedBy: userData.user?.id ?? before.created_by,
      approverRoles: ["project_manager", "supervisor", "admin"],
      metadata: {
        pr_number: before.pr_number,
        subject: before.subject,
        total_estimate: before.total_estimate
      }
    });
  } else if (status === "approved" || status === "rejected") {
    const { data: userData } = await supabase.auth.getUser();
    await closeModuleApproval({
      moduleCode: "PROC",
      entityType: "purchase_requisition",
      entityId: id,
      actorId: userData.user?.id ?? null,
      decision: status
    });
  } else {
    await recordAuditEventSafe({
      moduleCode: "PROC",
      entityType: "purchase_requisition",
      entityId: id,
      actionType: "STATUS_CHANGE",
      actionLabel: "Purchase Requisition Status Changed",
      projectId: before.project_id,
      oldValues: { status: before.status },
      newValues: { status },
      changedFields: ["status"],
      statusFrom: before.status,
      statusTo: status,
      severity: "medium"
    });
  }
};

// ─── Material Catalog ────────────────────────────────────────

export const fetchMaterialCatalog = async (): Promise<MaterialCatalogItem[]> => {
  const { data, error } = await supabase
    .from("material_catalog")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createCatalogItem = async (item: {
  code: string;
  name: string;
  category?: string;
  unit?: string;
  default_price?: number;
}): Promise<MaterialCatalogItem> => {
  const { data, error } = await supabase
    .from("material_catalog")
    .insert({
      code: item.code,
      name: item.name,
      category: item.category || "Finishing",
      unit: item.unit || "sqm",
      default_price: item.default_price || 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── MTO (Material Take-Off) ─────────────────────────────────

export const fetchRdsData = async (projectId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from("architecture_room_data")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw error;
  return data || [];
};

export const createMtoTakeoff = async (takeoff: {
  project_id: string;
  wbs_node_id: string;
  material_id: string;
  quantity?: number;
}): Promise<RdsMaterialTakeoff> => {
  const { data, error } = await supabase
    .from("rds_material_takeoffs")
    .insert({
      project_id: takeoff.project_id,
      wbs_node_id: takeoff.wbs_node_id,
      material_id: takeoff.material_id,
      quantity: takeoff.quantity || 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── Suppliers (shared) ──────────────────────────────────────

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, contact_person, email, phone, address, status")
    .eq("status", "active")
    .order("name");

  if (error) throw error;
  return data || [];
};

// ─── Dashboard KPIs ──────────────────────────────────────────

export const fetchProcurementDashboard = async (projectId: string) => {
  const [prs, catalog] = await Promise.all([
    fetchPRs(projectId),
    fetchMaterialCatalog(),
  ]);

  return {
    pendingPRs: prs.filter(p => p.status === "submitted").length,
    totalApproved: prs.filter(p => p.status === "approved").length,
    catalogItems: catalog.length,
    budgetUtilized: prs
      .filter(p => p.status === "approved")
      .reduce((acc, p) => acc + (p.total_estimate || 0), 0),
    recentPRs: prs.slice(0, 5),
  };
};
