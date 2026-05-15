
import * as React from "react";
import { Stakeholder, STAKEHOLDER_TYPE_LABELS, STAKEHOLDER_STATUS_COLORS } from "@/lib/stakeholderMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Mail, Phone, MoreVertical, Edit2, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStakeholders } from "@/hooks/useStakeholders";
import { StakeholderDialog } from "./StakeholderDialog";

interface StakeholderListProps {
  stakeholders: Stakeholder[];
  onViewDetails: (stakeholder: Stakeholder) => void;
  selectedId?: string;
}

export function StakeholderList({ stakeholders, onViewDetails, selectedId }: StakeholderListProps) {
  const { deleteStakeholder } = useStakeholders();
  const [editing, setEditing] = React.useState<Stakeholder | null>(null);

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[300px]">Organization Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stakeholders.map((s) => (
            <TableRow 
              key={s.id} 
              className={cn(
                "cursor-pointer transition-colors group",
                selectedId === s.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"
              )}
              onClick={() => onViewDetails(s)}
            >
              <TableCell className="font-medium py-3">
                <div className="flex flex-col">
                  <span className={cn("group-hover:text-primary transition-colors", selectedId === s.id && "text-primary font-semibold")}>
                    {s.organization_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                    {s.id.slice(0, 8)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal text-[11px] h-5">
                  {STAKEHOLDER_TYPE_LABELS[s.type] || s.type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {s.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {s.email}
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {s.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={cn("capitalize font-normal text-[10px] py-0 px-1.5 h-4", STAKEHOLDER_STATUS_COLORS[s.status])}>
                  {s.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onViewDetails(s)}
                    title="Quick View"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(s)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this stakeholder?")) {
                            deleteStakeholder.mutate(s.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {stakeholders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                No matching stakeholders found in this category.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <StakeholderDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        stakeholder={editing}
      />
    </div>
  );
}
