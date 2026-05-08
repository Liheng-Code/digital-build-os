import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Upload, FileText, Download, Plus, History, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { useWbsTree } from "@/hooks/useWbsTree";
import { flattenTree, buildWbsTree } from "@/lib/wbsMeta";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documentMeta";
import { fetchDocumentTypes, fetchDisciplines } from "@/services/adminConfigService";
import { recordAuditEventSafe } from "@/services/auditService";
import * as docService from "@/services/documentService";

interface DocRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  discipline: string | null;
  document_number: string | null;
  wbs_node_id: string | null;
  document_type_id: string | null;
  discipline_id: string | null;
  current_version: number;
  status: string;
  revision: string | null;
  created_at: string;
  updated_at: string;
  document_types?: { name: string; code: string };
  disciplines?: { name: string; code: string };
}

interface VersionRow {
  id: string;
  version: number;
  revision_code: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  change_note: string | null;
  status: string;
  uploaded_at: string;
}

export default function Documents() {
  const { activeProject } = useProjects();
  const { hasRole } = useAuth();
  const canUpload =
    hasRole("admin") || hasRole("project_manager") || hasRole("engineer") || hasRole("supervisor");

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  // create dialog
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState<string | null>(null);
  const [disciplineId, setDisciplineId] = useState<string | null>(null);
  const [wbsNodeId, setWbsNodeId] = useState<string | null>(null);
  const [docNumber, setDocNumber] = useState("");
  const [documentTypes, setDocumentTypes] = useState<{ id: string; code: string; name: string }[]>([]);
  const [disciplines, setDisciplines] = useState<{ id: string; code: string; name: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const { nodes: wbsNodes } = useWbsTree(activeProject?.id);
  const flatWbs = flattenTree(buildWbsTree(wbsNodes));

  // versions sheet
  const [activeDoc, setActiveDoc] = useState<DocRow | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newRevisionCode, setNewRevisionCode] = useState("");
  const [versionNote, setVersionNote] = useState("");
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [submittingVersionId, setSubmittingVersionId] = useState<string | null>(null);

  const loadDocs = async () => {
    if (!activeProject) {
      setDocs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await docService.fetchDocuments(activeProject.id);
      setDocs(data as unknown as DocRow[]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConfigData = async () => {
    try {
      const [types, disc] = await Promise.all([
        fetchDocumentTypes(),
        fetchDisciplines()
      ]);
      setDocumentTypes(types.map(t => ({ id: t.id, code: t.code, name: t.name })));
      setDisciplines(disc.map(d => ({ id: d.id, code: d.code, name: d.name })));
    } catch (e) {
      console.error("Error loading config data", e);
    }
  };

  useEffect(() => {
    loadDocs();
    loadConfigData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  const loadVersions = async (docId: string) => {
    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", docId)
      .order("version", { ascending: false });
    if (error) toast.error(error.message);
    setVersions((data ?? []) as VersionRow[]);
  };

  const handleCreate = async () => {
    if (!activeProject || !file || !title.trim()) {
      toast.error("Title and file required");
      return;
    }
    setCreating(true);
    try {
      const doc = await docService.createDocument({
        project_id: activeProject.id,
        title: title.trim(),
        description: description.trim() || undefined,
        document_type_id: documentTypeId || undefined,
        discipline_id: disciplineId || undefined,
        wbs_node_id: wbsNodeId || undefined,
        document_number: docNumber.trim() || undefined,
      });

      await docService.uploadDocumentVersion(
        doc.id,
        activeProject.id,
        file,
        "01",
        "Initial upload"
      );

      toast.success("Document created and uploaded");
      setOpenCreate(false);
      setTitle("");
      setDescription("");
      setDocumentTypeId(null);
      setDisciplineId(null);
      setWbsNodeId(null);
      setDocNumber("");
      setFile(null);
      await loadDocs();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Creation failed"));
    } finally {
      setCreating(false);
    }
  };

  const handleNewVersion = async () => {
    if (!activeDoc || !newVersionFile || !newRevisionCode.trim()) {
      toast.error("File and Revision Code required");
      return;
    }
    setUploadingVersion(true);
    try {
      await docService.uploadDocumentVersion(
        activeDoc.id,
        activeProject!.id,
        newVersionFile,
        newRevisionCode.trim(),
        versionNote.trim() || undefined
      );

      toast.success(`New version uploaded`);
      setNewVersionFile(null);
      setNewRevisionCode("");
      setVersionNote("");
      await Promise.all([loadDocs(), loadVersions(activeDoc.id)]);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Version upload failed"));
    } finally {
      setUploadingVersion(false);
    }
  };

  const handleSubmitApproval = async (version: VersionRow) => {
    if (!activeProject || !activeDoc) return;
    setSubmittingVersionId(version.id);
    try {
      // For now, we hardcode some roles. In a real system, this would be configurable.
      const approverRoles = ["project_manager", "admin"];
      await docService.submitDocumentForApproval(
        version.id,
        activeProject.id,
        `${activeDoc.title} (v${version.version})`,
        approverRoles
      );
      toast.success("Submitted for approval");
      await loadVersions(activeDoc.id);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Submission failed"));
    } finally {
      setSubmittingVersionId(null);
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("project-documents")
      .createSignedUrl(path, 60);
    if (error || !data) {
      toast.error(error?.message || "Could not get file");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = fileName;
    a.target = "_blank";
    a.click();
    await recordAuditEventSafe({
      moduleCode: "DOC",
      entityType: "document_version",
      entityId: path,
      actionType: "DOWNLOAD",
      actionLabel: "Document Downloaded",
      projectId: activeProject?.id ?? null,
      newValues: { storage_path: path, file_name: fileName },
      severity: "high"
    });
  };

  const formatBytes = (n: number | null) => {
    if (!n) return "—";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Select a project to view its documents.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            {activeProject.code} · {activeProject.name}
          </p>
        </div>
        {canUpload && (
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Upload document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload new document</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={documentTypeId ?? "none"} onValueChange={(v) => setDocumentTypeId(v === "none" ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Discipline</Label>
                    <Select value={disciplineId ?? "none"} onValueChange={(v) => setDisciplineId(v === "none" ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Select discipline" /></SelectTrigger>
                      <SelectContent>
                        {disciplines.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Doc Number</Label>
                  <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="e.g. A-101" />
                </div>
                <div>
                  <Label>WBS Location</Label>
                  <Select value={wbsNodeId ?? "none"} onValueChange={(v) => setWbsNodeId(v === "none" ? null : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Project Level (No WBS)</SelectItem>
                      {flatWbs.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {new Array(n.depth).fill("  ").join("")} {n.name} ({n.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>File</Label>
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenCreate(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              No documents yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {d.title}
                      {d.description && (
                        <div className="text-xs text-muted-foreground">{d.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="w-fit">
                          {d.document_types?.name || d.category}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {d.disciplines?.name || d.discipline}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={d.status === 'approved' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {DOCUMENT_STATUS_LABELS[d.status as keyof typeof DOCUMENT_STATUS_LABELS] || d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>v{d.current_version} ({d.revision})</span>
                        {d.document_number && <span className="text-xs font-mono text-muted-foreground">{d.document_number}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{new Date(d.updated_at).toLocaleDateString()}</span>
                        {d.wbs_node_id && (
                          <div className="flex items-center gap-1 text-[10px] text-primary mt-1">
                            <MapPin className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[120px]">
                              {wbsNodes.find(n => n.id === d.wbs_node_id)?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveDoc(d);
                          loadVersions(d.id);
                        }}
                      >
                        <History className="h-4 w-4 mr-1" />
                        Versions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!activeDoc} onOpenChange={(o) => !o && setActiveDoc(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{activeDoc?.title}</SheetTitle>
            <SheetDescription>Version history & approvals</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-4">
            {canUpload && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Upload new version</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px]">Revision Code</Label>
                      <Input 
                        placeholder="e.g. 02, B" 
                        value={newRevisionCode} 
                        onChange={e => setNewRevisionCode(e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px]">File</Label>
                      <Input
                        type="file"
                        onChange={(e) => setNewVersionFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px]">What changed?</Label>
                    <Textarea
                      placeholder="Summary of changes..."
                      rows={2}
                      value={versionNote}
                      onChange={(e) => setVersionNote(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleNewVersion}
                    disabled={!newVersionFile || !newRevisionCode || uploadingVersion}
                    size="sm"
                  >
                    {uploadingVersion ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    Upload version
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-2">
              {versions.map((v) => (
                <Card key={v.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">v{v.version}</Badge>
                        <Badge variant="secondary">Rev {v.revision_code || '—'}</Badge>
                        <span className="font-medium text-sm truncate">{v.file_name}</span>
                        <Badge 
                          variant={v.status === 'approved' ? 'default' : v.status === 'rejected' ? 'destructive' : 'secondary'}
                          className="text-[10px] h-5"
                        >
                          {DOCUMENT_STATUS_LABELS[v.status as keyof typeof DOCUMENT_STATUS_LABELS] || v.status}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(v.uploaded_at).toLocaleString()} · {formatBytes(v.size_bytes)}
                      </div>
                      {v.change_note && (
                        <div className="text-xs italic mt-1 text-muted-foreground">"{v.change_note}"</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {v.status === 'draft' && canUpload && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleSubmitApproval(v)}
                          disabled={submittingVersionId === v.id}
                        >
                          {submittingVersionId === v.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5 mr-1" />
                          )}
                          Submit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(v.storage_path, v.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
