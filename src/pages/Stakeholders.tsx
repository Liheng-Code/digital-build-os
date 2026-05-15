
import * as React from "react";
import { useStakeholders } from "@/hooks/useStakeholders";
import { StakeholderList } from "@/components/stakeholders/StakeholderList";
import { StakeholderDialog } from "@/components/stakeholders/StakeholderDialog";
import { StakeholderDetails } from "@/components/stakeholders/StakeholderDetails";
import { StakeholderSidebar } from "@/components/stakeholders/StakeholderSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Stakeholder, StakeholderType } from "@/lib/stakeholderMeta";

export default function Stakeholders() {
  const { stakeholdersQuery } = useStakeholders();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = React.useState<Stakeholder | null>(null);
  const [activeType, setActiveType] = React.useState<StakeholderType | "all">("all");
  const [search, setSearch] = React.useState("");

  const handleViewDetails = (stakeholder: Stakeholder) => {
    setSelectedStakeholder(stakeholder);
  };

  const filtered = (stakeholdersQuery.data || []).filter(s => {
    const matchesType = activeType === "all" || s.type === activeType;
    const matchesSearch = s.organization_name.toLowerCase().includes(search.toLowerCase()) ||
                         s.email?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stakeholders</h1>
          <p className="text-sm text-muted-foreground">
            Manage external project parties, consultants, and suppliers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              className="pl-9 w-64 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="h-9 gap-2">
            <Plus className="h-4 w-4" />
            Add Stakeholder
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden border rounded-xl bg-background shadow-sm">
        {/* Left Panel */}
        <StakeholderSidebar 
          stakeholders={stakeholdersQuery.data || []} 
          activeType={activeType}
          onTypeChange={setActiveType}
        />

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/5">
          {stakeholdersQuery.isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : stakeholdersQuery.data?.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-20">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No stakeholders found</h3>
              <p className="text-muted-foreground mb-6">Start by adding your first project partner.</p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                Add Stakeholder
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4">
              <StakeholderList 
                stakeholders={filtered} 
                onViewDetails={handleViewDetails}
                selectedId={selectedStakeholder?.id}
              />
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        {selectedStakeholder && (
          <div className="w-[450px] border-l bg-card flex flex-col animate-in slide-in-from-right duration-300">
            <StakeholderDetails
              stakeholder={selectedStakeholder}
              open={!!selectedStakeholder}
              onOpenChange={(open) => !open && setSelectedStakeholder(null)}
              mode="panel" // I'll update StakeholderDetails to support panel mode
            />
          </div>
        )}
      </div>

      <StakeholderDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  );
}
