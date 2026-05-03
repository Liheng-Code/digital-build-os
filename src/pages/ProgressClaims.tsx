import { useState } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useProgressClaims } from '@/hooks/useFinancials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { CLAIM_STATUS_COLORS } from '@/lib/financialMeta';
import { CreateClaimDialog } from '@/components/financials/CreateClaimDialog';

export default function ProgressClaims() {
  const { activeProject } = useProjects();
  const { data: claims, isLoading } = useProgressClaims(activeProject?.id || '');

  if (!activeProject) return <div className="p-6">Select a project.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Claims</h1>
          <p className="text-muted-foreground">Manage project valuations and billing cycles</p>
        </div>
        <CreateClaimDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Valuation History</CardTitle>
          <CardDescription>Cumulative progress claims for {activeProject.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading claims...</div>
          ) : !claims || claims.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No progress claims found.</p>
              <Button variant="link" className="mt-2">Create your first claim</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim No</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Claimed Amount</TableHead>
                  <TableHead className="text-right">Certified Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.claim_number}</TableCell>
                    <TableCell>
                      {format(new Date(claim.period_start), 'MMM d')} - {format(new Date(claim.period_end), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={CLAIM_STATUS_COLORS[claim.status]}>
                        {claim.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${claim.total_amount_claimed.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {claim.total_amount_certified ? `$${claim.total_amount_certified.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
