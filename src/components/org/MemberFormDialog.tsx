import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  OrgMemberRow, OrgDepartmentRow,
  updateMemberProfile, uploadMemberAvatar,
} from "@/services/organizationService";
import { getInitials } from "@/lib/orgMeta";

const ROLES = ["admin", "project_manager", "engineer", "supervisor", "worker", "qaqc_inspector", "accountant"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: OrgMemberRow | null;
  departments: OrgDepartmentRow[];
  members: OrgMemberRow[];
  onSaved: () => void;
}

const LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6"];
const STATUSES = ["active", "on_leave", "inactive", "terminated"];

export function MemberFormDialog({ open, onOpenChange, member, departments, members, onSaved }: Props) {
  const [form, setForm] = React.useState<Partial<OrgMemberRow>>({});
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [createRole, setCreateRole] = React.useState<string>("worker");
  const [createPassword, setCreatePassword] = React.useState<string>("");

  React.useEffect(() => {
    if (member) setForm({ ...member });
    else setForm({ employment_status: "active", level: "L6" });
    setCreatePassword("");
    setCreateRole("worker");
  }, [member, open]);

  const isCreate = !member;

  const onPickFile = () => fileRef.current?.click();

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadMemberAvatar(member.id, file);
      setForm((f) => ({ ...f, avatar_url: url }));
      toast.success("Photo uploaded");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await updateMemberProfile(member.id, {
        full_name: form.full_name,
        employee_id: form.employee_id,
        job_title: form.job_title,
        department: form.department,
        email: form.email,
        phone: form.phone,
        hire_date: form.hire_date,
        employment_status: form.employment_status,
        emergency_contact: form.emergency_contact,
        emergency_phone: form.emergency_phone,
        report_to_employee_id: form.report_to_employee_id,
        level: form.level,
      });
      toast.success("Member updated");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-semibold uppercase">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt={form.full_name ?? ""} className="h-full w-full object-cover" />
              ) : form.full_name ? getInitials(form.full_name) : <User className="h-8 w-8 text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Profile photo</div>
              <p className="text-xs text-muted-foreground mb-2">JPG/PNG, square works best.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
              />
              <Button size="sm" variant="outline" onClick={onPickFile} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {form.avatar_url ? "Replace photo" : "Upload photo"}
              </Button>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Employee ID</Label>
              <Input value={form.employee_id ?? ""} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="C-0028" />
            </div>
            <div>
              <Label>Full name</Label>
              <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Job title / Position</Label>
              <Input value={form.job_title ?? ""} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
            </div>
            <div>
              <Label>Department</Label>
              <Select value={form.department ?? ""} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Level</Label>
              <Select value={form.level ?? ""} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue placeholder="L1–L6" /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reports to (employee ID)</Label>
              <Select value={form.report_to_employee_id ?? "__none__"} onValueChange={(v) => setForm({ ...form, report_to_employee_id: v === "__none__" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {members.filter((m) => m.id !== member.id && m.employee_id).map((m) => (
                    <SelectItem key={m.id} value={m.employee_id!}>
                      {m.employee_id} · {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Hire date</Label>
              <Input type="date" value={form.hire_date ?? ""} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.employment_status ?? "active"} onValueChange={(v) => setForm({ ...form, employment_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Emergency contact</Label>
              <Input value={form.emergency_contact ?? ""} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
            </div>
            <div>
              <Label>Emergency phone</Label>
              <Input value={form.emergency_phone ?? ""} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
