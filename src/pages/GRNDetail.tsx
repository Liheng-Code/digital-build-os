import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchGRNById, updateGRNStatus, GRN } from "@/services/grnService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Truck,
  CheckCircle,
  XCircle,
  Building2,
  MapPin,
  Phone,
  Eye,
  Package
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function GRNDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: grn, isLoading, error } = useQuery({
    queryKey: ["grn", id],
    queryFn: () => fetchGRNById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: GRN['delivery_status'] }) =>
      updateGRNStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grn", id] });
      toast.success("GRN status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const handleComplete = () => {
    updateStatusMutation.mutate({ id: id!, status: 'completed' });
  };

  const handleReject = () => {
    if (!confirm("Reject this delivery?")) return;
    updateStatusMutation.mutate({ id: id!, status: 'rejected' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-600">Pending</Badge>;
      case 'partialy_received':
        return <Badge className="bg-orange-600">Partially Received</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading GRN...</div>;
  }

  if (error || !grn) {
    return <div className="p-8 text-red-500">Failed to load GRN</div>;
  }

  const isPending = grn.delivery_status === 'pending';
  const isPartial = grn.delivery_status === 'partialy_received';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/procurement/grns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{grn.grn_number}</h1>
              {getStatusBadge(grn.delivery_status)}
              {grn.po_match_status !== 'matched' && (
                <Badge variant="destructive" className="text-xs">
                  PO Mismatch
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Goods Receipt Note
              {grn.purchase_orders && <span> · PO: {grn.purchase_orders.po_number}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isPending && (
            <Button onClick={handleComplete} className="gap-2">
              <CheckCircle className="h-4 w-4" /> Mark Completed
            </Button>
          )}
          {(isPending || isPartial) && (
            <Button onClick={handleReject} variant="destructive" size="sm">
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Delivery Date</span>
            </div>
            <p className="text-lg font-semibold">
              {format(new Date(grn.actual_delivery_date || grn.delivery_date), 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Vehicle</span>
            </div>
            <p className="text-lg font-semibold">
              {grn.vehicle_number || 'Not specified'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Items</span>
            </div>
            <p className="text-lg font-semibold">
              {grn.grn_items?.length || 0} items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Info */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Information</CardTitle>
          <CardDescription>Vehicle and driver details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Vehicle Number
              </p>
              <p className="text-muted-foreground">
                {grn.vehicle_number || 'Not recorded'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Driver Name
              </p>
              <p className="text-muted-foreground">
                {grn.driver_name || 'Not recorded'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium mb-2">Delivery Note Number</p>
              <p className="text-muted-foreground">
                {grn.delivery_note_number || 'Not recorded'}
              </p>
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
              <p className="font-semibold text-lg">{grn.purchase_orders?.suppliers?.name || 'Unknown Supplier'}</p>
              <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                {grn.purchase_orders?.suppliers?.contact_person && (
                  <div className="flex items-center gap-2">
                    <span>Contact:</span>
                    <span>{grn.purchase_orders.suppliers.contact_person}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRN Items */}
      <Card>
        <CardHeader>
          <CardTitle>Received Items</CardTitle>
          <CardDescription>Items with PO matching status</CardDescription>
        </CardHeader>
        <CardContent>
          {!grn.grn_items || grn.grn_items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items added to this GRN yet.
            </div>
          ) : (
            <div className="space-y-2">
              {grn.grn_items.map((item: any) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.material_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Received: {item.received_qty} {item.uom} · Accepted: {item.accepted_qty} · Rejected: {item.rejected_qty}
                      {item.po_quantity && <span> (PO: {item.po_quantity})</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={item.quantity_match_status === 'matched' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {item.quantity_match_status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quality: {item.quality_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
