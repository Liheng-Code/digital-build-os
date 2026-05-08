import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import type { LeaveType } from "@/lib/hrMeta";

export default function LeaveTypesAdmin() {
  const [types, setTypes] = React.useState<LeaveType[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("leave_types").select("*").order("sort_order");
      setTypes((data ?? []) as unknown as LeaveType[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leave Types</h1>
        <p className="text-muted-foreground">Configure leave types and default allocations</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Days/Year</TableHead>
                  <TableHead className="text-center">Paid</TableHead>
                  <TableHead className="text-center">Attachment</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-right num">{t.default_days_per_year}</TableCell>
                    <TableCell className="text-center">{t.is_paid ? <CheckCircle2 className="h-4 w-4 text-success inline" /> : <XCircle className="h-4 w-4 text-muted-foreground inline" />}</TableCell>
                    <TableCell className="text-center">{t.requires_attachment ? <Badge variant="outline">Yes</Badge> : "—"}</TableCell>
                    <TableCell className="text-center">{t.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
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
