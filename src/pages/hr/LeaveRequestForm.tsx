import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import type { LeaveType, LeaveBalance } from "@/lib/hrMeta";

export default function LeaveRequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([]);
  const [balances, setBalances] = React.useState<LeaveBalance[]>([]);
  const [leaveTypeId, setLeaveTypeId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      const [ltRes, lbRes] = await Promise.all([
        supabase.from("leave_types").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("leave_balances").select("*, leave_type:leave_types(*)").eq("user_id", user?.id),
      ]);
      setLeaveTypes((ltRes.data ?? []) as unknown as LeaveType[]);
      setBalances((lbRes.data ?? []) as unknown as LeaveBalance[]);
    };
    load();
  }, [user?.id]);

  const totalDays = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const selectedType = leaveTypes.find((lt) => lt.id === leaveTypeId);
  const selectedBalance = balances.find((b) => b.leave_type_id === leaveTypeId);
  const availableDays = selectedBalance ? selectedBalance.total_days - selectedBalance.used_days - selectedBalance.pending_days : 0;

  const submit = async () => {
    if (!leaveTypeId || !startDate || !endDate || !reason.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (totalDays <= 0) {
      toast.error("End date must be after start date");
      return;
    }
    if (selectedType?.max_consecutive_days && totalDays > selectedType.max_consecutive_days) {
      toast.error(`Maximum ${selectedType.max_consecutive_days} consecutive days allowed for this leave type`);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("leave_requests").insert({
      user_id: user?.id,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      reason,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Leave request submitted");
    navigate("/hr/leave");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/hr/leave"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Leave Request</h1>
          <p className="text-muted-foreground">Submit a leave request for approval</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Leave Type *</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
              <SelectContent>
                {leaveTypes.map((lt) => {
                  const bal = balances.find((b) => b.leave_type_id === lt.id);
                  const avail = bal ? bal.total_days - bal.used_days - bal.pending_days : 0;
                  return (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.name} ({avail} left)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {totalDays > 0 && (
            <div className="text-sm text-muted-foreground">
              Total: <strong>{totalDays}</strong> day{totalDays > 1 ? "s" : ""}
              {selectedType?.max_consecutive_days && (
                <span> (max {selectedType.max_consecutive_days} consecutive)</span>
              )}
            </div>
          )}

          {selectedType && (
            <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
              <p>Available balance: <strong>{availableDays}</strong> day{availableDays !== 1 ? "s" : ""}</p>
              {selectedType.requires_attachment && <p className="text-warning">Attachment may be required for this leave type</p>}
              {!selectedType.is_paid && <p className="text-warning">This is unpaid leave</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              placeholder="Explain the reason for your leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" asChild><Link to="/hr/leave">Cancel</Link></Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
