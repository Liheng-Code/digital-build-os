import {
  LayoutDashboard, Building2, FolderKanban, Layers, PencilRuler, Calculator, Receipt, ShoppingCart,
  Boxes, HardHat, ShieldCheck, AlertTriangle, Box, CalendarRange, FileText, Users, Truck,
  Handshake, Wallet, ClipboardCheck, Wrench, Scale, Lightbulb, Settings, BarChart3,
} from "lucide-react";

export type ModuleStatus = "live" | "coming";

export type ModuleDef = {
  key: string;
  title: string;
  to: string;
  icon: any;
  status: ModuleStatus;
  group: string;
};

export const MODULE_GROUPS: { id: string; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "setup", label: "Project Setup" },
  { id: "design", label: "Design & Engineering" },
  { id: "cost", label: "Cost & Procurement" },
  { id: "exec", label: "Execution" },
  { id: "qhse", label: "Quality & Safety" },
  { id: "resources", label: "Resources" },
  { id: "closeout", label: "Closeout & Knowledge" },
  { id: "admin", label: "Administration" },
];

export const MODULES: ModuleDef[] = [
  // Overview
  { key: "dashboard", title: "Dashboard", to: "/", icon: LayoutDashboard, status: "live", group: "overview" },
  { key: "portfolio", title: "Portfolio", to: "/portfolio", icon: BarChart3, status: "live", group: "overview" },

  // Setup
  { key: "projects", title: "Projects", to: "/projects", icon: FolderKanban, status: "live", group: "setup" },
  { key: "hierarchy", title: "WBS Hierarchy", to: "/hierarchy", icon: Layers, status: "coming", group: "setup" },

  // Design
  { key: "design", title: "Design Management", to: "/design", icon: PencilRuler, status: "coming", group: "design" },
  { key: "engineering", title: "Engineering", to: "/engineering", icon: Calculator, status: "coming", group: "design" },
  { key: "bim", title: "BIM Coordination", to: "/bim", icon: Box, status: "coming", group: "design" },
  { key: "documents", title: "Document Control", to: "/documents", icon: FileText, status: "coming", group: "design" },

  // Cost & procurement
  { key: "qs", title: "Quantity Surveying", to: "/qs", icon: Receipt, status: "coming", group: "cost" },
  { key: "procurement", title: "Procurement", to: "/procurement", icon: ShoppingCart, status: "coming", group: "cost" },
  { key: "stock", title: "Stock & Inventory", to: "/stock", icon: Boxes, status: "coming", group: "cost" },
  { key: "accounting", title: "Accounting & Finance", to: "/accounting", icon: Wallet, status: "coming", group: "cost" },

  // Execution
  { key: "construction", title: "Construction Mgmt", to: "/construction", icon: HardHat, status: "coming", group: "exec" },
  { key: "planning", title: "Planning & Scheduling", to: "/planning", icon: CalendarRange, status: "coming", group: "exec" },

  // QHSE
  { key: "qa", title: "Quality (QA/QC)", to: "/qa", icon: ShieldCheck, status: "coming", group: "qhse" },
  { key: "hse", title: "Safety & Health", to: "/hse", icon: AlertTriangle, status: "coming", group: "qhse" },

  // Resources
  { key: "hr", title: "HR & Payroll", to: "/hr", icon: Users, status: "coming", group: "resources" },
  { key: "equipment", title: "Equipment", to: "/equipment", icon: Truck, status: "coming", group: "resources" },
  { key: "subcontractors", title: "Subcontractors", to: "/subcontractors", icon: Handshake, status: "coming", group: "resources" },

  // Closeout
  { key: "commissioning", title: "Commissioning & Handover", to: "/commissioning", icon: ClipboardCheck, status: "coming", group: "closeout" },
  { key: "dlp", title: "Defect Liability (DLP)", to: "/dlp", icon: Wrench, status: "coming", group: "closeout" },
  { key: "claims", title: "Claims & Disputes", to: "/claims", icon: Scale, status: "coming", group: "closeout" },
  { key: "lessons", title: "Lessons Learned", to: "/lessons", icon: Lightbulb, status: "coming", group: "closeout" },

  // Admin
  { key: "company", title: "Company", to: "/admin/company", icon: Building2, status: "live", group: "admin" },
  { key: "settings", title: "Settings", to: "/admin/settings", icon: Settings, status: "coming", group: "admin" },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  project_manager: "Project Manager",
  site_engineer: "Site Engineer",
  executive: "Executive",
};
