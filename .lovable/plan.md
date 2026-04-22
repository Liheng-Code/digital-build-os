
# DCOS — Digital Construction Operating System

A module-by-module build of an enterprise construction management platform. This plan covers **Iteration 1: Foundation + App Shell**. Subsequent iterations will each deliver one fully-functional module.

## Iteration 1 Scope (this turn)

Establish the foundation everything else plugs into:

1. **Design system** — modern dark dashboard theme (deep navy/slate background, electric-blue + cyan accents, semantic tokens for success/warning/danger, dense data UI).
2. **Authentication** — email/password sign-up & sign-in via Lovable Cloud (Supabase). Auto-confirm enabled for fast testing.
3. **Multi-tenant + role model** — `companies`, `profiles`, `user_roles` (separate table — `app_role` enum: `admin`, `project_manager`, `site_engineer`, `executive`), with `has_role()` security-definer function and RLS on every table.
4. **Core WBS hierarchy tables** — `projects`, `phases`, `disciplines`, `buildings`, `levels`, `zones`, `rooms`, `tasks` with WBS code generation `P001-CN-STR-B01-L02-Z03-R045-T123`.
5. **App shell**
   - Persistent collapsible left sidebar listing all 20 modules grouped into sections (Project Setup, Design & Engineering, Cost & Procurement, Execution, Quality & Safety, Resources, Finance & Closeout, Knowledge).
   - Top bar with project switcher, search, notifications, user menu.
   - Role-aware navigation (Executive sees portfolio, Site Engineer sees field tools first, etc.).
6. **Dashboard home** — role-specific landing:
   - **Admin** — company/users/projects overview.
   - **Executive** — portfolio KPIs (active projects, total contract value, cash position, schedule/cost variance) with charts.
   - **Project Manager** — single-project KPIs, milestones, RFIs, NCRs.
   - **Site Engineer** — today's tasks, open inspections, daily report quick-entry.
7. **Projects module (functional)** — list, create, edit projects; project detail page with tabs (Overview, Team, Settings) as the anchor for future modules.
8. **Module placeholders** — every other module gets a route + "Coming in next iteration" page so navigation works end-to-end.

## Iteration Roadmap (subsequent turns, one per message)

| # | Module | Highlights |
|---|---|---|
| 2 | Project hierarchy editor | Phase/Discipline/Building/Level/Zone/Room/Task CRUD + WBS tree view |
| 3 | Document Control | 300+ doc types, versioning, workflow, transmittals, file storage |
| 4 | Design Management | Drawings, specs, RFIs, submittals, review workflow |
| 5 | Quantity Surveying | BOQ, estimates, VOs, IPCs, schedule of values |
| 6 | Procurement | PRs, POs, suppliers, 3-way match |
| 7 | Stock / Inventory | Items, transactions, BOQ-vs-actual |
| 8 | Construction Mgmt | Daily reports, concrete pour/cube, manpower |
| 9 | QA/QC | ITPs, inspections, NCRs, punch lists |
| 10 | HSE | Incidents, toolbox talks, permits |
| 11 | Planning & Scheduling | Gantt, look-ahead, EVM, S-curves |
| 12 | BIM Coordination | Three.js viewer, clash detection |
| 13 | HR & Payroll | Employees, attendance, payroll runs |
| 14 | Equipment | Master data, usage logs, maintenance |
| 15 | Subcontractors | Contracts, payment certs, evaluations |
| 16 | Accounting & Finance | GL, AR/AP, journals, statements |
| 17 | Commissioning & Handover | FAT/SAT, packages, certificates |
| 18 | DLP | Defect tracking, periodic inspections, warranty |
| 19 | Claims & Disputes | EOT, cost claims, evidence |
| 20 | Lessons Learned & KM | Library, historical cost, evaluations |
| 21 | Engineering | Calculations, technical reviews |
| 22 | Multi-level dashboards polish | Board → Field rollups, drill-downs |

## Visual direction

Modern dark command-center: background `hsl(222 30% 7%)`, surface `hsl(222 25% 11%)`, primary `hsl(210 100% 60%)` electric blue, accent cyan, success emerald, warning amber, danger rose. Inter for UI, JetBrains Mono for codes/IDs. Dense tables, KPI cards with sparklines, generous use of badges and status chips.

## Technical notes (for reference)

- **Stack:** React + Vite + Tailwind + shadcn/ui + Lovable Cloud (Supabase) + React Router + TanStack Query + Recharts.
- **Auth:** `supabase.auth` with email/password; `onAuthStateChange` listener set before `getSession()`.
- **Profiles:** auto-created via `handle_new_user` trigger on `auth.users` insert; first signup of a company becomes admin.
- **Roles:** stored in `user_roles` only (never on profiles). All RLS uses `public.has_role(auth.uid(), 'role')`.
- **Tenancy:** every business table carries `company_id`; RLS restricts to user's company.
- **WBS:** generated server-side via Postgres triggers from parent codes + sequence.
- **Routing:** `/auth`, `/`, `/projects`, `/projects/:id`, `/projects/:id/<module>`, plus `/admin`, `/portfolio`.
- **File storage:** Supabase Storage buckets per category (added when Document Control module lands).
- **Future-proofing:** module folders under `src/modules/<name>/` so each iteration is self-contained.

## After your approval

I will switch to default mode and deliver Iteration 1 in the next turn: design system, auth, tenancy + roles, core hierarchy schema, sidebar shell, role-based dashboards, functional Projects module, and routed placeholders for the remaining 19 modules. Then on each follow-up message you say "next module" (or name one) and I build it out.
