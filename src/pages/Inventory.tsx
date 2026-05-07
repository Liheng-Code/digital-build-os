import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useInventoryItems, 
  useStockReceipts, 
  useMaterialRequests, 
  useStockIssues, 
  useStockTransfers, 
  useStockAdjustments, 
  useStockBalances,
  useInventoryDashboard,
  useUpdateMaterialRequestStatus,
  useUpdateStockReceiptStatus,
  useUpdateStockIssueStatus,
  useUpdateStockTransferStatus,
} from "@/hooks/useInventory";
import { 
  INVENTORY_ITEM_CATEGORY_LABELS,
  INVENTORY_ITEM_CATEGORY_TONE,
  MATERIAL_REQUEST_STATUS_LABELS,
  MATERIAL_REQUEST_STATUS_TONE,
  STOCK_RECEIPT_STATUS_LABELS,
  STOCK_RECEIPT_STATUS_TONE,
  STOCK_ISSUE_STATUS_LABELS,
  STOCK_ISSUE_STATUS_TONE,
  STOCK_TRANSFER_STATUS_LABELS,
  STOCK_TRANSFER_STATUS_TONE,
  STOCK_FLOW_STEPS,
  type MaterialRequestStatus,
  type StockReceiptStatus,
  type StockIssueStatus,
  type StockTransferStatus,
  type InventoryItemCategory,
} from "@/lib/inventoryMeta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight,
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2,
  ClipboardCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Wrench,
  FileText,
  BarChart3,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// KPI Card Component
function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: any; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2 rounded-md", tone || "bg-primary/10")}>
          <Icon className={cn("h-5 w-5", tone ? "text-white" : "text-primary")} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Status Badge Components
function ReceiptStatusBadge({ status }: { status: StockReceiptStatus }) {
  const tone = STOCK_RECEIPT_STATUS_TONE[status];
  const label = STOCK_RECEIPT_STATUS_LABELS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tone.bg, tone.fg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {label}
    </span>
  );
}

function IssueStatusBadge({ status }: { status: StockIssueStatus }) {
  const tone = STOCK_ISSUE_STATUS_TONE[status];
  const label = STOCK_ISSUE_STATUS_LABELS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tone.bg, tone.fg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {label}
    </span>
  );
}

function TransferStatusBadge({ status }: { status: StockTransferStatus }) {
  const tone = STOCK_TRANSFER_STATUS_TONE[status];
  const label = STOCK_TRANSFER_STATUS_LABELS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tone.bg, tone.fg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {label}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: MaterialRequestStatus }) {
  const tone = MATERIAL_REQUEST_STATUS_TONE[status];
  const label = MATERIAL_REQUEST_STATUS_LABELS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tone.bg, tone.fg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: InventoryItemCategory }) {
  const tone = INVENTORY_ITEM_CATEGORY_TONE[category];
  const label = INVENTORY_ITEM_CATEGORY_LABELS[category];
  return (
    <Badge className={cn("text-xs", tone)}>
      {label}
    </Badge>
  );
}

export default function Inventory() {
  const { activeProject } = useProjects();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  
  // Dialog states
  const [isCreateItemOpen, setIsCreateItemOpen] = React.useState(false);
  const [isCreateReceiptOpen, setIsCreateReceiptOpen] = React.useState(false);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = React.useState(false);
  const [isCreateTransferOpen, setIsCreateTransferOpen] = React.useState(false);
  const [isCreateAdjustmentOpen, setIsCreateAdjustmentOpen] = React.useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = React.useState(false);

  // Data queries
  const { data: items = [], isLoading: itemsLoading } = useInventoryItems(activeProject?.id, {
    category: categoryFilter !== "all" ? categoryFilter as InventoryItemCategory : undefined,
    search: search || undefined,
  });
  
  const { data: receipts = [], isLoading: receiptsLoading } = useStockReceipts(activeProject?.id, {
    status: statusFilter !== "all" ? statusFilter as StockReceiptStatus : undefined,
  });
  
  const { data: requests = [], isLoading: requestsLoading } = useMaterialRequests(activeProject?.id, {
    status: statusFilter !== "all" ? statusFilter as MaterialRequestStatus : undefined,
  });
  
  const { data: issues = [], isLoading: issuesLoading } = useStockIssues(activeProject?.id, {
    status: statusFilter !== "all" ? statusFilter as StockIssueStatus : undefined,
  });
  
  const { data: transfers = [], isLoading: transfersLoading } = useStockTransfers(activeProject?.id, {
    status: statusFilter !== "all" ? statusFilter as StockTransferStatus : undefined,
  });
  
  const { data: adjustments = [], isLoading: adjustmentsLoading } = useStockAdjustments(activeProject?.id);
  const { data: balances = [], isLoading: balancesLoading } = useStockBalances(activeProject?.id);
  const { data: dash, isLoading: dashLoading } = useInventoryDashboard(activeProject?.id);

  const canCreate = hasRole("admin") || hasRole("project_manager") || hasRole("engineer") || hasRole("supervisor");
  const canApprove = hasRole("admin") || hasRole("project_manager") || hasRole("supervisor");

  // Mutations
  const updateRequestStatus = useUpdateMaterialRequestStatus();
  const updateReceiptStatus = useUpdateStockReceiptStatus();
  const updateIssueStatus = useUpdateStockIssueStatus();
  const updateTransferStatus = useUpdateStockTransferStatus();

  // Create Item Form State
  const [newItem, setNewItem] = React.useState({
    code: "",
    name: "",
    description: "",
    category: "raw_material" as InventoryItemCategory,
    unit_of_measure: "",
    reorder_level: "0",
    max_stock_level: "",
    storage_location: "",
  });

  const handleCreateItem = async () => {
    if (!activeProject || !user || !newItem.code || !newItem.name || !newItem.unit_of_measure) return;
    
    const { error } = await (supabase as any)
      .from("inventory_items")
      .insert({
        code: newItem.code,
        name: newItem.name,
        description: newItem.description || null,
        category: newItem.category,
        unit_of_measure: newItem.unit_of_measure,
        reorder_level: parseFloat(newItem.reorder_level) || 0,
        max_stock_level: newItem.max_stock_level ? parseFloat(newItem.max_stock_level) : null,
        storage_location: newItem.storage_location || null,
        is_active: true,
      });
    
    if (error) {
      toast.error("Failed to create item: " + error.message);
    } else {
      toast.success("Inventory item created successfully");
      setIsCreateItemOpen(false);
      setNewItem({
        code: "",
        name: "",
        description: "",
        category: "raw_material",
        unit_of_measure: "",
        reorder_level: "0",
        max_stock_level: "",
        storage_location: "",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory / Stock</h1>
          <p className="text-muted-foreground">Manage materials, tools, equipment and stock transactions</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Receipts
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Issues
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Transfers
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Adjustments
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requests
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {dashLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard label="Total Items" value={dash?.totalItems || 0} icon={Package} tone="bg-blue-500" />
                <KpiCard label="Pending Receipts" value={dash?.pendingReceipts || 0} icon={ArrowDownToLine} tone="bg-yellow-500" />
                <KpiCard label="Pending Issues" value={dash?.pendingIssues || 0} icon={ArrowUpFromLine} tone="bg-orange-500" />
                <KpiCard label="Pending Transfers" value={dash?.pendingTransfers || 0} icon={ArrowLeftRight} tone="bg-purple-500" />
              </div>

              {/* Stock Flow Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Flow</CardTitle>
                  <CardDescription>PO approved → Receipt → Inspection → Stock Increases → Issue → Consumption links to WBS</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 overflow-x-auto pb-4">
                    {STOCK_FLOW_STEPS.map((step, idx) => (
                      <React.Fragment key={step.step}>
                        <div className="flex flex-col items-center gap-2 min-w-[120px]">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {step.step}
                          </div>
                          <p className="text-xs font-medium text-center">{step.label}</p>
                          <p className="text-xs text-muted-foreground">{step.module}</p>
                        </div>
                        {idx < STOCK_FLOW_STEPS.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stock Balances Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Stock Balances</CardTitle>
                  <CardDescription>Real-time inventory levels across all items</CardDescription>
                </CardHeader>
                <CardContent>
                  {balancesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Code</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>UOM</TableHead>
                          <TableHead className="text-right">Receipts</TableHead>
                          <TableHead className="text-right">Issues</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balances.slice(0, 10).map((balance: any) => (
                          <TableRow key={balance.inventory_item_id}>
                            <TableCell className="font-medium">{balance.item_code}</TableCell>
                            <TableCell>{balance.item_name}</TableCell>
                            <TableCell>{balance.unit_of_measure}</TableCell>
                            <TableCell className="text-right">
                              <span className="text-green-600">{balance.total_receipts || 0}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-red-600">{balance.total_issues || 0}</span>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {balance.current_balance || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(INVENTORY_ITEM_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canCreate && (
              <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Inventory Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Item Code *</Label>
                        <Input 
                          value={newItem.code} 
                          onChange={(e) => setNewItem({...newItem, code: e.target.value})}
                          placeholder="e.g., CEM-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select 
                          value={newItem.category} 
                          onValueChange={(v) => setNewItem({...newItem, category: v as InventoryItemCategory})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(INVENTORY_ITEM_CATEGORY_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Item Name *</Label>
                      <Input 
                        value={newItem.name} 
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        placeholder="e.g., Portland Cement"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={newItem.description} 
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        placeholder="Item description..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Unit of Measure *</Label>
                        <Input 
                          value={newItem.unit_of_measure} 
                          onChange={(e) => setNewItem({...newItem, unit_of_measure: e.target.value})}
                          placeholder="e.g., kg, pcs, m"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Storage Location</Label>
                        <Input 
                          value={newItem.storage_location} 
                          onChange={(e) => setNewItem({...newItem, storage_location: e.target.value})}
                          placeholder="e.g., Warehouse A"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Reorder Level</Label>
                        <Input 
                          type="number"
                          value={newItem.reorder_level} 
                          onChange={(e) => setNewItem({...newItem, reorder_level: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Stock Level</Label>
                        <Input 
                          type="number"
                          value={newItem.max_stock_level} 
                          onChange={(e) => setNewItem({...newItem, max_stock_level: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateItemOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateItem}>Create Item</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {itemsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                  <TableHead>Storage Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell><CategoryBadge category={item.category} /></TableCell>
                    <TableCell>{item.unit_of_measure}</TableCell>
                    <TableCell className="text-right">{item.reorder_level}</TableCell>
                    <TableCell>{item.storage_location || "-"}</TableCell>
                    <TableCell>
                      <Badge className={item.is_active ? "bg-success-soft text-success" : "bg-muted"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STOCK_RECEIPT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canCreate && (
              <Button onClick={() => setIsCreateReceiptOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Receipt
              </Button>
            )}
          </div>

          {receiptsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>PO/GRN</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt: any) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                    <TableCell>{receipt.receipt_date ? format(new Date(receipt.receipt_date), "PP") : "-"}</TableCell>
                    <TableCell>{receipt.po_number || receipt.grn_number || "-"}</TableCell>
                    <TableCell>{receipt.supplier_name || "-"}</TableCell>
                    <TableCell><ReceiptStatusBadge status={receipt.status} /></TableCell>
                    <TableCell>
                      {canApprove && receipt.status === 'pending_inspection' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateReceiptStatus.mutate({
                            receiptId: receipt.id,
                            status: 'inspected',
                            inspectedBy: user?.id,
                          })}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark Inspected
                        </Button>
                      )}
                      {canApprove && receipt.status === 'inspected' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateReceiptStatus.mutate({
                            receiptId: receipt.id,
                            status: 'accepted',
                            acceptedBy: user?.id,
                          })}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STOCK_ISSUE_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canCreate && (
              <Button onClick={() => setIsCreateIssueOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Issue
              </Button>
            )}
          </div>

          {issuesLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Issued To</TableHead>
                  <TableHead>Request #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue: any) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.issue_number}</TableCell>
                    <TableCell>{issue.issue_date ? format(new Date(issue.issue_date), "PP") : "-"}</TableCell>
                    <TableCell>{issue.issued_to}</TableCell>
                    <TableCell>{issue.request_number || "-"}</TableCell>
                    <TableCell><IssueStatusBadge status={issue.status} /></TableCell>
                    <TableCell>
                      {canApprove && issue.status === 'pending_approval' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateIssueStatus.mutate({
                            issueId: issue.id,
                            status: 'approved',
                            approvedBy: user?.id,
                          })}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}
                      {canApprove && issue.status === 'approved' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateIssueStatus.mutate({
                            issueId: issue.id,
                            status: 'issued',
                            issuedBy: user?.id,
                          })}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark Issued
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STOCK_TRANSFER_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canCreate && (
              <Button onClick={() => setIsCreateTransferOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Transfer
              </Button>
            )}
          </div>

          {transfersLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer: any) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">{transfer.transfer_number}</TableCell>
                    <TableCell>{transfer.transfer_date ? format(new Date(transfer.transfer_date), "PP") : "-"}</TableCell>
                    <TableCell>{transfer.from_storage_location}</TableCell>
                    <TableCell>{transfer.to_storage_location}</TableCell>
                    <TableCell><TransferStatusBadge status={transfer.status} /></TableCell>
                    <TableCell>
                      {canApprove && transfer.status === 'pending_approval' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateTransferStatus.mutate({
                            transferId: transfer.id,
                            status: 'approved',
                            approvedBy: user?.id,
                          })}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Adjustments Tab */}
        <TabsContent value="adjustments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            {canCreate && (
              <Button onClick={() => setIsCreateAdjustmentOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Adjustment
              </Button>
            )}
          </div>

          {adjustmentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adjustment #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>WBS Node</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj: any) => (
                  <TableRow key={adj.id}>
                    <TableCell className="font-medium">{adj.adjustment_number}</TableCell>
                    <TableCell>{adj.adjustment_date ? format(new Date(adj.adjustment_date), "PP") : "-"}</TableCell>
                    <TableCell>
                      <Badge className={adj.adjustment_type === 'add' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {adj.adjustment_type === 'add' ? 'Add' : 'Subtract'}
                      </Badge>
                    </TableCell>
                    <TableCell>{adj.reason}</TableCell>
                    <TableCell>{adj.wbs_node_id || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Material Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(MATERIAL_REQUEST_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canCreate && (
              <Button onClick={() => setIsCreateRequestOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            )}
          </div>

          {requestsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Required By</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req: any) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.request_number}</TableCell>
                    <TableCell>{req.request_date ? format(new Date(req.request_date), "PP") : "-"}</TableCell>
                    <TableCell>{req.required_by_date ? format(new Date(req.required_by_date), "PP") : "-"}</TableCell>
                    <TableCell>{req.requested_by_name || "-"}</TableCell>
                    <TableCell><RequestStatusBadge status={req.status} /></TableCell>
                    <TableCell>
                      {canApprove && req.status === 'pending_approval' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateRequestStatus.mutate({
                            requestId: req.id,
                            status: 'approved',
                          })}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Receipt Dialog */}
      <Dialog open={isCreateReceiptOpen} onOpenChange={setIsCreateReceiptOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Stock Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Stock receipts are created when materials are delivered from a PO/GRN. 
              Link to PO or GRN to auto-populate items.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Receipt Date *</Label>
                <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
              </div>
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input placeholder="Supplier name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PO Number (Optional)</Label>
                <Input placeholder="Link to PO" />
              </div>
              <div className="space-y-2">
                <Label>GRN Number (Optional)</Label>
                <Input placeholder="Link to GRN" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delivery Note Number</Label>
              <Input placeholder="Delivery note #" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateReceiptOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success("Receipt creation - full form coming soon");
              setIsCreateReceiptOpen(false);
            }}>Create Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Issue Dialog */}
      <Dialog open={isCreateIssueOpen} onOpenChange={setIsCreateIssueOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Stock Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Stock issues are created when materials are issued to site/WBS node.
              Link to Material Request if available.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
              </div>
              <div className="space-y-2">
                <Label>Issued To *</Label>
                <Input placeholder="Site location or person" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Material Request (Optional)</Label>
              <Input placeholder="Link to material request" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateIssueOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success("Issue creation - full form coming soon");
              setIsCreateIssueOpen(false);
            }}>Create Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Transfer Dialog */}
      <Dialog open={isCreateTransferOpen} onOpenChange={setIsCreateTransferOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Stock Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Stock transfers move inventory between storage locations or WBS nodes.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transfer Date *</Label>
                <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Location *</Label>
                <Input placeholder="Source location" />
              </div>
              <div className="space-y-2">
                <Label>To Location *</Label>
                <Input placeholder="Destination location" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTransferOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success("Transfer creation - full form coming soon");
              setIsCreateTransferOpen(false);
            }}>Create Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Adjustment Dialog */}
      <Dialog open={isCreateAdjustmentOpen} onOpenChange={setIsCreateAdjustmentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Stock Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Stock adjustments are used to correct inventory counts (add or subtract stock).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adjustment Date *</Label>
                <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select defaultValue="add">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock</SelectItem>
                    <SelectItem value="subtract">Subtract Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea placeholder="Reason for adjustment..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateAdjustmentOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success("Adjustment creation - full form coming soon");
              setIsCreateAdjustmentOpen(false);
            }}>Create Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Material Request Dialog */}
      <Dialog open={isCreateRequestOpen} onOpenChange={setIsCreateRequestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Material Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Material requests are created by site teams to request materials from the store.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Request Date *</Label>
                <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
              </div>
              <div className="space-y-2">
                <Label>Required By Date *</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>WBS Node</Label>
              <Input placeholder="Link to WBS node" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateRequestOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success("Material request - full form coming soon");
              setIsCreateRequestOpen(false);
            }}>Create Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
