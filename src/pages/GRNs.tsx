import * as React from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchGRNs, fetchPOsForGRN, createGRN, GRN } from "@/services/grnService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  FileText,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  MapPin
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
import { Input } from "@/components/ui/input";

export default function GRNs() {
  const { activeProject } = useProjects();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedPO, setSelectedPO] = React.useState<string>("");
  const [grnNumber, setGRNNumber] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState<string>("");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [driverName, setDriverName] = React.useState("");
  
  const { data: grns = [], isLoading } = useQuery({
    queryKey: ["grns", activeProject?.id],
    queryFn: () => fetchGRNs(activeProject!.id),
    enabled: !!activeProject,
  });

  const { data: issuedPOs = [] } = useQuery({
    queryKey: ["issued-pos-for-grn", activeProject?.id],
    queryFn: () => fetchPOsForGRN(activeProject!.id),
    enabled: isCreateOpen && !!activeProject,
  });

  const createMutation = useMutation({
    mutationFn: createGRN,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grns"] });
      toast.success("GRN created successfully");
      setIsCreateOpen(false);
      setSelectedPO("");
      setGRNNumber("");
      setDeliveryDate("");
      setVehicleNumber("");
      setDriverName("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create GRN");
    },
  });

  const handleCreate = () => {
    if (!activeProject || !selectedPO || !grnNumber || !deliveryDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const po = issuedPOs.find((p: any) => p.id === selectedPO);
    
    createMutation.mutate({
      project_id: activeProject.id,
      po_id: selectedPO,
      grn_number: grnNumber,
      delivery_date: deliveryDate,
      vehicle_number: vehicleNumber,
      driver_name: driverName,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-600">Pending</Badge>;
      case 'partially_received':
        return <Badge className="bg-orange-600">Partially Received</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!activeProject) {
    return <div className="p-8 text-muted-foreground">Select a project to view GRNs.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Goods Receipt Notes (GRN)</h1>
          <p className="text-muted-foreground">Track material deliveries and quality checks.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create GRN
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create GRN from PO</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select PO *</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GRN Number *</Label>
                  <Input 
                    value={grnNumber}
                    onChange={(e) => setGRNNumber(e.target.value)}
                    placeholder="e.g., GRN-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Date *</Label>
                  <Input 
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Number</Label>
                  <Input 
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g., ABC-1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Driver Name</Label>
                  <Input 
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!selectedPO || !grnNumber || !deliveryDate || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create GRN"}
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
              <span className="text-sm text-muted-foreground">Total GRNs</span>
            </div>
            <p className="text-2xl font-bold mt-2">{grns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {grns.filter((g: any) => g.delivery_status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {grns.filter((g: any) => g.delivery_status === 'completed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Rejected</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {grns.filter((g: any) => g.delivery_status === 'rejected').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRN List */}
      <Card>
        <CardHeader>
          <CardTitle>GRN List</CardTitle>
          <CardDescription>All Goods Receipt Notes for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading GRNs...</div>
          ) : grns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No GRNs created yet. Create a GRN from an issued PO.
            </div>
          ) : (
            <div className="space-y-2">
              {grns.map((grn: GRN) => (
                <div 
                  key={grn.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Truck className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-400">{grn.grn_number}</span>
                        {getStatusBadge(grn.delivery_status)}
                        {grn.po_match_status !== 'matched' && (
                          <Badge variant="destructive" className="text-xs">
                            PO Mismatch
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {grn.purchase_orders?.suppliers?.name || 'Unknown Supplier'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {grn.vehicle_number || 'No vehicle'}
                        </span>
                        <span>
                          PO: {grn.purchase_orders?.po_number}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={`/procurement/grn/${grn.id}`}>
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
