import { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ClipboardList, ShoppingCart, Truck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMaterialRequests, useStockBalances } from '@/hooks/useMaterials';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatMrStatus } from '@/lib/materialsMeta';

export default function MaterialsProcurement() {
  const { activeProject } = useProjects();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { data: mrData, isLoading: mrLoading } = useMaterialRequests(activeProject?.id || '');
  const { data: stockData, isLoading: stockLoading } = useStockBalances(activeProject?.id || '');

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
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
            <TabsTrigger value="dashboard" className="flex gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
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
              <span className="hidden sm:inline">Stock Balances</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Procurement Overview</CardTitle>
                <CardDescription>A summary of your project's materials status</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Cost vs Budget comparisons and low stock alerts will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Material Requests</CardTitle>
                  <CardDescription>Track and approve site requests for materials.</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
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
              <CardHeader>
                <CardTitle>Purchase Orders & GRNs</CardTitle>
                <CardDescription>Manage supplier orders and receive deliveries.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Purchase orders and goods received notes go here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Stock Balances</CardTitle>
                <CardDescription>Real-time inventory levels on site.</CardDescription>
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
