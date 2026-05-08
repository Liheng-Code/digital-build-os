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
import { Loader2, Upload, FileText, Download, Plus, History, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useWbsTree } from "@/hooks/useWbsTree";
import { flattenTree, buildWbsTree } from "@/lib/wbsMeta";
import { DOCUMENT_DISCIPLINES } from "@/lib/documentMeta";
import { fetchDocumentTypes } from "@/services/adminConfigService";

interface DocRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  discipline: string | null;
  document_number: string | null;
  wbs_node_id: string | null;
  current_version: number;
  created_at: string;
  updated_at: string;
}

interface VersionRow {
  id: string;
  version: number;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  change_note: string | null;
  uploaded_at: string;
}

const CATEGORIES = ["general", "drawings", "permits", "contracts", "safety", "qaqc", "reports"];

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
  const [category, setCategory] = useState("general");
  const [discipline, setDiscipline] = useState("GEN");
  const [wbsNodeId, setWbsNodeId] = useState<string | null>(null);
  const [docNumber, setDocNumber] = useState("");
  const [documentTypes, setDocumentTypes] = useState<{ code: string; name: string }[]>(
    DOCUMENT_DISCIPLINES.map((discipline) => ({ code: discipline.value, name: discipline.label })),
  );
  const [file, setFile] = useState<File | null>(null);

  const { nodes: wbsNodes } = useWbsTree(activeProject?.id);
  const flatWbs = flattenTree(buildWbsTree(wbsNodes));

  // versions sheet
  const [activeDoc, setActiveDoc] = useState<DocRow | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState("");
  const [uploadingVersion, setUploadingVersion] = useState(false);

  const loadDocs = async () => {
    if (!activeProject) {
      setDocs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", activeProject.id)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setDocs((data ?? []) as DocRow[]);
    setLoading(false);
  };

  const loadDocumentTypes = async () => {
    try {
      const types = await fetchDocumentTypes();
      if (types.length > 0) {
        setDocumentTypes(types.map((t) => ({ code: t.code, name: t.name })));
      }
    } catch {
      // Keep seed fallback values if the admin config table is unavailable.
    }
  };

  useEffect(() => {
    loadDocs();
    loadDocumentTypes();
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
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;

      const { data: doc, error: docErr } = await supabase
        .from("documents")
        .insert({
          project_id: activeProject.id,
          title: title.trim(),
          description: description.trim() || null,
          category,
          discipline,
          wbs_node_id: wbsNodeId,
          document_number: docNumber.trim() || null,
          current_version: 1,
          created_by: uid,
        })
        .select()
        .single();
      if (docErr) throw docErr;

      const path = `${activeProject.id}/${doc.id}/v1-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("project-documents")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { error: verErr } = await supabase.from("document_versions").insert({
        document_id: doc.id,
        version: 1,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        uploaded_by: uid,
      });
      if (verErr) throw verErr;

      toast.success("Document uploaded");
      setOpenCreate(false);
      setTitle("");
      setDescription("");
      setCategory("general");
      setDiscipline("GEN");
      setWbsNodeId(null);
      setDocNumber("");
      setFile(null);
      await loadDocs();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Upload failed"));
    } finally {
      setCreating(false);
    }
  };

  const handleNewVersion = async () => {
    if (!activeDoc || !newVersionFile) return;
    setUploadingVersion(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const nextVersion = activeDoc.current_version + 1;
      const path = `${activeProject?.id}/${activeDoc.id}/v${nextVersion}-${Date.now()}-${newVersionFile.name}`;

      const { error: upErr } = await supabase.storage
        .from("project-documents")
        .upload(path, newVersionFile);
      if (upErr) throw upErr;

      const { error: verErr } = await supabase.from("document_versions").insert({
        document_id: activeDoc.id,
        version: nextVersion,
        storage_path: path,
        file_name: newVersionFile.name,
        mime_type: newVersionFile.type || null,
        size_bytes: newVersionFile.size,
        change_note: versionNote.trim() || null,
        uploaded_by: uid,
      });
      if (verErr) throw verErr;

      const { error: docErr } = await supabase
        .from("documents")
        .update({ current_version: nextVersion })
        .eq("id", activeDoc.id);
      if (docErr) throw docErr;

      toast.success(`Version ${nextVersion} uploaded`);
      setNewVersionFile(null);
      setVersionNote("");
      const updated = { ...activeDoc, current_version: nextVersion };
      setActiveDoc(updated);
      await Promise.all([loadDocs(), loadVersions(activeDoc.id)]);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Version upload failed"));
    } finally {
      setUploadingVersion(false);
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
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Discipline</Label>
                    <Select value={discipline} onValueChange={setDiscipline}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((d) => (
                          <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Doc Number</Label>
                    <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="e.g. A-101" />
                  </div>
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
                  <TableHead>Category</TableHead>
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
                        <Badge variant="secondary" className="capitalize w-fit">
                          {d.category}
                        </Badge>
                        {d.discipline && (
                          <span className="text-[10px] font-bold text-muted-foreground">{d.discipline}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>v{d.current_version}</span>
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
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{activeDoc?.title}</SheetTitle>
            <SheetDescription>Version history</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-4">
            {canUpload && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Upload new version</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Input
                    type="file"
                    onChange={(e) => setNewVersionFile(e.target.files?.[0] ?? null)}
                  />
                  <Textarea
                    placeholder="What changed?"
                    rows={2}
                    value={versionNote}
                    onChange={(e) => setVersionNote(e.target.value)}
                  />
                  <Button
                    onClick={handleNewVersion}
                    disabled={!newVersionFile || uploadingVersion}
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge>v{v.version}</Badge>
                        <span className="font-medium text-sm truncate">{v.file_name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(v.uploaded_at).toLocaleString()} · {formatBytes(v.size_bytes)}
                      </div>
                      {v.change_note && (
                        <div className="text-xs italic mt-1">"{v.change_note}"</div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(v.storage_path, v.file_name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
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
