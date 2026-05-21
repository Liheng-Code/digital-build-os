import { useMaterialIssues } from '@/hooks/useMaterials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Package, Plus } from 'lucide-react';
import { IssueMaterialDialog } from '@/components/materials/IssueMaterialDialog';

export function TaskMaterialsTab({ taskId, projectId }: { taskId: string; projectId: string }) {
  const { data: issues, isLoading } = useMaterialIssues(projectId, taskId);

  if (isLoading) return <div>Loading materials...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <IssueMaterialDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Issued Materials
          </CardTitle>
          <CardDescription>Materials consumed specifically for this task</CardDescription>
        </CardHeader>
        <CardContent>
          {!issues || issues.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No materials issued to this task yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.material_name}</TableCell>
                    <TableCell className="text-right font-bold">
                      {issue.qty_issued} {issue.uom || ''}
                    </TableCell>
                    <TableCell>{issue.issued_by_profile?.full_name || 'System'}</TableCell>
                    <TableCell>{format(new Date(issue.issue_date), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
