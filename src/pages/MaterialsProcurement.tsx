import { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ClipboardList, ShoppingCart, Truck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMaterialRequests, useStockBalances, usePurchaseOrders } from '@/hooks/useMaterials';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatMrStatus, formatPoStatus } from '@/lib/materialsMeta';
import { CreateMrDialog } from '@/components/materials/CreateMrDialog';
import { IssueMaterialDialog } from '@/components/materials/IssueMaterialDialog';
import { BoqManager } from '@/components/materials/BoqManager';
import { CreatePoDialog } from '@/components/materials/CreatePoDialog';
import { CreateGrnDialog } from '@/components/materials/CreateGrnDialog';
import { BookOpen } from 'lucide-react';

export default function MaterialsProcurement() {
  const { activeProject } = useProjects();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { data: mrData, isLoading: mrLoading } = useMaterialRequests(activeProject?.id || '');
  const { data: stockData, isLoading: stockLoading } = useStockBalances(activeProject?.id || '');
  const { data: poData, isLoading: poLoading } = usePurchaseOrders(activeProject?.id || '');

  if (!activeProject) {
    return <div className="p-6">Select a project to view materials.</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Materials & Procurement</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage BOQ, requests, orders, and stock</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl mb-6">
            <TabsTrigger value="dashboard" className="flex gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="boq" className="flex gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">BOQ</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Purchase Orders</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Stock</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${stockData?.reduce((acc, item) => acc + (item.qty_on_hand * item.avg_unit_cost), 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mrData?.filter(mr => mr.status === 'requested' || mr.status === 'pending_approval').length || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {stockData?.filter(item => item.qty_on_hand < 10).length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest movements in procurement and stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mrData?.slice(0, 5).map(mr => (
                    <div key={mr.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{mr.request_number}</p>
                        <p className="text-xs text-muted-foreground">{mr.items?.length} items requested on {format(new Date(mr.request_date), 'MMM d')}</p>
                      </div>
                      <Badge variant="outline">{mr.status.toUpperCase()}</Badge>
                    </div>
                  ))}
                  {(!mrData || mrData.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">No recent activity.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boq" className="mt-0">
            <BoqManager />
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Material Requests</CardTitle>
                  <CardDescription>Track and approve site requests for materials.</CardDescription>
                </div>
                <CreateMrDialog />
              </CardHeader>
              <CardContent>
                {mrLoading ? (
                  <p className="text-sm text-muted-foreground">Loading requests...</p>
                ) : !mrData || mrData.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No material requests found.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                          <th className="p-3 font-medium">Request No</th>
                          <th className="p-3 font-medium">Date</th>
                          <th className="p-3 font-medium">Requested By</th>
                          <th className="p-3 font-medium">Required Date</th>
                          <th className="p-3 font-medium">Items</th>
                          <th className="p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mrData.map((mr) => (
                          <tr key={mr.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="p-3 font-medium">{mr.request_number}</td>
                            <td className="p-3">{format(new Date(mr.request_date), 'MMM d, yyyy')}</td>
                            <td className="p-3">{mr.requested_by_profile?.full_name || 'Unknown'}</td>
                            <td className="p-3">{format(new Date(mr.required_date), 'MMM d, yyyy')}</td>
                            <td className="p-3">{mr.items?.length || 0}</td>
                            <td className="p-3">
                              <Badge variant={mr.status === 'approved' ? 'default' : mr.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {formatMrStatus(mr.status)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Purchase Orders & GRNs</CardTitle>
                  <CardDescription>Manage supplier orders and receive deliveries.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <CreateGrnDialog />
                  <CreatePoDialog />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                      <tr>
                        <th className="p-3">PO Number</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {poLoading ? (
                        <tr><td colSpan={5} className="p-3 text-center">Loading POs...</td></tr>
                      ) : !poData || poData.length === 0 ? (
                        <tr className="hover:bg-muted/30">
                          <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                            No purchase orders found. Create a PO from an approved MR to start.
                          </td>
                        </tr>
                      ) : (
                        poData.map(po => (
                          <tr key={po.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-3 font-medium">{po.po_number}</td>
                            <td className="p-3">{po.supplier_name}</td>
                            <td className="p-3">{format(new Date(po.po_date), 'MMM d, yyyy')}</td>
                            <td className="p-3">
                              <Badge variant={po.status === 'completed' ? 'default' : 'secondary'}>
                                {formatPoStatus(po.status)}
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-medium">${po.total_amount.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Stock Balances</CardTitle>
                  <CardDescription>Real-time inventory levels on site.</CardDescription>
                </div>
                <IssueMaterialDialog />
              </CardHeader>
              <CardContent>
                {stockLoading ? (
                  <p className="text-sm text-muted-foreground">Loading stock...</p>
                ) : !stockData || stockData.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No stock available.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                          <th className="p-3 font-medium">Material Name</th>
                          <th className="p-3 font-medium">UOM</th>
                          <th className="p-3 font-medium text-right">Qty On Hand</th>
                          <th className="p-3 font-medium text-right">Avg Unit Cost</th>
                          <th className="p-3 font-medium text-right">Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockData.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="p-3 font-medium">{item.material_name}</td>
                            <td className="p-3">{item.uom}</td>
                            <td className="p-3 text-right font-medium">{item.qty_on_hand.toLocaleString()}</td>
                            <td className="p-3 text-right">${item.avg_unit_cost.toLocaleString()}</td>
                            <td className="p-3 text-right">${(item.qty_on_hand * item.avg_unit_cost).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
