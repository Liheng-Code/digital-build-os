import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useWbsTree } from "@/hooks/useWbsTree";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  DoorOpen, 
  Layout, 
  Zap, 
  Info, 
  Save, 
  Loader2, 
  Plus, 
  Trash2,
  Maximize2,
  Palette,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Search,
  Download,
  X
} from "lucide-react";
import { toast } from "sonner";
import { RoomData, DoorEntry, WindowEntry, MaterialBoard, COMMON_FINISHES } from "@/lib/architectureMeta";
import { WbsNode } from "@/lib/wbsMeta";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storageService } from "@/services/storageService";

export default function Architecture() {
  const { activeProject } = useProjects();
  const { nodes: wbsNodes, loading: wbsLoading } = useWbsTree(activeProject?.id);
  
  const [selectedRoom, setSelectedRoom] = React.useState<WbsNode | null>(null);
  const [roomData, setRoomData] = React.useState<RoomData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [sidebarTab, setSidebarTab] = React.useState<'rooms' | 'drawings' | 'boards'>('boards');

  // Filter only rooms
  const rooms = React.useMemo(() => 
    wbsNodes.filter(n => n.node_type === 'room'), 
    [wbsNodes]
  );

  const loadRoomData = async (nodeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("architecture_room_data")
        .select("*")
        .eq("wbs_node_id", nodeId)
        .maybeSingle();
      
      if (error) throw error;
      setRoomData(data as RoomData || {
        wbs_node_id: nodeId,
        floor_finish: "",
        wall_finish: "",
        ceiling_finish: "",
        skirting_finish: "",
        cornice_finish: "",
        sanitary_fixtures: "",
        ironmongery_set: "",
        acoustic_rating: "",
        mep_requirements: {},
        remarks: ""
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (selectedRoom) loadRoomData(selectedRoom.id);
  }, [selectedRoom]);

  const handleSave = async () => {
    if (!selectedRoom || !roomData) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("architecture_room_data")
        .upsert({
          ...roomData,
          wbs_node_id: selectedRoom.id,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      toast.success("RDS updated successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view Architecture Design.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <Tabs value={sidebarTab} onValueChange={(v: any) => setSidebarTab(v)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="boards" title="Material Boards"><Palette className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="drawings" title="Drawing Register"><FileText className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="rooms" title="Room Explorer"><Layout className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {sidebarTab === 'rooms' && (
                <>
                  <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rooms</div>
                  {rooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => { setSelectedRoom(room); }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors flex flex-col gap-0.5 ${
                        selectedRoom?.id === room.id 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm font-medium leading-none">{room.name}</span>
                      <span className={`text-[10px] font-mono ${selectedRoom?.id === room.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {room.code}
                      </span>
                    </button>
                  ))}
                  {rooms.length === 0 && !wbsLoading && (
                    <div className="p-4 text-center text-sm text-muted-foreground italic">No rooms found.</div>
                  )}
                </>
              )}
              {sidebarTab === 'boards' && (
                <button
                  onClick={() => { setSelectedRoom(null); setSidebarTab('boards'); }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                    !selectedRoom && sidebarTab === 'boards' ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Palette className="h-4 w-4" />
                  <span className="text-sm font-medium">Project Material Boards</span>
                </button>
              )}
              {sidebarTab === 'drawings' && (
                <button
                  onClick={() => { setSelectedRoom(null); setSidebarTab('drawings'); }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                    !selectedRoom && sidebarTab === 'drawings' ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Architecture Drawing Register</span>
                </button>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {!selectedRoom ? (
          sidebarTab === 'drawings' ? (
            <DrawingRegisterView projectId={activeProject.id} wbsNodes={wbsNodes} />
          ) : (
            <MaterialBoardView projectId={activeProject.id} />
          )
        ) : (
          <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{selectedRoom.name}</h1>
                <p className="text-sm text-muted-foreground">Room Data Sheet · {selectedRoom.code}</p>
              </div>
              <div className="flex gap-2">
                <DesignReview entityType="architecture_room" entityId={selectedRoom.id} projectId={activeProject.id} />
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>

            <Tabs defaultValue="finishes" className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-fit">
                <TabsTrigger value="finishes" className="gap-2">
                  <Layout className="h-4 w-4" /> Finishes
                </TabsTrigger>
                <TabsTrigger value="mep" className="gap-2">
                  <Zap className="h-4 w-4" /> MEP
                </TabsTrigger>
                <TabsTrigger value="schedules" className="gap-2">
                  <Maximize2 className="h-4 w-4" /> Schedules
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <Info className="h-4 w-4" /> Notes
                </TabsTrigger>
              </TabsList>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="flex-1 mt-4">
                  <TabsContent value="finishes" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Surface Finishes</CardTitle>
                        <CardDescription>Define the architectural finishes for this room.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Floor Finish</Label>
                            <Input 
                              value={roomData?.floor_finish || ""} 
                              onChange={e => setRoomData(prev => ({...prev!, floor_finish: e.target.value}))}
                              placeholder="e.g. Polished Concrete"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {COMMON_FINISHES.floor.map(f => (
                                <Badge 
                                  key={f} 
                                  variant="outline" 
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => setRoomData(prev => ({...prev!, floor_finish: f}))}
                                >
                                  {f}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Wall Finish</Label>
                            <Input 
                              value={roomData?.wall_finish || ""} 
                              onChange={e => setRoomData(prev => ({...prev!, wall_finish: e.target.value}))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Ceiling Finish</Label>
                            <Input 
                              value={roomData?.ceiling_finish || ""} 
                              onChange={e => setRoomData(prev => ({...prev!, ceiling_finish: e.target.value}))}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Skirting</Label>
                            <Input 
                              value={roomData?.skirting_finish || ""} 
                              onChange={e => setRoomData(prev => ({...prev!, skirting_finish: e.target.value}))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cornice / Bulkhead</Label>
                            <Input 
                              value={roomData?.cornice_finish || ""} 
                              onChange={e => setRoomData(prev => ({...prev!, cornice_finish: e.target.value}))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Acoustic Rating</Label>
                            <Input 
                              value={roomData?.acoustic_rating || ""} 
                              onChange={e => setRoomData(prev => ({...prev!, acoustic_rating: e.target.value}))}
                              placeholder="e.g. STC 45"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Fixtures & Ironmongery</CardTitle>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Sanitary Fixtures</Label>
                          <Textarea 
                            value={roomData?.sanitary_fixtures || ""} 
                            onChange={e => setRoomData(prev => ({...prev!, sanitary_fixtures: e.target.value}))}
                            placeholder="e.g. Wall-hung WC, Semi-recessed Basin"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ironmongery Set</Label>
                          <Input 
                            value={roomData?.ironmongery_set || ""} 
                            onChange={e => setRoomData(prev => ({...prev!, ironmongery_set: e.target.value}))}
                            placeholder="e.g. Set A-01"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="mep" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">MEP Requirements</CardTitle>
                        <CardDescription>Service requirements for electrical, mechanical, and data.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Power Points (Qty)</Label>
                            <Input 
                              type="number"
                              value={roomData?.mep_requirements.power_points || 0} 
                              onChange={e => setRoomData(prev => ({
                                ...prev!, 
                                mep_requirements: {...prev!.mep_requirements, power_points: Number(e.target.value)}
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Data Points (Qty)</Label>
                            <Input 
                              type="number"
                              value={roomData?.mep_requirements.data_points || 0} 
                              onChange={e => setRoomData(prev => ({
                                ...prev!, 
                                mep_requirements: {...prev!.mep_requirements, data_points: Number(e.target.value)}
                              }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>AC Type</Label>
                            <Input 
                              value={roomData?.mep_requirements.ac_type || ""} 
                              onChange={e => setRoomData(prev => ({
                                ...prev!, 
                                mep_requirements: {...prev!.mep_requirements, ac_type: e.target.value}
                              }))}
                              placeholder="e.g. Split Unit, Cassette, AHU"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="schedules" className="m-0 space-y-6">
                    <DoorScheduleTab roomId={selectedRoom.id} />
                    <WindowScheduleTab roomId={selectedRoom.id} />
                  </TabsContent>

                  <TabsContent value="notes" className="m-0 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Remarks & Special Requirements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea 
                          rows={10}
                          value={roomData?.remarks || ""} 
                          onChange={e => setRoomData(prev => ({...prev!, remarks: e.target.value}))}
                          placeholder="Add any specific design constraints or notes here..."
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              )}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

function DrawingRegisterView({ projectId, wbsNodes }: { projectId: string; wbsNodes: WbsNode[] }) {
  const [drawings, setDrawings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [newDrawing, setNewDrawing] = React.useState({ wbs_node_id: "", drawing_number: "", title: "", revision: "0", status: "preliminary" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("architecture_drawings")
      .select("*, wbs_nodes(name)")
      .eq("project_id", projectId)
      .order("drawing_number", { ascending: true });
    setDrawings(data || []);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, [projectId]);

  const handleAdd = async () => {
    if (!newDrawing.drawing_number || !newDrawing.title) return toast.error("Number and Title required");
    setSubmitting(true);
    try {
      let fileUrl = "";
      if (file) {
        const { path } = await storageService.uploadFile(file, {
          bucket: "design-files",
          projectId,
          folder: "architecture/drawings"
        });
        fileUrl = path;
      }

      const { error } = await supabase.from("architecture_drawings").insert({
        project_id: projectId,
        ...newDrawing,
        file_url: fileUrl || null,
        wbs_node_id: newDrawing.wbs_node_id || null
      });
      if (error) throw error;
      toast.success("Drawing added");
      setIsAddOpen(false);
      setFile(null);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drawing Register</h1>
          <p className="text-sm text-muted-foreground">Architectural sheets and revisions.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Add Drawing</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Architecture Drawing</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Drawing Number</Label><Input placeholder="ARC-GA-L01-001" value={newDrawing.drawing_number} onChange={e => setNewDrawing({...newDrawing, drawing_number: e.target.value})} /></div>
              <div className="grid gap-2"><Label>Title</Label><Input placeholder="Level 01 Floor Plan" value={newDrawing.title} onChange={e => setNewDrawing({...newDrawing, title: e.target.value})} /></div>
              <div className="grid gap-2"><Label>WBS Location</Label>
                <Select value={newDrawing.wbs_node_id} onValueChange={v => setNewDrawing({...newDrawing, wbs_node_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>{wbsNodes.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Revision</Label><Input value={newDrawing.revision} onChange={e => setNewDrawing({...newDrawing, revision: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Status</Label>
                  <Select value={newDrawing.status} onValueChange={v => setNewDrawing({...newDrawing, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preliminary">Preliminary</SelectItem>
                      <SelectItem value="issued_for_construction">IFC</SelectItem>
                      <SelectItem value="superseded">Superseded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Drawing File (PDF/DWG/IMG)</Label>
                <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <DialogFooter><Button onClick={handleAdd} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Drawing</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="flex-1 min-h-0">
        <CardContent className="p-0 overflow-auto h-full">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b sticky top-0">
              <tr>
                <th className="p-4 font-medium">Drawing #</th>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">WBS</th>
                <th className="p-4 font-medium">Rev</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {drawings.map(d => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="p-4 font-mono font-bold text-primary">{d.drawing_number}</td>
                  <td className="p-4 font-medium">{d.title}</td>
                  <td className="p-4 text-xs text-muted-foreground">{d.wbs_nodes?.name || "—"}</td>
                  <td className="p-4"><Badge variant="outline">REV {d.revision}</Badge></td>
                  <td className="p-4"><Badge variant="secondary" className="capitalize">{d.status.replace(/_/g, ' ')}</Badge></td>
                  <td className="p-4 text-right flex justify-end gap-1">
                    {d.file_url && (
                      <Button variant="ghost" size="icon" onClick={() => storageService.downloadFile("design-files", d.file_url, `${d.drawing_number}.pdf`)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <DesignReview entityType="architecture_drawing" entityId={d.id} projectId={projectId} trigger={<Button variant="ghost" size="icon"><MessageSquare className="h-4 w-4" /></Button>} />
                  </td>
                </tr>
              ))}
              {drawings.length === 0 && !loading && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground italic">No drawings registered yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function DesignReview({ entityType, entityId, projectId, trigger }: { entityType: string; entityId: string; projectId: string; trigger?: React.ReactNode }) {
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("design_review_comments")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    setComments(data || []);
  };

  const add = async () => {
    if (!newComment) return;
    setLoading(true);
    const { error } = await supabase.from("design_review_comments").insert({
      project_id: projectId,
      entity_type: entityType,
      entity_id: entityId,
      comment: newComment
    });
    if (!error) { setNewComment(""); load(); }
    setLoading(false);
  };

  return (
    <Dialog onOpenChange={(open) => open && load()}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" className="gap-2"><MessageSquare className="h-4 w-4" /> Review Comments</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Design Review Comments</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Textarea placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} />
            <Button onClick={add} disabled={loading} size="icon" className="h-auto px-4"><Plus className="h-4 w-4" /></Button>
          </div>
          <ScrollArea className="h-64 border rounded-md p-4">
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[10px] text-muted-foreground">User ID: {c.author_id?.slice(0,8) || "System"}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <div className="bg-muted p-2 rounded-md">{c.comment}</div>
                </div>
              ))}
              {comments.length === 0 && <div className="text-center py-8 text-muted-foreground italic">No comments yet.</div>}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MaterialBoardView({ projectId }: { projectId: string }) {
  const [boards, setBoards] = React.useState<MaterialBoard[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("architecture_material_boards")
      .select("*")
      .eq("project_id", projectId);
    setBoards(data as MaterialBoard[] || []);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, [projectId]);

  const add = async () => {
    setAdding(true);
    const { error } = await supabase.from("architecture_material_boards").insert({
      project_id: projectId,
      category: "Floor",
      material_name: "New Material Sample",
      status: "pending"
    });
    if (!error) load();
    setAdding(false);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Material Boards</h1>
          <p className="text-sm text-muted-foreground">Manage architectural samples and material approvals.</p>
        </div>
        <Button onClick={add} disabled={adding} className="gap-2">
          <Plus className="h-4 w-4" /> Add Sample
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
          {boards.map(board => (
            <Card key={board.id} className="overflow-hidden group">
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {board.photo_url ? (
                  <img src={board.photo_url} alt={board.material_name} className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                )}
                <Badge className="absolute top-2 right-2 capitalize" variant={board.status === 'approved' ? 'default' : 'secondary'}>
                  {board.status}
                </Badge>
              </div>
              <CardContent className="p-3 space-y-2">
                <div>
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider">{board.category}</div>
                  <Input 
                    className="h-7 text-sm font-semibold border-none px-0 focus-visible:ring-0" 
                    defaultValue={board.material_name}
                    onBlur={async (e) => {
                      await supabase.from("architecture_material_boards").update({ material_name: e.target.value }).eq("id", board.id);
                    }}
                  />
                </div>
                <Input 
                  className="h-6 text-[10px] border-none px-0 focus-visible:ring-0" 
                  defaultValue={board.sample_reference || ""}
                  placeholder="Ref: e.g. VIN-01"
                  onBlur={async (e) => {
                    await supabase.from("architecture_material_boards").update({ sample_reference: e.target.value }).eq("id", board.id);
                  }}
                />
              </CardContent>
            </Card>
          ))}
          {boards.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-muted-foreground italic border-2 border-dashed rounded-lg">
              No material samples added yet.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function DoorScheduleTab({ roomId }: { roomId: string }) {
  const [doors, setDoors] = React.useState<DoorEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    const { data } = await supabase.from("architecture_door_schedule").select("*").eq("wbs_node_id", roomId);
    setDoors(data as DoorEntry[] || []);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, [roomId]);

  const add = async () => {
    const mark = `D-${(doors.length + 1).toString().padStart(2, '0')}`;
    const { error } = await supabase.from("architecture_door_schedule").insert({
      wbs_node_id: roomId,
      mark_number: mark,
      door_type: "Standard Swing Timber"
    });
    if (!error) load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("architecture_door_schedule").delete().eq("id", id);
    if (!error) load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Door Schedule</CardTitle>
          <CardDescription>Doors linked to this room.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={add} className="gap-1">
          <Plus className="h-4 w-4" /> Add Door
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {doors.map(door => (
            <div key={door.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="secondary" className="font-mono">{door.mark_number}</Badge>
              <Input 
                className="h-8 flex-1" 
                defaultValue={door.door_type || ""} 
                placeholder="Door Type"
                onBlur={async (e) => {
                  await supabase.from("architecture_door_schedule").update({ door_type: e.target.value }).eq("id", door.id);
                }}
              />
              <div className="flex items-center gap-1">
                <Input 
                  className="h-8 w-20 text-center" 
                  defaultValue={door.width_mm || ""} 
                  placeholder="W" 
                  onBlur={async (e) => {
                    await supabase.from("architecture_door_schedule").update({ width_mm: Number(e.target.value) }).eq("id", door.id);
                  }}
                />
                <span className="text-muted-foreground">×</span>
                <Input 
                  className="h-8 w-20 text-center" 
                  defaultValue={door.height_mm || ""} 
                  placeholder="H" 
                  onBlur={async (e) => {
                    await supabase.from("architecture_door_schedule").update({ height_mm: Number(e.target.value) }).eq("id", door.id);
                  }}
                />
              </div>
              <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(door.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {doors.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground italic">No doors assigned to this room.</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function WindowScheduleTab({ roomId }: { roomId: string }) {
  const [windows, setWindows] = React.useState<WindowEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    const { data } = await supabase.from("architecture_window_schedule").select("*").eq("wbs_node_id", roomId);
    setWindows(data as WindowEntry[] || []);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, [roomId]);

  const add = async () => {
    const mark = `W-${(windows.length + 1).toString().padStart(2, '0')}`;
    const { error } = await supabase.from("architecture_window_schedule").insert({
      wbs_node_id: roomId,
      mark_number: mark,
      window_type: "Aluminium Frame Sliding"
    });
    if (!error) load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("architecture_window_schedule").delete().eq("id", id);
    if (!error) load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Window Schedule</CardTitle>
          <CardDescription>Windows linked to this room.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={add} className="gap-1">
          <Plus className="h-4 w-4" /> Add Window
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {windows.map(window => (
            <div key={window.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="secondary" className="font-mono">{window.mark_number}</Badge>
              <Input 
                className="h-8 flex-1" 
                defaultValue={window.window_type || ""} 
                placeholder="Window Type"
                onBlur={async (e) => {
                  await supabase.from("architecture_window_schedule").update({ window_type: e.target.value }).eq("id", window.id);
                }}
              />
              <div className="flex items-center gap-1">
                <Input 
                  className="h-8 w-20 text-center" 
                  defaultValue={window.width_mm || ""} 
                  placeholder="W" 
                  onBlur={async (e) => {
                    await supabase.from("architecture_window_schedule").update({ width_mm: Number(e.target.value) }).eq("id", window.id);
                  }}
                />
                <span className="text-muted-foreground">×</span>
                <Input 
                  className="h-8 w-20 text-center" 
                  defaultValue={window.height_mm || ""} 
                  placeholder="H" 
                  onBlur={async (e) => {
                    await supabase.from("architecture_window_schedule").update({ height_mm: Number(e.target.value) }).eq("id", window.id);
                  }}
                />
              </div>
              <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(window.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {windows.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground italic">No windows assigned to this room.</div>}
        </div>
      </CardContent>
    </Card>
  );
}
