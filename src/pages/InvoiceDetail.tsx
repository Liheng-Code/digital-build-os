import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInvoiceById, updateInvoiceStatus, updateInvoice, SupplierInvoice } from "@/services/invoiceService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  FileText,
  DollarSign,
  Send,
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  Calendar,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => fetchInvoiceById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: SupplierInvoice['status'] }) =>
      updateInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      toast.success("Invoice status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const handleSubmit = () => {
    updateStatusMutation.mutate({ id: id!, status: 'submitted' });
  };

  const handleReview = () => {
    updateStatusMutation.mutate({ id: id!, status: 'under_review' });
  };

  const handleApprove = () => {
    updateStatusMutation.mutate({ id: id!, status: 'approved_for_payment' });
  };

  const handleReject = () => {
    if (!confirm("Reject this invoice?")) return;
    updateStatusMutation.mutate({ id: id!, status: 'rejected' });
  };

  const handleMarkPaid = () => {
    updateStatusMutation.mutate({ id: id!, status: 'paid' });
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

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading invoice...</div>;
  }

  if (error || !invoice) {
    return <div className="p-8 text-red-500">Failed to load invoice</div>;
  }

  const isDraft = invoice.status === 'draft';
  const isSubmitted = invoice.status === 'submitted';
  const isUnderReview = invoice.status === 'under_review';
  const isApproved = invoice.status === 'approved_for_payment';
  const isPaid = invoice.status === 'paid';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/procurement/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</h1>
              {getStatusBadge(invoice.status)}
              {invoice.po_match_status !== 'matched' && (
                <Badge variant="destructive" className="text-xs">
                  PO Mismatch
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Supplier Invoice
              {invoice.purchase_orders && <span> · PO: {invoice.purchase_orders.po_number}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <Button onClick={handleSubmit} className="gap-2">
              <Send className="h-4 w-4" /> Submit for Review
            </Button>
          )}
          {isSubmitted && (
            <Button onClick={handleReview} variant="outline" className="gap-2">
              <CheckCircle className="h-4 w-4" /> Mark Under Review
            </Button>
          )}
          {isUnderReview && (
            <>
              <Button onClick={handleApprove} className="gap-2">
                <CheckCircle className="h-4 w-4" /> Approve for Payment
              </Button>
              <Button onClick={handleReject} variant="destructive" size="sm">
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
          {isApproved && (
            <Button onClick={handleMarkPaid} className="gap-2">
              <DollarSign className="h-4 w-4" /> Mark as Paid
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Invoice Date</span>
            </div>
            <p className="text-lg font-semibold">
              {format(new Date(invoice.invoice_date), 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Amount (Excl. Tax)</span>
            </div>
            <p className="text-lg font-semibold">
              ${invoice.amount?.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Total (Incl. Tax)</span>
            </div>
            <p className="text-lg font-bold">
              ${invoice.total_amount?.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3-Way Match Status */}
      <Card>
        <CardHeader>
          <CardTitle>3-Way Match Status</CardTitle>
          <CardDescription>Verification against PO and GRN</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">PO Match Status</p>
              <Badge 
                variant={invoice.po_match_status === 'matched' ? 'default' : 'destructive'}
              >
                {invoice.po_match_status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">GRN Match Status</p>
              <Badge 
                variant={invoice.grn_match_status === 'matched' ? 'default' : 'destructive'}
              >
                {invoice.grn_match_status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Info */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-semibold text-lg">{invoice.suppliers?.name || 'Unknown Supplier'}</p>
              <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                {invoice.suppliers?.contact_person && (
                  <div className="flex items-center gap-2">
                    <span>Contact:</span>
                    <span>{invoice.suppliers.contact_person}</span>
                  </div>
                )}
                {invoice.suppliers?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>{invoice.suppliers.email}</span>
                  </div>
                )}
                {invoice.suppliers?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{invoice.suppliers.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
          <CardDescription>Items with PO matching status</CardDescription>
        </CardHeader>
        <CardContent>
          {!invoice.invoice_items || invoice.invoice_items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items added to this invoice yet.
            </div>
          ) : (
            <div className="space-y-2">
              {invoice.invoice_items.map((item: any) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × ${item.unit_price} = ${item.total_price?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={item.match_status === 'matched' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {item.match_status}
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ${invoice.total_amount?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
