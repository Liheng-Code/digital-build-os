import * as React from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBudgets, fetchBudgetCodes, createBudget, ProjectBudget } from "@/services/budgetService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Budgets() {
  const { activeProject } = useProjects();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [budgetCode, setBudgetCode] = React.useState("");
  const [budgetName, setBudgetName] = React.useState("");
  const [totalBudget, setTotalBudget] = React.useState("");
  
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets", activeProject?.id],
    queryFn: () => fetchBudgets(activeProject!.id),
    enabled: !!activeProject,
  });

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget created successfully");
      setIsCreateOpen(false);
      setBudgetCode("");
      setBudgetName("");
      setTotalBudget("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create budget");
    },
  });

  const handleCreate = () => {
    if (!activeProject || !budgetCode || !budgetName || !totalBudget) {
      toast.error("Please fill all required fields");
      return;
    }

    createMutation.mutate({
      project_id: activeProject.id,
      budget_code: budgetCode,
      budget_name: budgetName,
      total_budget: parseFloat(totalBudget),
    });
  };

  const getVarianceBadge = (variance: number) => {
    if (variance > 0) return <Badge className="bg-green-600">Under Budget</Badge>;
    if (variance < 0) return <Badge variant="destructive">Over Budget</Badge>;
    return <Badge variant="outline">On Budget</Badge>;
  };

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view budgets.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Project Budgets</h1>
          <p className="text-muted-foreground">Budget control and variance tracking.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Budget Code *</Label>
                <Input 
                  value={budgetCode}
                  onChange={(e) => setBudgetCode(e.target.value)}
                  placeholder="e.g., MAT-2024, LABOR-2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Budget Name *</Label>
                <Input 
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g., Materials Budget 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Budget *</Label>
                <Input 
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!budgetCode || !budgetName || !totalBudget || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Budget"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Budgets</span>
            </div>
            <p className="text-2xl font-bold mt-2">{budgets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Budget</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              ${budgets.reduce((acc: number, b: any) => acc + (b.total_budget || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Committed</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              ${budgets.reduce((acc: number, b: any) => acc + (b.committed_amount || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Spent</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              ${budgets.reduce((acc: number, b: any) => acc + (b.spent_amount || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <Card>
        <CardHeader>
          <CardTitle>Budget List</CardTitle>
          <CardDescription>All budgets for this project with variance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading budgets...</div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No budgets created yet. Click "Create Budget" to start.
            </div>
          ) : (
            <div className="space-y-2">
              {budgets.map((budget: ProjectBudget) => {
                const variance = (budget.total_budget || 0) - (budget.spent_amount || 0) - (budget.committed_amount || 0);
                const percentUsed = ((budget.committed_amount || 0) + (budget.spent_amount || 0)) / (budget.total_budget || 1) * 100;
                
                return (
                  <div 
                    key={budget.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-400">{budget.budget_code}</span>
                          {getVarianceBadge(variance)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {budget.budget_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Budget: ${budget.total_budget?.toLocaleString()}</span>
                          <span>Used: {percentUsed.toFixed(1)}%</span>
                          <span className={variance >= 0 ? "text-green-600" : "text-red-600"}>
                            Variance: ${variance.toLocaleString()}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={`/procurement/budget/${budget.id}`}>
                        <Eye className="h-4 w-4" /> View
                      </a>
                    </Button>
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
