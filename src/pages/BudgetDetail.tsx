import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBudgetById, updateBudget, ProjectBudget } from "@/services/budgetService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertTriangle,
  Calendar,
  Percent
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BudgetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: budget, isLoading, error } = useQuery({
    queryKey: ["budget", id],
    queryFn: () => fetchBudgetById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<ProjectBudget>) => updateBudget(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget", id] });
      toast.success("Budget updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update budget");
    },
  });

  const handleUpdateCommitted = (amount: string) => {
    updateMutation.mutate({ committed_amount: parseFloat(amount) });
  };

  const handleUpdateSpent = (amount: string) => {
    updateMutation.mutate({ spent_amount: parseFloat(amount) });
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading budget...</div>;
  }

  if (error || !budget) {
    return <div className="p-8 text-red-500">Failed to load budget</div>;
  }

  const variance = (budget.total_budget || 0) - (budget.committed_amount || 0) - (budget.spent_amount || 0);
  const percentUsed = ((budget.committed_amount || 0) + (budget.spent_amount || 0)) / (budget.total_budget || 1) * 100;
  const isOverBudget = variance < 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/procurement/budgets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{budget.budget_code}</h1>
              {isOverBudget && (
                <Badge variant="destructive" className="text-xs">
                  Over Budget
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {budget.budget_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" /> View WBS
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Budget</span>
            </div>
            <p className="text-lg font-semibold">
              ${(budget.total_budget || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Committed</span>
            </div>
            <p className="text-lg font-semibold">
              ${(budget.committed_amount || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Spent</span>
            </div>
            <p className="text-lg font-semibold">
              ${(budget.spent_amount || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {isOverBudget ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <DollarSign className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm text-muted-foreground">Variance</span>
            </div>
            <p className={`text-lg font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              ${variance.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Usage Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Utilization</CardTitle>
          <CardDescription>
            {percentUsed.toFixed(1)}% of budget used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex">
              <div 
                className={`h-full ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Committed: ${(budget.committed_amount || 0).toLocaleString()}</span>
              <span>Spent: ${(budget.spent_amount || 0).toLocaleString()}</span>
              <span>Remaining: ${variance.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Budget Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Budget Code</span>
              <span className="font-medium">{budget.budget_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Budget Name</span>
              <span className="font-medium">{budget.budget_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fiscal Year</span>
              <span className="font-medium">{budget.fiscal_year || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Currency</span>
              <span className="font-medium">{budget.currency || 'USD'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Update committed or spent amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">Update Committed Amount</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="0.00"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateCommitted((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Update Spent Amount</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="0.00"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateSpent((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Line Items (WBS-Based)</CardTitle>
          <CardDescription>Detailed budget breakdown by WBS node</CardDescription>
        </CardHeader>
        <CardContent>
          {!budget.budget_line_items || budget.budget_line_items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No budget line items added yet.
            </div>
          ) : (
            <div className="space-y-2">
              {budget.budget_line_items.map((item: any) => {
                const itemVariance = (item.planned_amount || 0) - (item.actual_amount || 0);
                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.cost_code && <span>Code: {item.cost_code} · </span>}
                        {item.wbs_node_id && <span>WBS: {item.wbs_node_id}</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        Planned: ${(item.planned_amount || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Actual: ${(item.actual_amount || 0).toLocaleString()}
                      </p>
                      <Badge 
                        variant={itemVariance >= 0 ? 'default' : 'destructive'}
                        className="text-xs mt-1"
                      >
                        {(itemVariance || 0).toLocaleString()} {(itemVariance >= 0 ? 'under' : 'over')}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
