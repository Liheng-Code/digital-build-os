import { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, ClipboardCheck, AlertTriangle, CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useInspectionRequests, 
  useNCRs, 
  usePunchListItems 
} from '@/hooks/useQaQc';
import { formatIrStatus, formatNcrStatus, formatPunchListStatus } from '@/lib/qaqcMeta';
import { format } from 'date-fns';
import { RaiseIrDialog } from '@/components/qaqc/RaiseIrDialog';
import { InspectIrDialog } from '@/components/qaqc/InspectIrDialog';
import { ChecklistSetup } from '@/components/qaqc/ChecklistSetup';
import { InspectionRequest, IrStatus } from '@/lib/qaqcMeta';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const IR_SEGMENTS: {
  status: IrStatus;
  label: string;
  color: string;
}[] = [
  { status: 'passed', label: 'Passed', color: 'bg-green-600' },
  { status: 'passed_with_remarks', label: 'Passed w/ Remarks', color: 'bg-green-400' },
  { status: 'requested', label: 'Requested', color: 'bg-blue-500' },
  { status: 'scheduled', label: 'Scheduled', color: 'bg-amber-400' },
  { status: 'failed', label: 'Failed', color: 'bg-destructive' },
  { status: 'draft', label: 'Draft', color: 'bg-muted' },
];

export default function QualityControl() {
  const { activeProject } = useProjects();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedIr, setSelectedIr] = useState<InspectionRequest | null>(null);
  
  const { data: irData, isLoading: irLoading } = useInspectionRequests(activeProject?.id || '');
  const { data: ncrData, isLoading: ncrLoading } = useNCRs(activeProject?.id || '');
  const { data: punchData, isLoading: punchLoading } = usePunchListItems(activeProject?.id || '');

  if (!activeProject) {
    return <div className="p-6">Select a project to view QA/QC data.</div>;
  }

  const failedIRs = irData?.filter(ir => ir.status === 'failed') || [];
  const openNCRs = ncrData?.filter(ncr => ncr.status === 'open' || ncr.status === 'in_progress') || [];
  const openPunch = punchData?.filter(p => p.status === 'open') || [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quality (QA/QC)</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="inspections">Inspection Requests</TabsTrigger>
          <TabsTrigger value="ncrs">NCRs</TabsTrigger>
          <TabsTrigger value="punchlist">Punch List</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{irData?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Inspections</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{failedIRs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open NCRs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openNCRs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Punch Items</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openPunch.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inspection Status Overview</CardTitle>
              <CardDescription>Total distribution of site inspections</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider delayDuration={100}>
                <div className="h-8 w-full rounded-lg overflow-hidden flex bg-muted">
                  {IR_SEGMENTS.map((s) => {
                    const count = irData?.filter(ir => ir.status === s.status).length || 0;
                    if (!count) return null;
                    const pct = (count / (irData?.length || 1)) * 100;
                    return (
                      <Tooltip key={s.status}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn("h-full transition-all", s.color)}
                            style={{ width: `${pct}%` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {s.label}: {count} ({pct.toFixed(0)}%)
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {IR_SEGMENTS.map(s => (
                    <div key={s.status} className="flex items-center gap-1.5">
                      <div className={cn("h-3 w-3 rounded-sm", s.color)} />
                      {s.label}
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Open NCRs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {openNCRs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No open NCRs.</p>
                  ) : (
                    openNCRs.map(ncr => (
                      <div key={ncr.id} className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{ncr.ncr_number}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{ncr.issue_description}</p>
                        </div>
                        <Badge variant="outline">{ncr.severity.toUpperCase()}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Punch Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {openPunch.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No open punch items.</p>
                  ) : (
                    openPunch.slice(0, 5).map(item => (
                      <div key={item.id} className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="text-sm">{item.description}</p>
                          <p className="text-xs text-muted-foreground">{item.location || 'No location'}</p>
                        </div>
                        <Badge variant="secondary">OPEN</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inspection Requests</CardTitle>
                <CardDescription>Manage site inspection requests</CardDescription>
              </div>
              <RaiseIrDialog />
            </CardHeader>
            <CardContent>
              {irLoading ? (
                <div>Loading...</div>
              ) : irData?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No inspection requests found.</div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="h-10 px-4 text-left font-medium">IR Number</th>
                        <th className="h-10 px-4 text-left font-medium">Task</th>
                        <th className="h-10 px-4 text-left font-medium">Date</th>
                        <th className="h-10 px-4 text-left font-medium">Requested By</th>
                        <th className="h-10 px-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {irData?.map((ir) => (
                        <tr 
                          key={ir.id} 
                          className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedIr(ir)}
                        >
                          <td className="p-4 font-medium">{ir.request_number}</td>
                          <td className="p-4">{ir.task?.title || '-'}</td>
                          <td className="p-4">{format(new Date(ir.requested_date), 'MMM d, yyyy')}</td>
                          <td className="p-4">{ir.requested_by_profile?.full_name || '-'}</td>
                          <td className="p-4">
                            <Badge variant={ir.status === 'passed' ? 'default' : ir.status === 'failed' ? 'destructive' : 'secondary'}>
                              {formatIrStatus(ir.status)}
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

        <TabsContent value="ncrs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Non-Conformance Reports</CardTitle>
                <CardDescription>Track critical quality deviations</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New NCR
              </Button>
            </CardHeader>
            <CardContent>
              {ncrLoading ? (
                <div>Loading...</div>
              ) : ncrData?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No NCRs found.</div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="h-10 px-4 text-left font-medium">NCR Number</th>
                        <th className="h-10 px-4 text-left font-medium">Issue</th>
                        <th className="h-10 px-4 text-left font-medium">Severity</th>
                        <th className="h-10 px-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ncrData?.map((ncr) => (
                        <tr key={ncr.id} className="border-b">
                          <td className="p-4 font-medium">{ncr.ncr_number}</td>
                          <td className="p-4 max-w-[200px] truncate">{ncr.issue_description}</td>
                          <td className="p-4">
                            <Badge variant={ncr.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {ncr.severity.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={ncr.status === 'resolved' ? 'default' : 'outline'}>
                              {formatNcrStatus(ncr.status)}
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

        <TabsContent value="punchlist" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Punch List</CardTitle>
                <CardDescription>Minor defects and incomplete works</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {punchLoading ? (
                <div>Loading...</div>
              ) : punchData?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No punch list items found.</div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="h-10 px-4 text-left font-medium">Description</th>
                        <th className="h-10 px-4 text-left font-medium">Task</th>
                        <th className="h-10 px-4 text-left font-medium">Location</th>
                        <th className="h-10 px-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {punchData?.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-4">{item.description}</td>
                          <td className="p-4">{item.task?.title || '-'}</td>
                          <td className="p-4">{item.location || '-'}</td>
                          <td className="p-4">
                            <Badge variant={item.status === 'verified' ? 'default' : 'secondary'}>
                              {formatPunchListStatus(item.status)}
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

        <TabsContent value="templates" className="space-y-4">
          <ChecklistSetup />
        </TabsContent>
      </Tabs>

      {selectedIr && (
        <InspectIrDialog 
          ir={selectedIr} 
          open={!!selectedIr} 
          onOpenChange={(open) => !open && setSelectedIr(null)} 
        />
      )}
    </div>
  );
}
