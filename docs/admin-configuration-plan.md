# Module 18 — Admin Configuration Implementation Plan

## Purpose

Admin configuration controls the master setup of the system. Per DCOS architecture doc Section 23:

> Do not hard-code business rules. Put them in admin configuration wherever possible.

## Current State Inventory

### Already Built (no work needed)
| Area | Location | Table |
|------|----------|-------|
| Company profile | Settings → `CompanyProfileTab` | `companies` |
| User roles | `/team` — `Team.tsx` | `profiles.roles` |
| Permissions matrix | `/permissions` — `Permissions.tsx` | `role_permissions` |
| Departments + members | Settings → `DepartmentMembersTab` | `department_members` |
| Project holidays | Settings → `ProjectHolidaysTab` | `project_holidays` |
| Resource rates (per-project) | `/account/resource-rates` — `ResourceRates.tsx` | `resource_rates` |

### Partially Built (needs admin CRUD UI)
| Area | Current State |
|------|---------------|
| Document types | Hardcoded in `documentMeta.ts` as `DOCUMENT_DISCIPLINES` |
| Cost codes | Used in budgets (`procurementMeta.ts`) but no admin UI |
| Construction config | `AdminConstructionConfig.tsx` — hardcoded data, no DB persistence |

### Not Built (needs full implementation)
| Area |
|------|
| Disciplines (hardcoded in `departmentMeta.ts` as `Department` type) |
| Project types |
| WBS node types |
| Approval workflow templates |
| Public holiday calendar (company-wide, vs per-project) |
| Material codes |
| Equipment types |
| QA/QC checklist templates (placeholder UI in `AdminConstructionConfig`) |
| HSE checklist templates |
| Labor rates (company-wide, vs per-project `resource_rates`) |
| Notification rules (hardcoded in `AdminConstructionConfig`) |

---

## Implementation Phases

### Phase 1 — Foundation

1. **Migration**: `20260508_admin_config_master_tables.sql`
   - `disciplines` — id, code, name, sort_order, is_active
   - `project_types` — id, code, name, sort_order, is_active
   - `wbs_node_types` — id, code, name, icon, sort_order, is_active
   - `document_types` — id, code, name, category, sort_order, is_active
   - `cost_codes` — id, code, name, parent_id (self-ref FK), is_active
   - `material_codes` — id, code, name, unit, category, is_active
   - `equipment_types` — id, code, name, category, is_active
   - `public_holidays` — id, date, label, is_recurring_yearly, is_active
   - `notification_rules` — id, event_code, recipient_strategy (text), channels (text), priority (text), escalation_enabled (boolean), is_active
   - `approval_templates` — id, name, module (text), steps (jsonb), is_active
   - `checklist_templates` — id, name, category (QAQC|HSE), items (jsonb), is_active
   - `labor_rates` — id, labor_code, name, hourly_rate, currency, is_active
   - Enable RLS, add policies (admin-only write, authenticated read)

2. **Types**: `src/lib/adminConfigMeta.ts`
   - TypeScript interfaces for all new entities
   - Label maps, tone maps following `departmentMeta.ts` patterns

3. **Page**: `src/pages/AdminConfiguration.tsx`
   - Master tabbed page at `/admin/config`
   - Admin-only guard (`hasRole("admin")`)
   - Tabs: Disciplines, Project Types, WBS Node Types, Document Types, Cost Codes, Material Codes, Equipment Types, Public Holidays, Notification Rules, Approval Templates, Checklist Templates, Labor Rates

4. **Route + Nav**
   - Register `/admin/config` route in `App.tsx`
   - Add nav item in `AppLayout.tsx` under "Administration" group (admin-only)
   - Move existing `AdminConstructionConfig.tsx` → become a tab inside `AdminConfiguration`

### Phase 2 — Tab Components

Each tab follows the same pattern (CRUD table + dialog):
- Table view with columns for key fields
- Add / Edit dialog (modal)
- Active/inactive toggle
- Delete with confirmation

Tab list:
1. **DisciplinesTab** — code, name, sort_order
2. **ProjectTypesTab** — code, name, description
3. **WbsNodeTypesTab** — code, name, icon selector
4. **DocumentTypesTab** — code, name, category
5. **CostCodesTab** — hierarchical tree with parent selector
6. **MaterialCodesTab** — code, name, unit, category
7. **EquipmentTypesTab** — code, name, category
8. **PublicHolidaysTab** — date, label, recurring toggle
9. **NotificationRulesTab** — event_code, recipient_strategy, channels, priority, escalation
10. **ApprovalTemplatesTab** — name, module, steps (dynamic list)
11. **ChecklistTemplatesTab** — name, category (QAQC/HSE), items (dynamic list)
12. **LaborRatesTab** — code, name, hourly_rate, currency

### Phase 3 — Seed & Migration

- Seed migration: populate tables with values currently hardcoded
  - Disciplines from `departmentMeta.ts` Department type
  - Document types from `DOCUMENT_DISCIPLINES`
  - WBS node types from WBS conventions
  - Default notification rules from `AdminConstructionConfig.tsx`

### Phase 4 — Integration & Polish

- Update `documentMeta.ts` / `departmentMeta.ts` to reference DB tables
- Update consuming pages (Documents, WBS, etc.) to pull from config tables
- Move `AdminConstructionConfig.tsx` into AdminConfiguration as a tab
- Verify `npm run build` and `npm run lint` pass

---

## Architecture Decisions

- **Single master page** over fragmented pages — consistent UX for admins
- **Direct Supabase queries** (no service layer for MVP) — follows existing codebase pattern
- **RLS policies**: authenticated users can read, only admin role can write
- **Tabs sorted alphabetically** in the UI for discoverability
- **Existing hardcoded values** migrate to DB with a seed migration — consuming pages updated incrementally
