import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStakeholders } from "@/hooks/useStakeholders";
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
import { Loader2, Mail, Plus, Send, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Transmittal, TransmittalItem } from "@/lib/documentMeta";
import { Checkbox } from "@/components/ui/checkbox";

export default function Transmittals() {
  const { activeProject } = useProjects();
  const { user } = useAuth();
  const { stakeholdersQuery } = useStakeholders();

  const [transmittals, setTransmittals] = React.useState<Transmittal[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Create state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [recipientId, setRecipientId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  
  // Doc selection
  const [availableDocs, setAvailableDocs] = React.useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = React.useState<string[]>([]);

  const loadTransmittals = React.useCallback(async () => {
    if (!activeProject) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("transmittals")
      .select("*")
      .eq("project_id", activeProject.id)
      .order("sent_at", { ascending: false });
    
    if (error) toast.error(error.message);
    else setTransmittals((data ?? []) as Transmittal[]);
    setLoading(false);
  }, [activeProject]);

  const loadDocs = React.useCallback(async () => {
    if (!activeProject) return;
    const { data, error } = await supabase
      .from("documents")
      .select("id, title, document_number, current_version")
      .eq("project_id", activeProject.id);
    if (!error) setAvailableDocs(data ?? []);
  }, [activeProject]);

  React.useEffect(() => {
    loadTransmittals();
    loadDocs();
  }, [loadTransmittals, loadDocs]);

  const handleCreate = async () => {
    if (!activeProject || !recipientId || !subject.trim() || selectedDocs.length === 0) {
      toast.error("Subject, recipient, and at least one document are required");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Generate transmittal number (e.g., T-001)
      const tNum = `T-${(transmittals.length + 1).toString().padStart(3, "0")}`;

      // 2. Create transmittal
      const { data: trans, error: tErr } = await supabase
        .from("transmittals")
        .insert({
          project_id: activeProject.id,
          transmittal_number: tNum,
          subject: subject.trim(),
          sender_id: user?.id,
          recipient_id: recipientId,
          due_at: dueAt || null,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      
      if (tErr) throw tErr;

      // 3. Add items
      const items = selectedDocs.map(docId => {
        const doc = availableDocs.find(d => d.id === docId);
        return {
          transmittal_id: trans.id,
          document_id: docId,
          version_id: doc.id, // In a real system, we'd pick a specific version id, but for now we use the doc's current state
          purpose: 'for_information'
        };
      });

      // Note: We need version_id from document_versions. For simplicity here, 
      // we'll fetch the latest version id for each selected doc.
      const { data: versions } = await supabase
        .from("document_versions")
        .select("id, document_id")
        .in("document_id", selectedDocs)
        .order("version", { ascending: false });

      const finalItems = selectedDocs.map(docId => {
        const v = versions?.find(v => v.document_id === docId);
        return {
          transmittal_id: trans.id,
          document_id: docId,
          version_id: v?.id,
          purpose: 'for_review'
        };
      });

      const { error: itemsErr } = await supabase.from("transmittal_items").insert(finalItems);
      if (itemsErr) throw itemsErr;

      toast.success(`Transmittal ${tNum} sent`);
      setIsCreateOpen(false);
      resetForm();
      loadTransmittals();
    } catch (e: any) {
      toast.error(e.message || "Failed to create transmittal");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubject("");
    setRecipientId("");
    setNotes("");
    setDueAt("");
    setSelectedDocs([]);
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Transmittals</h1>
        <p className="text-muted-foreground">Select a project to view transmittals.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transmittals</h1>
          <p className="text-sm text-muted-foreground">
            {activeProject.code} · Formal Document Distribution
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              New Transmittal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Document Transmittal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Recipient (Stakeholder)</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                    <SelectContent>
                      {stakeholdersQuery.data?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.organization_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Response Due Date</Label>
                  <Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. For Construction Drawings - L1" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Documents to Include</Label>
                <Card className="max-h-48 overflow-y-auto border-muted">
                  <CardContent className="p-0">
                    {availableDocs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 border-b last:border-0">
                        <Checkbox 
                          id={`doc-${doc.id}`}
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedDocs([...selectedDocs, doc.id]);
                            else setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                          }}
                        />
                        <label htmlFor={`doc-${doc.id}`} className="flex-1 text-sm cursor-pointer min-w-0">
                          <div className="font-medium truncate">{doc.title}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {doc.document_number || "No number"} · v{doc.current_version}
                          </div>
                        </label>
                      </div>
                    ))}
                    {availableDocs.length === 0 && (
                      <div className="p-4 text-center text-xs text-muted-foreground">No documents available to send</div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Internal Notes / Message</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Send Transmittal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Transmittal Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transmittals.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No transmittals found</h3>
              <p>Formal document distribution history will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transmittals.map(t => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell className="font-mono font-bold text-primary">{t.transmittal_number}</TableCell>
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell>
                      {stakeholdersQuery.data?.find(s => s.id === t.recipient_id)?.organization_name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(t.sent_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.due_at ? (
                        <span className={new Date(t.due_at) < new Date() ? "text-destructive font-bold" : ""}>
                          {new Date(t.due_at).toLocaleDateString()}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
