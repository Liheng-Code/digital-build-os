import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export default function FinalAccount() {
  const { activeProject } = useProjects();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<{
    totalBudget: number;
    totalSpent: number;
    totalCommitted: number;
    totalInvoiced: number;
    totalPaid: number;
    totalVariations: number;
    runningCost: number;
  }>({
    totalBudget: 0,
    totalSpent: 0,
    totalCommitted: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    totalVariations: 0,
    runningCost: 0,
  });

  React.useEffect(() => {
    if (!activeProject) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      supabase.from("project_budgets").select("total_budget, spent_amount, committed_amount").eq("project_id", activeProject.id) as any,
      supabase.from("client_invoices").select("total_amount, paid_amount").eq("project_id", activeProject.id) as any,
      supabase.from("variation_orders").select("amount_change, status").eq("project_id", activeProject.id) as any,
    ]).then(([budgets, invoices, vos]) => {
      const b = (budgets.data ?? []) as any[];
      const inv = (invoices.data ?? []) as any[];
      const v = (vos.data ?? []) as any[];
      setData({
        totalBudget: b.reduce((s: number, i: any) => s + (i.total_budget || 0), 0),
        totalSpent: b.reduce((s: number, i: any) => s + (i.spent_amount || 0), 0),
        totalCommitted: b.reduce((s: number, i: any) => s + (i.committed_amount || 0), 0),
        totalInvoiced: inv.reduce((s: number, i: any) => s + (i.total_amount || 0), 0),
        totalPaid: inv.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0),
        totalVariations: v.filter((vo: any) => vo.status === "approved").reduce((s: number, i: any) => s + (i.amount_change || 0), 0),
        runningCost: b.reduce((s: number, i: any) => s + (i.spent_amount || 0) + (i.committed_amount || 0), 0),
      });
      setLoading(false);
    });
  }, [activeProject]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Final Account</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Select a project first.</CardContent></Card>
      </div>
    );
  }

  const budgetAfterVariations = data.totalBudget + data.totalVariations;
  const remainingBudget = budgetAfterVariations - data.runningCost;
  const profitLoss = data.totalInvoiced - data.runningCost;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Final Account</h1>
        <p className="text-muted-foreground">Project financial summary and close-out view</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Original Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${data.totalBudget.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Approved Variations</CardTitle>
                <TrendingUp className={cn("h-4 w-4", data.totalVariations >= 0 ? "text-success" : "text-destructive")} />
              </CardHeader>
              <CardContent>
                <p className={cn("text-2xl font-bold", data.totalVariations >= 0 ? "text-success" : "text-destructive")}>
                  {data.totalVariations >= 0 ? "+" : ""}${data.totalVariations.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Adjusted Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${budgetAfterVariations.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Remaining Budget</CardTitle>
                <AlertCircle className={cn("h-4 w-4", remainingBudget >= 0 ? "text-success" : "text-destructive")} />
              </CardHeader>
              <CardContent>
                <p className={cn("text-2xl font-bold", remainingBudget >= 0 ? "text-success" : "text-destructive")}>
                  ${remainingBudget.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Running Cost (Spent + Committed)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${data.runningCost.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Spent: ${data.totalSpent.toLocaleString()} | Committed: ${data.totalCommitted.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Client Invoiced</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${data.totalInvoiced.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Paid: ${data.totalPaid.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Estimated Profit / Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn("text-2xl font-bold", profitLoss >= 0 ? "text-success" : "text-destructive")}>
                  {profitLoss >= 0 ? "+" : ""}${profitLoss.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {profitLoss >= 0 ? `Margin: ${((profitLoss / data.totalInvoiced) * 100).toFixed(1)}%` : "Loss position"}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
