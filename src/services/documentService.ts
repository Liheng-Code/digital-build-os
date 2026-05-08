import { supabase } from "@/integrations/supabase/client";
import { recordAuditEventSafe } from "@/services/auditService";
import { openModuleApproval, closeModuleApproval } from "@/services/moduleApprovalService";
import type { Json } from "@/integrations/supabase/types";

export interface Document {
  id: string;
  project_id: string;
  wbs_node_id: string | null;
  document_type_id: string | null;
  discipline_id: string | null;
  document_number: string | null;
  title: string;
  description: string | null;
  status: string;
  revision: string | null;
  created_at: string;
  updated_at: string;
  latest_version?: DocumentVersion;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  revision_code?: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: string;
  uploaded_by: string | null;
  uploaded_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
}

export async function fetchDocuments(projectId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select(`
      *,
      document_types (id, name, code),
      disciplines (id, name, code),
      wbs_nodes (id, wbs_code, wbs_name)
    `)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createDocument(input: {
  project_id: string;
  title: string;
  description?: string;
  wbs_node_id?: string;
  document_type_id?: string;
  discipline_id?: string;
  document_number?: string;
}) {
  const { data, error } = await supabase
    .from("documents")
    .insert({
      ...input,
      status: "draft",
      revision: "00"
    })
    .select()
    .single();

  if (error) throw error;

  await recordAuditEventSafe({
    moduleCode: "DOC",
    entityType: "document",
    entityId: data.id,
    actionType: "CREATE",
    actionLabel: "Created Document",
    projectId: input.project_id,
    newValues: data as unknown as Json,
    severity: "medium"
  });

  return data;
}

export async function uploadDocumentVersion(
  documentId: string,
  projectId: string,
  file: File,
  revisionCode: string,
  changeNote?: string
) {
  // 1. Get current version count to increment
  const { data: doc } = await supabase.from("documents").select("current_version").eq("id", documentId).single();
  const nextVersion = (doc?.current_version || 0) + 1;

  // 2. Upload to storage
  const fileExt = file.name.split(".").pop();
  const filePath = `${projectId}/${documentId}/${nextVersion}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("project-documents").upload(filePath, file);
  if (uploadError) throw uploadError;

  // 3. Create version record
  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .insert({
      document_id: documentId,
      version: nextVersion,
      revision_code: revisionCode,
      storage_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      change_note: changeNote,
      status: "draft"
    })
    .select()
    .single();

  if (versionError) throw versionError;

  // 4. Update document current version
  await supabase
    .from("documents")
    .update({ 
      current_version: nextVersion,
      revision: revisionCode 
    })
    .eq("id", documentId);

  await recordAuditEventSafe({
    moduleCode: "DOC",
    entityType: "document_version",
    entityId: version.id,
    actionType: "UPLOAD",
    actionLabel: "Uploaded New Revision",
    projectId: projectId,
    newValues: version as unknown as Json,
    severity: "medium"
  });

  return version;
}

export async function submitDocumentForApproval(versionId: string, projectId: string, title: string, approverRoles: string[]) {
  // Update version status
  const { error: updateError } = await supabase
    .from("document_versions")
    .update({ status: "submitted" })
    .eq("id", versionId);
  
  if (updateError) throw updateError;

  // Open approval workflow
  await openModuleApproval({
    projectId,
    moduleCode: "DOC",
    entityType: "document_version",
    entityId: versionId,
    title: `Document Approval: ${title}`,
    approverRoles: approverRoles
  });

  return { success: true };
}

export async function handleDocumentApprovalDecision(
  versionId: string,
  documentId: string,
  decision: "approved" | "rejected",
  comment?: string
) {
  // 1. Close the module approval
  await closeModuleApproval({
    moduleCode: "DOC",
    entityType: "document_version",
    entityId: versionId,
    decision,
    comment
  });

  // 2. Update version status based on decision
  const status = decision === "approved" ? "approved" : "rejected";
  const { error: vError } = await supabase
    .from("document_versions")
    .update({ 
      status,
      approved_at: decision === "approved" ? new Date().toISOString() : null,
      approved_by: decision === "approved" ? (await supabase.auth.getUser()).data.user?.id : null
    })
    .eq("id", versionId);
  
  if (vError) throw vError;

  // 3. Update main document status if approved
  if (decision === "approved") {
    await supabase.from("documents").update({ status: "approved" }).eq("id", documentId);
    
    // Also, if there were previous approved versions, they might need to be superseded.
    // This logic can be more complex depending on business rules.
    await supabase
      .from("document_versions")
      .update({ status: "superseded" })
      .eq("document_id", documentId)
      .eq("status", "approved")
      .neq("id", versionId);
  } else {
    await supabase.from("documents").update({ status: "rejected" }).eq("id", documentId);
  }

  return { success: true };
}
