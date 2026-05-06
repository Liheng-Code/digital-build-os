
import * as React from "react";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { Stakeholder, STAKEHOLDER_TYPE_LABELS, STAKEHOLDER_STATUS_COLORS } from "@/lib/stakeholderMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/sheet-tabs"; // I should check if sheet-tabs exist, or just use standard Tabs
import { useStakeholderContacts, useProjectStakeholders } from "@/hooks/useStakeholders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, MapPin, Building2, UserPlus, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Assuming standard Tabs are available
import { Tabs as RadixTabs, TabsContent as RadixTabsContent, TabsList as RadixTabsList, TabsTrigger as RadixTabsTrigger } from "@/components/ui/tabs";

interface StakeholderDetailsProps {
  stakeholder: Stakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StakeholderDetails({ stakeholder, open, onOpenChange }: StakeholderDetailsProps) {
  if (!stakeholder) return null;

  const { contactsQuery } = useStakeholderContacts(stakeholder.id);
  // Note: for project links, we might want a global hook or filter, but for now we'll just show the UI structure

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4 pr-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal capitalize">
                {STAKEHOLDER_TYPE_LABELS[stakeholder.type]}
              </Badge>
              <Badge className={cn("font-normal capitalize", STAKEHOLDER_STATUS_COLORS[stakeholder.status])}>
                {stakeholder.status}
              </Badge>
            </div>
            <SheetTitle className="text-2xl font-bold">{stakeholder.organization_name}</SheetTitle>
            <SheetDescription className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              ID: {stakeholder.id.slice(0, 8)}...
            </SheetDescription>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</span>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {stakeholder.email || "—"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</span>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {stakeholder.phone || "—"}
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</span>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {stakeholder.address || "No address provided"}
              </div>
            </div>
          </div>
        </SheetHeader>

        <RadixTabs defaultValue="contacts" className="mt-8">
          <RadixTabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
            <RadixTabsTrigger 
              value="contacts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              Contacts
            </RadixTabsTrigger>
            <RadixTabsTrigger 
              value="projects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              Linked Projects
            </RadixTabsTrigger>
            <RadixTabsTrigger 
              value="notes" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              Internal Notes
            </RadixTabsTrigger>
          </RadixTabsList>

          <RadixTabsContent value="contacts" className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Contact Persons</h4>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <UserPlus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {contactsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : contactsQuery.data?.length === 0 ? (
              <div className="py-12 text-center border rounded-lg bg-muted/20 border-dashed">
                <p className="text-sm text-muted-foreground">No contacts registered.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {contactsQuery.data?.map((contact) => (
                  <Card key={contact.id} className={cn(contact.is_primary && "border-primary/50 bg-primary/5")}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{contact.full_name}</span>
                            {contact.is_primary && <Badge variant="secondary" className="text-[10px] h-4">Primary</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{contact.job_title || "No title"}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {contact.email || "—"}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {contact.phone || "—"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </RadixTabsContent>

          <RadixTabsContent value="projects" className="pt-6 space-y-4">
             <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Associated Projects</h4>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <LinkIcon className="h-3.5 w-3.5" />
                Link Project
              </Button>
            </div>
            <div className="py-12 text-center border rounded-lg bg-muted/20 border-dashed">
                <p className="text-sm text-muted-foreground">No project associations found.</p>
            </div>
          </RadixTabsContent>

          <RadixTabsContent value="notes" className="pt-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground italic">
                {stakeholder.notes || "No internal notes added for this stakeholder."}
              </p>
            </div>
          </RadixTabsContent>
        </RadixTabs>

        <div className="mt-12 pt-6 border-t flex justify-between">
           <Button variant="ghost" size="sm" className="text-destructive h-8">
            Delete Stakeholder
          </Button>
          <Button size="sm" className="h-8">
            Edit Profile
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
