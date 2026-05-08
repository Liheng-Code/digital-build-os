import * as React from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/lib/hrMeta";
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_TONE } from "@/lib/hrMeta";
import { cn } from "@/lib/utils";

export default function LeaveList() {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("project_manager");
  const [requests, setRequests] = React.useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("my");

  const load = React.useCallback(async () => {
    setLoading(true);
    const [ltRes, lrRes] = await Promise.all([
      sb.from("leave_types").select("*").eq("is_active", true).order("sort_order"),
      isAdmin
        ? sb.from("leave_requests").select("*, leave_type:leave_types(*), profile:profiles(full_name, employee_id)").order("created_at", { ascending: false })
        : sb.from("leave_requests").select("*, leave_type:leave_types(*)").eq("user_id", user?.id).order("created_at", { ascending: false }),
    ]);
    setLeaveTypes((ltRes.data ?? []) as unknown as LeaveType[]);
    setRequests((lrRes.data ?? []) as unknown as LeaveRequest[]);
    setLoading(false);
  }, [isAdmin, user?.id]);

  React.useEffect(() => { load(); }, [load]);

  const ltMap = new Map(leaveTypes.map((lt) => [lt.id, lt]));

  const approve = async (id: string) => {
    setBusy(id);
    const { error } = await sb.from("leave_requests").update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", id);
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success("Leave approved"); load(); }
  };

  const reject = async (id: string) => {
    const reason = window.prompt("Rejection reason:");
    if (!reason) return;
    setBusy(id);
    const { error } = await sb.from("leave_requests").update({ status: "rejected", rejection_reason: reason, approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", id);
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success("Leave rejected"); load(); }
  };

  const cancel = async (id: string) => {
    const { error } = await sb.from("leave_requests").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Leave cancelled"); load(); }
  };

  const myRequests = requests.filter((r) => r.user_id === user?.id);
  const pendingRequests = isAdmin ? requests.filter((r) => r.status === "pending") : [];

  const renderTable = (items: LeaveRequest[], showUser = false) => (
    loading ? (
      <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
    ) : items.length === 0 ? (
      <div className="p-12 text-center">
        <CheckCheck className="h-12 w-12 text-success mx-auto mb-2" />
        <p className="font-medium">No leave requests</p>
      </div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            {showUser && <TableHead>Employee</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead className="text-right">Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => {
            const lt = r.leave_type ?? ltMap.get(r.leave_type_id);
            return (
              <TableRow key={r.id}>
                {showUser && (
                  <TableCell>
                    <div className="text-sm font-medium">{(r as any).profile?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{(r as any).profile?.employee_id ?? ""}</div>
                  </TableCell>
                )}
                <TableCell><Badge variant="outline">{lt?.name ?? r.leave_type_id}</Badge></TableCell>
                <TableCell className="text-sm">{format(parseISO(r.start_date), "MMM d")}</TableCell>
                <TableCell className="text-sm">{format(parseISO(r.end_date), "MMM d")}</TableCell>
                <TableCell className="text-right num">{r.total_days}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.reason}</TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", LEAVE_STATUS_TONE[r.status as LeaveStatus]?.bg, LEAVE_STATUS_TONE[r.status as LeaveStatus]?.fg)}>
                    {LEAVE_STATUS_LABELS[r.status as LeaveStatus]}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {r.status === "pending" && isAdmin && (
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => reject(r.id)}><X className="h-3 w-3" /></Button>
                      <Button size="sm" disabled={busy === r.id} onClick={() => approve(r.id)}>
                        {busy === r.id && <Loader2 className="h-3 w-3 animate-spin" />}
                        Approve
                      </Button>
                    </div>
                  )}
                  {r.status === "draft" && r.user_id === user?.id && (
                    <Button size="sm" variant="ghost" onClick={() => cancel(r.id)}>Cancel</Button>
                  )}
                  {(r.status === "approved" || r.status === "rejected") && r.approved_by && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground">Manage and review leave requests</p>
        </div>
        <Button asChild>
          <Link to="/hr/leave/new"><Plus className="h-4 w-4 mr-1" />New Request</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="my">My Requests</TabsTrigger>
          {isAdmin && <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>}
          {isAdmin && <TabsTrigger value="all">All</TabsTrigger>}
        </TabsList>
        <TabsContent value="my" className="mt-4">
          <Card><CardContent className="p-0">{renderTable(myRequests)}</CardContent></Card>
        </TabsContent>
        {isAdmin && (
          <TabsContent value="pending" className="mt-4">
            <Card><CardContent className="p-0">{renderTable(pendingRequests, true)}</CardContent></Card>
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="all" className="mt-4">
            <Card><CardContent className="p-0">{renderTable(requests, true)}</CardContent></Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
