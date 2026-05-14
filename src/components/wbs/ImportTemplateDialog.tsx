import * as React from "react";
import { templateService, WbsTemplate } from "@/services/templateService";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, FolderTree, Info } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  targetParentId: string | null;
  onImported: () => void;
}

export function ImportTemplateDialog({ open, onOpenChange, projectId, targetParentId, onImported }: Props) {
  const [templates, setTemplates] = React.useState<WbsTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState("");
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [importing, setImporting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await templateService.listTemplates();
      setTemplates(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { if (open) load(); }, [open, load]);

  const handleImport = async () => {
    if (!selectedId) {
      toast.error("Select a template first");
      return;
    }
    setImporting(true);
    try {
      await templateService.instantiateTemplate(selectedId, projectId, targetParentId, startDate);
      toast.success("Template imported successfully");
      onImported();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setImporting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Import WBS Template
          </DialogTitle>
          <DialogDescription>
            Instantly populate your WBS structure with standard industry nodes and activities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Select Template</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading templates..." : "Choose a structure..."} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} ({t.industry_type || 'General'})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-sm space-y-1">
                <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <p className="text-muted-foreground">{selectedTemplate.description || "No description provided for this template."}</p>
                </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Planned Start Date for Activities</Label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
            <p className="text-[10px] text-muted-foreground italic">Template activity durations will be calculated relative to this date.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={importing || !selectedId}>
            {importing ? "Importing..." : "Start Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
