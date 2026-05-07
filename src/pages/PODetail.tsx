import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPOById, updatePOStatus, updatePO, PurchaseOrder } from "@/services/poService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Send,
  CheckCircle,
  XCircle,
  Truck,
  Mail,
  Phone,
  MapPin,
  Printer,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PODetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: po, isLoading, error } = useQuery({
    queryKey: ["po", id],
    queryFn: () => fetchPOById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: PurchaseOrder['status'] }) =>
      updatePOStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["po", id] });
      toast.success("PO status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const updatePOMutation = useMutation({
    mutationFn: (updates: Partial<PurchaseOrder>) => updatePO(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["po", id] });
      toast.success("PO updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update PO");
    },
  });

  const handleSubmit = () => {
    updateStatusMutation.mutate({ id: id!, status: 'submitted' });
  };

  const handleReview = () => {
    updateStatusMutation.mutate({ id: id!, status: 'review' });
  };

  const handleFinanceApprove = () => {
    updateStatusMutation.mutate({ id: id!, status: 'finance_approved' });
  };

  const handleIssue = () => {
    updateStatusMutation.mutate({ id: id!, status: 'issued' });
  };

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this PO?")) return;
    updateStatusMutation.mutate({ id: id!, status: 'cancelled' });
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

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading PO...</div>;
  }

  if (error || !po) {
    return <div className="p-8 text-red-500">Failed to load PO</div>;
  }

  const isDraft = po.status === 'draft';
  const isSubmitted = po.status === 'submitted';
  const isUnderReview = po.status === 'review';
  const isFinanceApproved = po.status === 'finance_approved';
  const isIssued = po.status === 'issued';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/procurement/pos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{po.po_number}</h1>
              {getStatusBadge(po.status)}
            </div>
            <p className="text-muted-foreground">
              Purchase Order
              {po.rfq && <span> · RFQ: {po.rfq.rfq_number}</span>}
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
            <Button onClick={handleFinanceApprove} className="gap-2">
              <CheckCircle className="h-4 w-4" /> Finance Approve
            </Button>
          )}
          {isFinanceApproved && (
            <Button onClick={handleIssue} className="gap-2">
              <Truck className="h-4 w-4" /> Issue PO to Supplier
            </Button>
          )}
          {!['cancelled', 'completed'].includes(po.status) && (
            <Button onClick={handleCancel} variant="destructive" size="sm">
              <XCircle className="h-4 w-4" /> Cancel
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
              <span className="text-sm text-muted-foreground">PO Date</span>
            </div>
            <p className="text-lg font-semibold">
              {format(new Date(po.po_date), 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Expected Delivery</span>
            </div>
            <p className="text-lg font-semibold">
              {po.expected_delivery ? format(new Date(po.expected_delivery), 'dd MMM yyyy') : 'Not set'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Amount</span>
            </div>
            <p className="text-lg font-semibold font-bold">
              {po.currency || 'USD'} {po.total_amount?.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Info */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
          <CardDescription>Selected supplier for this PO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-semibold text-lg">{po.suppliers?.name || 'Unknown Supplier'}</p>
              <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                {po.suppliers?.contact_person && (
                  <div className="flex items-center gap-2">
                    <span>Contact:</span>
                    <span>{po.suppliers.contact_person}</span>
                  </div>
                )}
                {po.suppliers?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>{po.suppliers.email}</span>
                  </div>
                )}
                {po.suppliers?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{po.suppliers.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PO Items */}
      <Card>
        <CardHeader>
          <CardTitle>PO Items</CardTitle>
          <CardDescription>Items included in this Purchase Order</CardDescription>
        </CardHeader>
        <CardContent>
          {!po.po_items || po.po_items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items added to this PO yet.
            </div>
          ) : (
            <div className="space-y-2">
              {po.po_items.map((item: any) => (
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
                    <p className="font-semibold">${item.total_price?.toLocaleString()}</p>
                    {item.delivered_quantity > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Delivered: {item.delivered_quantity}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ${po.total_amount?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{po.delivery_terms || 'Standard delivery terms apply.'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{po.payment_terms || 'Net 30 payment terms.'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
