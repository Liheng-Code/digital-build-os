
import { StakeholderList } from "@/components/stakeholders/StakeholderList";
import { StakeholderDialog } from "@/components/stakeholders/StakeholderDialog";
import { StakeholderDetails } from "@/components/stakeholders/StakeholderDetails";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Stakeholder } from "@/lib/stakeholderMeta";

export default function Stakeholders() {
  const { stakeholdersQuery } = useStakeholders();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = React.useState<Stakeholder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const handleViewDetails = (stakeholder: Stakeholder) => {
    setSelectedStakeholder(stakeholder);
    setIsDetailsOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stakeholders</h1>
          <p className="text-muted-foreground">
            Manage external project parties, consultants, and suppliers.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Stakeholder
        </Button>
      </div>

      {stakeholdersQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : stakeholdersQuery.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border border-dashed">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No stakeholders found</h3>
          <p className="text-muted-foreground mb-6">Start by adding your first project partner.</p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            Add Stakeholder
          </Button>
        </div>
      ) : (
        <StakeholderList 
          stakeholders={stakeholdersQuery.data || []} 
          onViewDetails={handleViewDetails}
        />
      )}

      <StakeholderDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />

      <StakeholderDetails
        stakeholder={selectedStakeholder}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
