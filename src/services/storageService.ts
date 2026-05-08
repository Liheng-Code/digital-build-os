import { supabase } from "@/integrations/supabase/client";
import { recordAuditEventSafe } from "./auditService";

export type StorageBucket = "project-documents" | "design-files" | "dsr-attachments";

export interface UploadOptions {
  bucket: StorageBucket;
  projectId: string;
  folder?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Generic service for handling Supabase Storage operations
 */
export const storageService = {
  /**
   * Upload a file to a specific bucket and folder
   */
  uploadFile: async (file: File, options: UploadOptions) => {
    const { bucket, projectId, folder } = options;
    
    // Generate a unique file path: projectId/folder/timestamp_filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const folderPath = folder ? `${folder}/` : "";
    const filePath = `${projectId}/${folderPath}${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    await recordAuditEventSafe({
      moduleCode: "CORE",
      entityType: "storage_object",
      entityId: data.path,
      actionType: "UPLOAD",
      actionLabel: `Uploaded file to ${bucket}`,
      projectId: projectId,
      newValues: { bucket, path: data.path, fileName: file.name, size: file.size },
      severity: "low"
    });

    return {
      path: data.path,
      fullUrl: filePath,
    };
  },

  /**
   * Get a signed URL for viewing or downloading a private file
   */
  getDownloadUrl: async (bucket: StorageBucket, path: string, expiresIn: number = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Trigger a browser download for a file
   */
  downloadFile: async (bucket: StorageBucket, path: string, fileName: string) => {
    const signedUrl = await storageService.getDownloadUrl(bucket, path);
    
    const a = document.createElement("a");
    a.href = signedUrl;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    return signedUrl;
  },

  /**
   * Delete a file from storage
   */
  deleteFile: async (bucket: StorageBucket, path: string, projectId?: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    if (projectId) {
      await recordAuditEventSafe({
        moduleCode: "CORE",
        entityType: "storage_object",
        entityId: path,
        actionType: "DELETE",
        actionLabel: `Deleted file from ${bucket}`,
        projectId: projectId,
        severity: "medium"
      });
    }
  }
};
