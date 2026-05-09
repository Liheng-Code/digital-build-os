import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Bookmark, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fetchSavedViews, saveView, deleteView, type SavedView } from "@/services/wbsService";
import type { WbsFilters } from "./WbsFilterBar";

interface Props {
  projectId: string;
  currentFilters: WbsFilters;
  currentZoom: string;
  onLoadView: (filters: WbsFilters, zoom: string) => void;
}

export function SavedViewsMenu({ projectId, currentFilters, currentZoom, onLoadView }: Props) {
  const { user } = useAuth();
  const [views, setViews] = React.useState<SavedView[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [viewName, setViewName] = React.useState("");
  const [isShared, setIsShared] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const loadViews = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSavedViews(projectId);
      setViews(data);
    } catch (err) {
      toast.error("Failed to load saved views");
    }
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    if (projectId) loadViews();
  }, [projectId, loadViews]);

  const handleSave = async () => {
    if (!viewName.trim() || !user) return;
    setSaving(true);
    try {
      await saveView(projectId, user.id, viewName.trim(), currentFilters as unknown as Record<string, unknown>, currentZoom, isShared);
      toast.success("View saved");
      setSaveOpen(false);
      setViewName("");
      setIsShared(false);
      await loadViews();
    } catch (err) {
      toast.error("Failed to save view");
    }
    setSaving(false);
  };

  const handleDelete = async (viewId: string) => {
    try {
      await deleteView(viewId);
      toast.success("View deleted");
      await loadViews();
    } catch {
      toast.error("Failed to delete view");
    }
  };

  const handleLoad = (view: SavedView) => {
    onLoadView(view.filters as unknown as WbsFilters, view.zoom);
    toast.success(`Loaded: ${view.name}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg text-xs">
            <Bookmark className="h-3.5 w-3.5" />
            Views
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSaveOpen(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save current view
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : views.length === 0 ? (
            <DropdownMenuItem disabled className="text-muted-foreground text-xs">
              No saved views
            </DropdownMenuItem>
          ) : (
            views.map((view) => (
              <div key={view.id} className="flex items-center">
                <DropdownMenuItem
                  className="flex-1 cursor-pointer"
                  onClick={() => handleLoad(view)}
                >
                  <span className="truncate">{view.name}</span>
                  {view.is_shared && (
                    <span className="ml-2 text-[9px] text-muted-foreground uppercase tracking-wider">Shared</span>
                  )}
                </DropdownMenuItem>
                {view.user_id === user?.id && (
                  <button
                    className="p-1 mr-1 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(view.id)}
                    title="Delete view"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
            <DialogDescription>
              Name this view to reload it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="view-name">View name</Label>
              <Input
                id="view-name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="e.g. Critical tasks only"
                maxLength={100}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is-shared"
                checked={isShared}
                onCheckedChange={(v) => setIsShared(v === true)}
              />
              <Label htmlFor="is-shared" className="text-sm cursor-pointer">
                Share with project members
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !viewName.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
