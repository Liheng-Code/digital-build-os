import * as React from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInvoices, fetchIssuedPOs, createInvoice, SupplierInvoice } from "@/services/invoiceService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  FileText,
  DollarSign,
  Send,
  CheckCircle,
  XCircle,
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
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Invoices() {
  const { activeProject } = useProjects();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedPO, setSelectedPO] = React.useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", activeProject?.id],
    queryFn: () => fetchInvoices(activeProject!.id),
    enabled: !!activeProject,
  });

  const { data: issuedPOs = [] } = useQuery({
    queryKey: ["issued-pos", activeProject?.id],
    queryFn: () => fetchIssuedPOs(activeProject!.id),
    enabled: isCreateOpen && !!activeProject,
  });

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
      setIsCreateOpen(false);
      setSelectedPO("");
      setInvoiceNumber("");
      setInvoiceDate("");
      setAmount("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });

  const handleCreate = () => {
    if (!activeProject || !selectedPO || !invoiceNumber || !invoiceDate || !amount) {
      toast.error("Please fill all required fields");
      return;
    }

    const po = issuedPOs.find((p: any) => p.id === selectedPO);
    
    createMutation.mutate({
      project_id: activeProject.id,
      po_id: selectedPO,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      amount: parseFloat(amount),
      supplier_id: po?.supplier_id,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-gray-400 border-gray-600">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-600">Submitted</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-600">Under Review</Badge>;
      case 'approved_for_payment':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-600">Paid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view invoices.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Supplier Invoices</h1>
          <p className="text-muted-foreground">3-way matching with PO and GRN.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Invoice from PO</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Issued PO *</Label>
                <Select value={selectedPO} onValueChange={setSelectedPO}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an issued PO" />
                  </SelectTrigger>
                  <SelectContent>
                    {issuedPOs.map((po: any) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.po_number} - {po.suppliers?.name} (${po.total_amount?.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {issuedPOs.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No issued POs found. Please issue a PO first.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Invoice Number *</Label>
                <Input 
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Date *</Label>
                <Input 
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (Excl. Tax) *</Label>
                <Input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  disabled={!selectedPO || !invoiceNumber || !invoiceDate || !amount || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Invoice"}
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
              <span className="text-sm text-muted-foreground">Total Invoices</span>
            </div>
            <p className="text-2xl font-bold mt-2">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Draft/Submitted</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {invoices.filter((i: any) => ['draft', 'submitted', 'under_review'].includes(i.status)).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Approved for Payment</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {invoices.filter((i: any) => i.status === 'approved_for_payment').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Paid</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              ${invoices.filter((i: any) => i.status === 'paid').reduce((acc: number, inv: any) => acc + (inv.total_amount || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>All supplier invoices for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices created yet. Create an invoice from an issued PO.
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice: SupplierInvoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-400">{invoice.invoice_number}</span>
                        {getStatusBadge(invoice.status)}
                        {invoice.po_match_status !== 'matched' && (
                          <Badge variant="destructive" className="text-xs">
                            PO Mismatch
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {invoice.suppliers?.name || 'Unknown Supplier'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${invoice.total_amount?.toLocaleString()}
                        </span>
                        <span>
                          PO: {invoice.purchase_orders?.po_number}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={`/procurement/invoice/${invoice.id}`}>
                      <Eye className="h-4 w-4" /> View
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
