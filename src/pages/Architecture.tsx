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
  Maximize2
} from "lucide-react";
import { toast } from "sonner";
import { RoomData, DoorEntry, WindowEntry, COMMON_FINISHES } from "@/lib/architectureMeta";
import { WbsNode } from "@/lib/wbsMeta";

export default function Architecture() {
  const { activeProject } = useProjects();
  const { nodes: wbsNodes, loading: wbsLoading } = useWbsTree(activeProject?.id);
  
  const [selectedRoom, setSelectedRoom] = React.useState<WbsNode | null>(null);
  const [roomData, setRoomData] = React.useState<RoomData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

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
      {/* Room Sidebar */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            Room Explorer
          </CardTitle>
          <CardDescription>Select a room to view RDS</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
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
                <div className="p-4 text-center text-sm text-muted-foreground italic">
                  No rooms found in WBS.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* RDS Editor */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {!selectedRoom ? (
          <Card className="flex-1 flex items-center justify-center border-dashed">
            <div className="text-center">
              <DoorOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Select a room from the explorer to manage its data.</p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{selectedRoom.name}</h1>
                <p className="text-sm text-muted-foreground">Room Data Sheet · {selectedRoom.code}</p>
              </div>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
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
  // Similar to DoorScheduleTab but for windows
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Window Schedule</CardTitle>
        <CardDescription>Windows linked to this room.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4 text-xs text-muted-foreground italic">
          Window schedule module coming soon...
        </div>
      </CardContent>
    </Card>
  );
}
