import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRFQById, fetchSuppliers, addSupplierToRFQ, removeSupplierFromRFQ, createQuotation, RFQ, Supplier } from "@/services/rfqService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Building2,
  Plus,
  Trash2,
  Mail,
  AlertCircle,
  Scale,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RFQDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);
  const [selectedSupplier, setSelectedSupplier] = React.useState<string>("");
  const [activeQuotationTab, setActiveQuotationTab] = React.useState<"list" | "comparison" | "evaluation">("list");
  
  const { data: availableSuppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => fetchSuppliers(),
    enabled: isAddSupplierOpen,
  });

  const addSupplierMutation = useMutation({
    mutationFn: addSupplierToRFQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
      toast.success("Supplier added to RFQ");
      setIsAddSupplierOpen(false);
      setSelectedSupplier("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add supplier");
    },
  });

  const removeSupplierMutation = useMutation({
    mutationFn: removeSupplierFromRFQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
      toast.success("Supplier removed from RFQ");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove supplier");
    },
  });

  const handleIssueRFQ = async () => {
    if (!rfq) return;
    try {
      const { error } = await supabase
        .from("rfq")
        .update({ status: 'issued', issue_date: new Date().toISOString().split('T')[0] })
        .eq("id", rfq.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
      toast.success("RFQ issued to suppliers");
    } catch (error: any) {
      toast.error(error.message || "Failed to issue RFQ");
    }
  };

  const handleCloseRFQ = async () => {
    if (!rfq) return;
    try {
      const { error } = await supabase
        .from("rfq")
        .update({ status: 'closed' })
        .eq("id", rfq.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
      toast.success("RFQ closed");
    } catch (error: any) {
      toast.error(error.message || "Failed to close RFQ");
    }
  };

  const handleAddSupplier = () => {
    if (!selectedSupplier || !rfq) return;
    addSupplierMutation.mutate({
      rfq_id: rfq.id,
      supplier_id: selectedSupplier,
    });
  };

  const handleRemoveSupplier = (rfqSupplierId: string) => {
    if (!confirm("Remove this supplier from the RFQ?")) return;
    removeSupplierMutation.mutate(rfqSupplierId);
  };

  const handleUpdateCompliance = async (itemId: string, compliance: string) => {
    try {
      const { error } = await supabase
        .from("quotation_items")
        .update({ technical_compliance: compliance })
        .eq("id", itemId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
      toast.success("Technical compliance updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update compliance");
    }
  };

  const handleQuotationStatus = async (quotationId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from("supplier_quotations")
        .update({ status })
        .eq("id", quotationId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
      toast.success(`Quotation ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update quotation status");
    }
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

  const getResponseStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-600">Pending</Badge>;
      case 'responded':
        return <Badge className="bg-green-600">Responded</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading RFQ...</div>;
  }

  if (error || !rfq) {
    return <div className="p-8 text-red-500">Failed to load RFQ</div>;
  }

  const isDraft = rfq.status === 'draft';
  const isIssued = rfq.status === 'issued';
  const isClosed = rfq.status === 'closed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/procurement/rfqs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{rfq.rfq_number}</h1>
              {getStatusBadge(rfq.status)}
            </div>
            <p className="text-muted-foreground">
              Request for Quotation
              {rfq.purchase_requisitions && (
                <span> · PR: {rfq.purchase_requisitions.pr_number}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <Button onClick={handleIssueRFQ} className="gap-2">
              <Send className="h-4 w-4" /> Issue RFQ
            </Button>
          )}
          {isIssued && (
            <Button onClick={handleCloseRFQ} variant="outline" className="gap-2">
              <CheckCircle className="h-4 w-4" /> Close RFQ
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Issue Date</span>
            </div>
            <p className="text-lg font-semibold">
              {rfq.issue_date ? format(new Date(rfq.issue_date), 'dd MMM yyyy') : 'Not issued yet'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Due Date</span>
            </div>
            <p className="text-lg font-semibold">
              {format(new Date(rfq.due_date), 'dd MMM yyyy')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Suppliers</span>
            </div>
            <p className="text-lg font-semibold">
              {rfq.rfq_suppliers?.length || 0} invited
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invited Suppliers</CardTitle>
              <CardDescription>Suppliers invited to quote</CardDescription>
            </div>
            {isDraft && (
              <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Supplier to RFQ</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Supplier</Label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSuppliers
                            .filter((s: Supplier) => 
                              !rfq.rfq_suppliers?.some((rs: any) => rs.supplier_id === s.id)
                            )
                            .map((supplier: Supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                                {supplier.contact_person && (
                                  <span className="text-muted-foreground ml-2">
                                    ({supplier.contact_person})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddSupplierOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddSupplier}
                        disabled={!selectedSupplier || addSupplierMutation.isPending}
                      >
                        {addSupplierMutation.isPending ? "Adding..." : "Add Supplier"}
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!rfq.rfq_suppliers || rfq.rfq_suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers invited yet.
              {isDraft && " Click 'Add Supplier' to invite suppliers."}
            </div>
          ) : (
            <div className="space-y-2">
              {rfq.rfq_suppliers.map((rfqSupplier: any) => (
                <div 
                  key={rfqSupplier.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{rfqSupplier.suppliers?.name || 'Unknown'}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {rfqSupplier.suppliers?.contact_person && (
                          <span>{rfqSupplier.suppliers.contact_person}</span>
                        )}
                        {rfqSupplier.suppliers?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {rfqSupplier.suppliers.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getResponseStatusBadge(rfqSupplier.response_status)}
                    {isDraft && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSupplier(rfqSupplier.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supplier Quotations</CardTitle>
              <CardDescription>Quotations received from suppliers</CardDescription>
            </div>
            {rfq.supplier_quotations && rfq.supplier_quotations.length > 1 && (
              <Tabs value={activeQuotationTab} onValueChange={(v) => setActiveQuotationTab(v as "list" | "comparison" | "evaluation")}>
                <TabsList>
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="comparison" className="gap-2">
                    <Scale className="h-4 w-4" /> Comparison
                  </TabsTrigger>
                  <TabsTrigger value="evaluation" className="gap-2">
                    <CheckCircle className="h-4 w-4" /> Evaluation
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!rfq.supplier_quotations || rfq.supplier_quotations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              No quotations received yet.
              {isIssued && " Suppliers will submit quotations before the due date."}
            </div>
          ) : activeQuotationTab === "comparison" && rfq.supplier_quotations.length > 1 ? (
            /* Comparison View */
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Criteria</th>
                      {rfq.supplier_quotations.map((q: any) => (
                        <th key={q.id} className="text-left p-2 font-medium min-w-[200px]">
                          <div className="font-semibold">{q.suppliers?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{q.quotation_number || 'No #'}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Total Amount</td>
                      {rfq.supplier_quotations.map((q: any) => (
                        <td key={q.id} className="p-2">
                          <span className="text-lg font-bold">${q.total_amount?.toLocaleString() || 0}</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Status</td>
                      {rfq.supplier_quotations.map((q: any) => (
                        <td key={q.id} className="p-2">
                          <Badge variant={q.status === 'approved' ? 'default' : q.status === 'rejected' ? 'destructive' : 'outline'}>
                            {q.status}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Quotation Date</td>
                      {rfq.supplier_quotations.map((q: any) => (
                        <td key={q.id} className="p-2 text-sm">
                          {format(new Date(q.quotation_date), 'dd MMM yyyy')}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Technical Compliance</td>
                      {rfq.supplier_quotations.map((q: any) => (
                        <td key={q.id} className="p-2 text-sm">
                          {q.quotation_items?.every((item: any) => item.technical_compliance === 'compliant') ? (
                            <span className="text-green-600">✓ Fully Compliant</span>
                          ) : q.quotation_items?.some((item: any) => item.technical_compliance === 'non-compliant') ? (
                            <span className="text-red-600">✗ Non-Compliant</span>
                          ) : (
                            <span className="text-yellow-600">~ Partially Compliant</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-muted/20">
                      <td className="p-2 font-bold">Best Value</td>
                      {rfq.supplier_quotations.map((q: any, idx: number) => {
                        const lowest = Math.min(...rfq.supplier_quotations.map((sq: any) => sq.total_amount || 0));
                        return (
                          <td key={q.id} className="p-2">
                            {q.total_amount === lowest && (
                              <Badge className="bg-green-600 gap-1">
                                <TrendingUp className="h-3 w-3" /> Best Price
                              </Badge>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Item-by-Item Comparison */}
              {rfq.supplier_quotations[0]?.quotation_items && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Item Comparison</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-2">Item</th>
                          {rfq.supplier_quotations.map((q: any) => (
                            <th key={q.id} className="text-left p-2">{q.suppliers?.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rfq.supplier_quotations[0].quotation_items.map((item: any, idx: number) => (
                          <tr key={item.id} className="border-b">
                            <td className="p-2">{item.item_description}</td>
                            {rfq.supplier_quotations.map((q: any) => {
                              const qItem = q.quotation_items?.[idx];
                              return (
                                <td key={q.id} className="p-2">
                                  {qItem ? `${qItem.quantity} × $${qItem.unit_price} = $${qItem.total_price?.toLocaleString()}` : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeQuotationTab === "evaluation" ? (
            /* Evaluation View */
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {rfq.supplier_quotations.map((quotation: any) => (
                  <Card key={quotation.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{quotation.suppliers?.name}</CardTitle>
                        <Badge variant={quotation.status === 'approved' ? 'default' : 'outline'}>
                          {quotation.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Quote: {quotation.quotation_number || 'N/A'} · Total: ${quotation.total_amount?.toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Technical Evaluation */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Technical Evaluation
                        </h4>
                        <div className="space-y-2">
                          {quotation.quotation_items?.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{item.item_description}</span>
                              <Select 
                                value={item.technical_compliance || ''} 
                                onValueChange={(v) => handleUpdateCompliance(item.id, v)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="compliant">✓ Compliant</SelectItem>
                                  <SelectItem value="partial">~ Partial</SelectItem>
                                  <SelectItem value="non-compliant">✗ Non-Compliant</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Commercial Summary */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" /> Commercial Summary
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Amount:</span>
                            <span className="font-medium">${quotation.total_amount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery Terms:</span>
                            <span className="font-medium">{quotation.delivery_terms || 'Standard'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Terms:</span>
                            <span className="font-medium">{quotation.payment_terms || 'Net 30'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          size="sm" 
                          variant={quotation.status === 'approved' ? 'default' : 'outline'}
                          onClick={() => handleQuotationStatus(quotation.id, 'approved')}
                          disabled={quotation.status === 'approved'}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant={quotation.status === 'rejected' ? 'destructive' : 'outline'}
                          onClick={() => handleQuotationStatus(quotation.id, 'rejected')}
                          disabled={quotation.status === 'rejected'}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Overall Recommendation */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommendation</CardTitle>
                  <CardDescription>Based on technical & commercial evaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  {rfq.supplier_quotations.length > 0 && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="font-semibold mb-2">Recommended Supplier:</p>
                        {(() => {
                          const best = rfq.supplier_quotations.reduce((prev: any, curr: any) => 
                            (curr.total_amount || 999999) < (prev.total_amount || 999999) ? curr : prev
                          );
                          const isFullyCompliant = best.quotation_items?.every((item: any) => 
                            item.technical_compliance === 'compliant'
                          );
                          return (
                            <div>
                              <p className="text-lg font-bold text-green-600">
                                {best.suppliers?.name} - ${best.total_amount?.toLocaleString()}
                              </p>
                              {isFullyCompliant ? (
                                <p className="text-sm text-green-600 mt-1">✓ Fully compliant with technical requirements</p>
                              ) : (
                                <p className="text-sm text-yellow-600 mt-1">~ Some items may need review</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (            <div className="space-y-4">
              {rfq.supplier_quotations.map((quotation: any) => (
                <div 
                  key={quotation.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{quotation.suppliers?.name || 'Unknown Supplier'}</p>
                      <p className="text-sm text-muted-foreground">
                        {quotation.quotation_number && <span>Quote #: {quotation.quotation_number} · </span>}
                        Date: {format(new Date(quotation.quotation_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${quotation.total_amount?.toLocaleString() || 0}</p>
                      <Badge 
                        variant={
                          quotation.status === 'approved' ? 'default' :
                          quotation.status === 'rejected' ? 'destructive' : 'outline'
                        }
                      >
                        {quotation.status}
                      </Badge>
                    </div>
                  </div>
                  {quotation.quotation_items && quotation.quotation_items.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Items:</p>
                      <div className="space-y-1">
                        {quotation.quotation_items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.item_description}</span>
                            <span>{item.quantity} × ${item.unit_price} = ${item.total_price?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
