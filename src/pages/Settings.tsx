import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { DepartmentMembersTab } from "@/components/settings/DepartmentMembersTab";
import { ProjectHolidaysTab } from "@/components/settings/ProjectHolidaysTab";
import { CompanyProfileTab } from "@/components/settings/CompanyProfileTab";
import { TelegramTab } from "@/components/settings/TelegramTab";

export default function Settings() {
  const { user, profile, refreshProfile, hasRole } = useAuth();
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const isAdmin = hasRole("admin");

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setJobTitle(profile.job_title ?? "");
      setEmployeeId(profile.employee_id ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        job_title: jobTitle.trim() || null,
        employee_id: employeeId.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile updated");
      refreshProfile();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="holidays">Project holidays</TabsTrigger>
          {isAdmin && <TabsTrigger value="departments">Departments</TabsTrigger>}
          {isAdmin && <TabsTrigger value="company">Company Profile</TabsTrigger>}
        </TabsList>

        <TabsContent value="holidays" className="mt-4">
          <ProjectHolidaysTab />
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Personal information visible to your team</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Employee ID</Label>
                  <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Job title</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
              <div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="departments" className="mt-4">
            <DepartmentMembersTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="company" className="mt-4">
            <CompanyProfileTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
