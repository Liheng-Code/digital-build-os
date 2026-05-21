
import * as React from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStakeholders } from "@/hooks/useStakeholders";
import { STAKEHOLDER_TYPE_LABELS, StakeholderType } from "@/lib/stakeholderMeta";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const stakeholderSchema = z.object({
  organization_name: z.string().trim().min(2, "Company name is required"),
  type: z.enum(["client", "project_manager", "contractor", "architect", "subcontractor", "supplier", "authority", "consultant", "other"]),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

interface StakeholderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StakeholderDialog({ open, onOpenChange }: StakeholderDialogProps) {
  const { createStakeholder } = useStakeholders();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const parsed = stakeholderSchema.safeParse({
      organization_name: fd.get("organization_name"),
      type: fd.get("type"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      address: fd.get("address"),
      notes: fd.get("notes"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setIsSaving(true);
    try {
      await createStakeholder.mutateAsync(parsed.data);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Stakeholder</DialogTitle>
          <DialogDescription>
            Register a new company or organization to the platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="organization_name">Company / Organization Name *</Label>
            <Input 
              id="organization_name" 
              name="organization_name" 
              placeholder="e.g. Skyline Architects Ltd." 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Stakeholder Type *</Label>
            <Select name="type" defaultValue="other">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(STAKEHOLDER_TYPE_LABELS) as [StakeholderType, string][]).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">General Email</Label>
              <Input id="email" name="email" type="email" placeholder="office@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" placeholder="+123..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Office Address</Label>
            <Input id="address" name="address" placeholder="123 Business St, City" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea 
              id="notes" 
              name="notes" 
              placeholder="Key project partner for structural steel..." 
              className="h-20"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Stakeholder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
