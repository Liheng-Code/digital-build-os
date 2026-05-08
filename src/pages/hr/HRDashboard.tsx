import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, Clock, AlertTriangle } from "lucide-react";

export default function HRDashboard() {
  const [headcount, setHeadcount] = React.useState(0);
  const [pendingLeaves, setPendingLeaves] = React.useState(0);
  const [todayAbsent, setTodayAbsent] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      const [profilesRes, leavesRes, attendanceRes] = await Promise.all([
        sb.from("profiles").select("id", { count: "exact" }),
        sb.from("leave_requests").select("id", { count: "exact" }).eq("status", "pending"),
        sb.from("attendance_records").select("id", { count: "exact" }).eq("date", new Date().toISOString().split("T")[0]).eq("status", "absent"),
      ]);
      setHeadcount(profilesRes.count ?? 0);
      setPendingLeaves(leavesRes.count ?? 0);
      setTodayAbsent(attendanceRes.count ?? 0);
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { title: "Total Employees", value: headcount, icon: Users, color: "bg-blue-500" },
    { title: "Pending Leave", value: pendingLeaves, icon: CalendarCheck, color: "bg-amber-500" },
    { title: "Absent Today", value: todayAbsent, icon: Clock, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">HR Dashboard</h1>
        <p className="text-muted-foreground">Human resources overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
              <div className={`p-2 rounded-full ${c.color}`}>
                <c.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Review pending leave requests from the Leave page</p>
          <p>• Manage employee records from the People page</p>
          <p>• Track daily attendance from the Attendance page</p>
        </CardContent>
      </Card>
    </div>
  );
}
