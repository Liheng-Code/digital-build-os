import * as React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_TONE } from "@/lib/hrMeta";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/hrMeta";
import { clockIn, clockOut, fetchTodayStatus, fetchMyAttendanceRecords } from "@/services/attendanceService";

export default function Attendance() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [todayRec, setTodayRec] = React.useState<AttendanceRecord | null>(null);
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = React.useState(true);
  const [clocking, setClocking] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [todayRes, monthRes] = await Promise.all([
      fetchTodayStatus(user.id),
      fetchMyAttendanceRecords(user.id, month),
    ]);
    setTodayRec(todayRes);
    setRecords(monthRes);
    setLoading(false);
  }, [user, month]);

  React.useEffect(() => { load(); }, [load]);

  const handleClockIn = async () => {
    if (!user) return;
    setClocking(true);
    try {
      await clockIn(user.id);
      toast.success("Clocked in");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setClocking(false);
  };

  const handleClockOut = async () => {
    if (!user) return;
    setClocking(true);
    try {
      await clockOut(user.id);
      toast.success("Clocked out");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setClocking(false);
  };

  const daysInMonth = eachDayOfInterval({
    start: parseISO(`${month}-01`),
    end: endOfMonth(parseISO(`${month}-01`)),
  });

  const recordMap = new Map(records.map((r) => [r.date, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Track daily attendance and clock in/out</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today's Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="space-y-3">
                {todayRec ? (
                  <div>
                    <div className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", ATTENDANCE_STATUS_TONE[todayRec.status as AttendanceStatus])}>
                      {ATTENDANCE_STATUS_LABELS[todayRec.status as AttendanceStatus]}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {todayRec.clock_in && <p>In: {todayRec.clock_in}</p>}
                      {todayRec.clock_out && <p>Out: {todayRec.clock_out}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Not recorded yet</p>
                )}
                <div className="flex gap-2">
                  {!todayRec?.clock_in && (
                    <Button size="sm" onClick={handleClockIn} disabled={clocking}>
                      <LogIn className="h-4 w-4 mr-1" />Clock In
                    </Button>
                  )}
                  {todayRec?.clock_in && !todayRec?.clock_out && (
                    <Button size="sm" variant="outline" onClick={handleClockOut} disabled={clocking}>
                      <LogOut className="h-4 w-4 mr-1" />Clock Out
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent border-none text-sm font-medium cursor-pointer"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-muted-foreground font-medium py-1">{d}</div>
                ))}
                {daysInMonth.map((d, i) => {
                  const ds = format(d, "yyyy-MM-dd");
                  const rec = recordMap.get(ds);
                  const isWeekendDay = isWeekend(d);
                  const isToday = ds === today;
                  return (
                    <div
                      key={ds}
                      className={cn(
                        "p-2 rounded-md text-center",
                        isToday && "ring-2 ring-primary",
                        rec && ATTENDANCE_STATUS_TONE[rec.status as AttendanceStatus]?.split(" ")[0],
                        !rec && isWeekendDay && "bg-muted/50",
                      )}
                      style={{ gridColumnStart: i === 0 ? d.getDay() + 1 : undefined }}
                    >
                      <div className="font-medium">{format(d, "d")}</div>
                      {rec && (
                        <div className="text-[10px] leading-tight mt-0.5">
                          {ATTENDANCE_STATUS_LABELS[rec.status as AttendanceStatus]?.slice(0, 4)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
