import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchRFQs, fetchAvailablePRs, createRFQ, RFQ } from "@/services/rfqService";
import { Link } from "react-router-dom";

export default function RFQs() {
  const { activeProject } = useProjects();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedPR, setSelectedPR] = React.useState<string>("");
  const [dueDate, setDueDate] = React.useState<string>("");

  const { data: rfqs = [], isLoading, refetch } = useQuery({
    queryKey: ["rfqs", activeProject?.id],
    queryFn: () => fetchRFQs(activeProject!.id),
    enabled: !!activeProject,
  });

  const { data: availablePRs = [] } = useQuery({
    queryKey: ["available-prs", activeProject?.id],
    queryFn: () => fetchAvailablePRs(activeProject!.id),
    enabled: !!activeProject && isCreateOpen,
  });

  const createMutation = useMutation({
    mutationFn: createRFQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      toast.success("RFQ created successfully");
      setIsCreateOpen(false);
      setSelectedPR("");
      setDueDate("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create RFQ");
    },
  });

  const handleCreate = () => {
    if (!activeProject || !dueDate) {
      toast.error("Please select a due date");
      return;
    }
    createMutation.mutate({
      project_id: activeProject.id,
      pr_id: selectedPR || undefined,
      due_date: dueDate,
      status: 'draft',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-gray-400 border-gray-600">Draft</Badge>;
      case 'issued':
        return <Badge className="bg-blue-600">Issued</Badge>;
      case 'closed':
        return <Badge className="bg-green-600">Closed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view RFQs.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Request for Quotation (RFQ)</h1>
          <p className="text-muted-foreground">Manage supplier bidding and quotation process.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create RFQ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New RFQ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Link to Purchase Requisition (Optional)</Label>
                <Select value={selectedPR} onValueChange={setSelectedPR}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PR (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No PR Link</SelectItem>
                    {availablePRs.map((pr: any) => (
                      <SelectItem key={pr.id} value={pr.id}>
                        {pr.pr_number} - {pr.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create RFQ"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total RFQs</span>
            </div>
            <p className="text-2xl font-bold mt-2">{rfqs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Draft</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {rfqs.filter(r => r.status === 'draft').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Issued</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {rfqs.filter(r => r.status === 'issued').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Closed</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {rfqs.filter(r => r.status === 'closed').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RFQ List */}
      <Card>
        <CardHeader>
          <CardTitle>RFQ List</CardTitle>
          <CardDescription>All Request for Quotations for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading RFQs...</div>
          ) : rfqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No RFQs created yet. Click "Create RFQ" to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {rfqs.map((rfq: RFQ) => (
                <div 
                  key={rfq.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/procurement/rfq/${rfq.id}`}
                          className="font-semibold hover:underline text-blue-400"
                        >
                          {rfq.rfq_number}
                        </Link>
                        {getStatusBadge(rfq.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {rfq.purchase_requisitions && (
                          <span>PR: {rfq.purchase_requisitions.pr_number}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {format(new Date(rfq.due_date), 'dd MMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {rfq._count?.rfq_suppliers || 0} suppliers
                        </span>
                        <span>
                          {rfq._count?.supplier_quotations || 0} quotations
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link to={`/procurement/rfq/${rfq.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" /> View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
 
 