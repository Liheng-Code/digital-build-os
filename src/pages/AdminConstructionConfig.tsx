import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  Bell,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Default notification rules for Construction Module (Section 24.5.6)
const DEFAULT_NOTIFICATION_RULES = [
  { event: "task_assigned", recipients: "assignee, discipline_manager", priority: "normal", channels: "in_app,telegram" },
  { event: "task_overdue", recipients: "assignee,discipline_manager,pm", priority: "high", channels: "in_app,email,telegram", escalation: "24h to director" },
  { event: "task_submitted", recipients: "reviewer,supervisor", priority: "high", channels: "in_app,telegram" },
  { event: "task_approved", recipients: "assignee,pm", priority: "normal", channels: "in_app" },
  { event: "task_rejected", recipients: "assignee,discipline_manager", priority: "high", channels: "in_app,email" },
  { event: "inspection_requested", recipients: "inspector,pm", priority: "high", channels: "in_app,email" },
  { event: "inspection_completed", recipients: "requester,pm", priority: "normal", channels: "in_app" },
  { event: "concrete_pour_recorded", recipients: "pm,supervisor", priority: "normal", channels: "in_app" },
  { event: "site_issue_reported", recipients: "hse_officer,pm", priority: "critical", channels: "in_app,email,telegram" },
];

// Default task status flow (Module 14.3)
const TASK_STATUS_FLOW = [
  { from: "open", to: ["assigned", "on_hold"] },
  { from: "assigned", to: ["in_progress", "on_hold", "open"] },
  { from: "in_progress", to: ["completed", "on_hold", "rejected"] },
  { from: "completed", to: ["submitted_for_approval"] },
  { from: "submitted_for_approval", to: ["approved", "rejected"] },
  { from: "approved", to: ["closed"] },
  { from: "closed", to: [] },
  { from: "rejected", to: ["in_progress"] },
  { from: "on_hold", to: ["in_progress", "assigned", "open"] },
];

export default function AdminConstructionConfig() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = React.useState("status_flow");

  if (!hasRole("admin")) {
    return <div className="p-8 text-muted-foreground">Access denied. Admin role required.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" /> Construction Module Configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure Module 9 — Construction Management settings per DCOS Section 14
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="status_flow">Status Flow</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Status Flow Configuration */}
        <TabsContent value="status_flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> Task Status Flow (Module 14.3)
              </CardTitle>
              <CardDescription>
                Configure allowed status transitions for construction tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TASK_STATUS_FLOW.map((flow, idx) => (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{flow.from}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <div className="flex gap-1 flex-wrap">
                        {flow.to.map(s => (
                          <Badge key={s} className="bg-primary-soft text-primary">{s}</Badge>
                        ))}
                        {flow.to.length === 0 && (
                          <span className="text-xs text-muted-foreground">No transitions (end state)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-4">
                  ⚠️ Status flow is enforced at DB level via check constraints and triggers (migration 20260507050000_construction_module.sql)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Rules */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5" /> Notification Matrix (Section 24.5.6)
              </CardTitle>
              <CardDescription>
                Configure who gets notified for construction events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DEFAULT_NOTIFICATION_RULES.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{rule.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-xs text-muted-foreground">
                        Recipients: {rule.recipients} • Channels: {rule.channels}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        rule.priority === 'critical' ? "bg-destructive-soft text-destructive" :
                        rule.priority === 'high' ? "bg-warning-soft text-warning" :
                        "bg-info-soft text-info"
                      }>
                        {rule.priority}
                      </Badge>
                      {rule.escalation && (
                        <Badge variant="outline" className="text-xs">{rule.escalation}</Badge>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-4">
                  ⚠️ Notification rules are configured in the database table `notification_rules`. 
                  Update via Admin → Notification Rules for project-specific overrides.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklists */}
        <TabsContent value="checklists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" /> Inspection Checklists
              </CardTitle>
              <CardDescription>
                Configure QA/QC inspection checklists for construction tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-dashed rounded-lg text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="font-medium">Concrete Pour Checklist</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Checklist items for concrete pour inspections (slump test, cylinder samples, weather conditions, etc.)
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">Configure</Button>
                </div>
                <div className="p-4 border border-dashed rounded-lg text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="font-medium">Structural Works Checklist</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Checklist items for structural works inspections (rebar placement, formwork, etc.)
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">Configure</Button>
                </div>
                <div className="p-4 border border-dashed rounded-lg text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="font-medium">Finishing Works Checklist</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Checklist items for finishing works inspections (surface flatness, paint quality, etc.)
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">Configure</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Checklists integrate with QA/QC Module 12.3 (ITP - Inspection and Test Plan)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Module Settings</CardTitle>
              <CardDescription>
                Configure Construction Module behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Task Dependency Checking</Label>
                  <p className="text-xs text-muted-foreground">Prevent starting tasks with incomplete dependencies</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Create NCR for Failed Inspections</Label>
                  <p className="text-xs text-muted-foreground">Automatically create QA/QC NCR when inspection fails</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>WBS Progress Roll-Up</Label>
                  <p className="text-xs text-muted-foreground">Automatically calculate WBS progress from task updates</p>
                </div>
                <Switch defaultChecked={true} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require 100% Progress for Submission</Label>
                  <p className="text-xs text-muted-foreground">Enforce 100% progress before task can be submitted for approval</p>
                </div>
                <Switch defaultChecked={true} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Photo Upload</Label>
                  <p className="text-xs text-muted-foreground">Allow photo uploads for tasks, reports, inspections, and pours</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="pt-4 border-t">
                <Label>Default Concrete Grade</Label>
                <Select defaultValue="C30">
                  <SelectTrigger className="w-40 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C20">C20 (20 MPa)</SelectItem>
                    <SelectItem value="C25">C25 (25 MPa)</SelectItem>
                    <SelectItem value="C30">C30 (30 MPa)</SelectItem>
                    <SelectItem value="C35">C35 (35 MPa)</SelectItem>
                    <SelectItem value="C40">C40 (40 MPa)</SelectItem>
                    <SelectItem value="C45">C45 (45 MPa)</SelectItem>
                    <SelectItem value="C50">C50 (50 MPa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
