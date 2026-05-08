import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDataTable, type ColumnDef } from "@/components/admin/AdminDataTable";

const WIDE_TABS = [
  "disciplines", "project_types", "wbs_node_types", "document_types",
  "cost_codes", "material_codes", "equipment_types", "public_holidays",
  "notification_rules", "approval_templates", "checklist_templates", "labor_rates",
  "construction_config",
];

const COLUMNS: Record<string, ColumnDef[]> = {
  disciplines: [
    { key: "code", label: "Code", required: true, placeholder: "e.g. architecture" },
    { key: "name", label: "Name", required: true, placeholder: "e.g. Architecture" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  project_types: [
    { key: "code", label: "Code", required: true, placeholder: "e.g. tender" },
    { key: "name", label: "Name", required: true, placeholder: "e.g. Tender / Pre-Contract" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  wbs_node_types: [
    { key: "code", label: "Code", required: true, placeholder: "e.g. building" },
    { key: "name", label: "Name", required: true, placeholder: "e.g. Building" },
    { key: "icon", label: "Icon", placeholder: "e.g. Building2" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  document_types: [
    { key: "code", label: "Code", required: true, placeholder: "e.g. ARC" },
    { key: "name", label: "Name", required: true, placeholder: "e.g. Architecture" },
    { key: "category", label: "Category", placeholder: "e.g. drawing, report" },
    { key: "sort_order", label: "Sort Order", type: "number" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  cost_codes: [
    { key: "code", label: "Code", required: true, placeholder: "e.g. C-001" },
    { key: "name", label: "Name", required: true, placeholder: "e.g. Concrete Works" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  material_codes: [
    { key: "code", label: "Code", required: true, placeholder: "e.g. M-001" },
    { key: "name", label: "Name", required: true, placeholder: "e.g. Portland Cement" },
    { key: "unit", label: "Unit", placeholder: "e.g. ton, m³, pcs" },
    { key: "category", label: "Category", placeholder: "e.g. structural, finishing" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  equipment_types: [
    { key: "code", label: "Code", required: true, placeholder: "e.g. EXC-001" },
    { key: "name", label: "Name", required: true, placeholder: "e.g. Excavator" },
    { key: "category", label: "Category", placeholder: "e.g. heavy, light" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  public_holidays: [
    { key: "holiday_date", label: "Date", type: "date", required: true },
    { key: "label", label: "Label", required: true, placeholder: "e.g. New Year's Day" },
    { key: "is_recurring_yearly", label: "Recurring Yearly", type: "boolean" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  notification_rules: [
    { key: "event_code", label: "Event Code", required: true, placeholder: "e.g. task_assigned" },
    { key: "event_label", label: "Event Label", placeholder: "e.g. Task Assigned" },
    { key: "recipient_strategy", label: "Recipient Strategy", required: true, placeholder: "e.g. assignee, discipline_manager" },
    { key: "channels", label: "Channels", placeholder: "e.g. in_app, email, telegram" },
    { key: "priority", label: "Priority", type: "select", options: [
      { value: "low", label: "Low" },
      { value: "normal", label: "Normal" },
      { value: "high", label: "High" },
      { value: "critical", label: "Critical" },
    ]},
    { key: "escalation_enabled", label: "Escalation", type: "boolean" },
    { key: "escalation_after_hours", label: "Escalation (hours)", type: "number" },
    { key: "escalation_roles", label: "Escalation Roles", placeholder: "e.g. pm, director" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  approval_templates: [
    { key: "name", label: "Template Name", required: true, placeholder: "e.g. Standard PO Approval" },
    { key: "module", label: "Module", required: true, placeholder: "e.g. procurement" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  checklist_templates: [
    { key: "name", label: "Template Name", required: true, placeholder: "e.g. Concrete Pour Checklist" },
    { key: "category", label: "Category", type: "select", required: true, options: [
      { value: "QAQC", label: "QA/QC" },
      { value: "HSE", label: "HSE" },
    ]},
    { key: "is_active", label: "Active", type: "boolean" },
  ],
  labor_rates: [
    { key: "labor_code", label: "Code", required: true, placeholder: "e.g. GEN-LAB" },
    { key: "name", label: "Name", required: true, placeholder: "e.g. General Laborer" },
    { key: "hourly_rate", label: "Hourly Rate", type: "number", required: true },
    { key: "currency", label: "Currency", placeholder: "e.g. USD" },
    { key: "is_active", label: "Active", type: "boolean" },
  ],
};

const DESCRIPTION: Record<string, string> = {
  disciplines: "Configure discipline types used across design and execution modules.",
  project_types: "Manage project classification types (tender, awarded, internal, etc.).",
  wbs_node_types: "Define node types available in the WBS tree structure.",
  document_types: "Manage document classification codes used in the document register.",
  cost_codes: "Manage hierarchical cost codes for budget tracking.",
  material_codes: "Configure material master codes for procurement and inventory.",
  equipment_types: "Manage equipment type classifications.",
  public_holidays: "Company-wide public holiday calendar (distinct from per-project holidays).",
  notification_rules: "Configure notification matrix: who gets notified for which events.",
  approval_templates: "Define reusable approval workflow templates per module.",
  checklist_templates: "Manage QA/QC and HSE inspection checklist templates.",
  labor_rates: "Company-wide default labor rates (overridable per project in Resource Rates).",
};

export default function AdminConfiguration() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = React.useState("disciplines");

  if (!hasRole("admin")) {
    return <div className="p-8 text-muted-foreground">Access denied. Admin role required.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" /> Admin Configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          Module 18 — Master data and system settings. Do not hard-code business rules; configure them here.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex min-w-max">
            {WIDE_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize whitespace-nowrap">
                {tab.replace(/_/g, " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {WIDE_TABS.filter(t => t !== "construction_config").map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <AdminDataTable
              title={tab.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              description={DESCRIPTION[tab]}
              tableName={tab}
              columns={COLUMNS[tab]}
              orderBy="sort_order"
            />
          </TabsContent>
        ))}

        <TabsContent value="construction_config" className="mt-4">
          <AdminConstructionConfigEmbed />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminConstructionConfigEmbed() {
  const ConstructionConfig = React.lazy(() => import("./AdminConstructionConfig"));
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading construction config...</div>}>
      <ConstructionConfig />
    </React.Suspense>
  );
}
