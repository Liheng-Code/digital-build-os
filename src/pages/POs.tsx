import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjects } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPOById, fetchPOs, fetchApprovedQuotations, createPO, PurchaseOrder } from "@/services/poService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  FileText,
  Plus,
  Calendar,
  DollarSign,
  Send,
  CheckCircle,
  XCircle,
  Building2,
  Truck,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function POs() {
  const { activeProject } = useProjects();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedQuotation, setSelectedQuotation] = React.useState<string>("");
  
  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["pos", activeProject?.id],
    queryFn: () => fetchPOs(activeProject!.id),
    enabled: !!activeProject,
  });

  const { data: approvedQuotations = [] } = useQuery({
    queryKey: ["approved-quotations", activeProject?.id],
    queryFn: () => fetchApprovedQuotations(activeProject!.id),
    enabled: isCreateOpen && !!activeProject,
  });

  const createPOMutation = useMutation({
    mutationFn: createPO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos"] });
      toast.success("Purchase Order created successfully");
      setIsCreateOpen(false);
      setSelectedQuotation("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create PO");
    },
  });

  const handleCreatePO = () => {
    if (!activeProject || !selectedQuotation) {
      toast.error("Please select a quotation");
      return;
    }

    // Get quotation details to create PO
    const quotation = approvedQuotations.find((q: any) => q.id === selectedQuotation);
    if (!quotation) return;

    createPOMutation.mutate({
      project_id: activeProject.id,
      quotation_id: quotation.id,
      rfq_id: quotation.rfq_id,
      supplier_id: quotation.supplier_id,
      status: 'draft',
      total_amount: quotation.total_amount,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-gray-400 border-gray-600">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-600">Submitted</Badge>;
      case 'review':
        return <Badge className="bg-yellow-600">Under Review</Badge>;
      case 'finance_approved':
        return <Badge className="bg-green-600">Finance Approved</Badge>;
      case 'issued':
        return <Badge className="bg-emerald-600">Issued</Badge>;
      case 'partially_delivered':
        return <Badge className="bg-orange-600">Partially Delivered</Badge>;
      case 'completed':
        return <Badge className="bg-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view Purchase Orders.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders (PO)</h1>
          <p className="text-muted-foreground">Manage purchase orders and supplier contracts.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create PO
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Purchase Order from Quotation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Approved Quotation *</Label>
                <Select value={selectedQuotation} onValueChange={setSelectedQuotation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an approved quotation" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedQuotations.map((quotation: any) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        {quotation.suppliers?.name} - ${quotation.total_amount?.toLocaleString()}
                        {quotation.quotation_number && <span className="text-muted-foreground ml-2">({quotation.quotation_number})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {approvedQuotations.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No approved quotations found. Please approve quotations in RFQ first.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreatePO}
                  disabled={!selectedQuotation || createPOMutation.isPending}
                >
                  {createPOMutation.isPending ? "Creating..." : "Create PO"}
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
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total POs</span>
            </div>
            <p className="text-2xl font-bold mt-2">{pos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Draft/Submitted</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {pos.filter((p: any) => ['draft', 'submitted', 'review'].includes(p.status)).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Issued</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {pos.filter((p: any) => ['finance_approved', 'issued'].includes(p.status)).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Expected Delivery</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {pos.filter((p: any) => p.expected_delivery && new Date(p.expected_delivery) > new Date()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PO List */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order List</CardTitle>
          <CardDescription>All Purchase Orders for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading POs...</div>
          ) : pos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No Purchase Orders created yet. Create a PO from an approved quotation.
            </div>
          ) : (
            <div className="space-y-2">
              {pos.map((po: PurchaseOrder) => (
                <div 
                  key={po.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/procurement/po/${po.id}`}
                          className="font-semibold hover:underline text-blue-400"
                        >
                          {po.po_number}
                        </Link>
                        {getStatusBadge(po.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {po.suppliers?.name || 'Unknown Supplier'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${po.total_amount?.toLocaleString()}
                        </span>
                        {po.expected_delivery && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {format(new Date(po.expected_delivery), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link to={`/procurement/po/${po.id}`}>
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
