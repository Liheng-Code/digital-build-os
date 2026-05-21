
import * as React from "react";
import { Stakeholder, STAKEHOLDER_TYPE_LABELS, STAKEHOLDER_STATUS_COLORS } from "@/lib/stakeholderMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Mail, Phone, MapPin, ExternalLink, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStakeholders } from "@/hooks/useStakeholders";

interface StakeholderListProps {
  stakeholders: Stakeholder[];
  onViewDetails: (stakeholder: Stakeholder) => void;
}

export function StakeholderList({ stakeholders, onViewDetails }: StakeholderListProps) {
  const [search, setSearch] = React.useState("");
  const { deleteStakeholder } = useStakeholders();

  const filtered = stakeholders.filter(s => 
    s.organization_name.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stakeholders by name or type..."
          className="pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Card key={s.id} className="overflow-hidden group hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <Badge variant="outline" className="font-normal">
                    {STAKEHOLDER_TYPE_LABELS[s.type]}
                  </Badge>
                  <CardTitle 
                    className="text-lg leading-tight group-hover:text-primary transition-colors cursor-pointer"
                    onClick={() => onViewDetails(s)}
                  >
                    {s.organization_name}
                  </CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
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
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <Badge className={cn("capitalize font-normal", STAKEHOLDER_STATUS_COLORS[s.status])}>
                  {s.status}
                </Badge>
              </div>

              <div className="space-y-1.5 text-sm">
                {s.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs gap-1.5"
                  onClick={() => onViewDetails(s)}
                >
                  View Details
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
