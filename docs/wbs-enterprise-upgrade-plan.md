# Enterprise WBS & Scheduling Upgrade Plan

## Background & Motivation
The current WBS module (Phase 1) successfully handles hierarchical node structures, task dependencies, basic Critical Path Method (CPM), calendars, and baselines. To elevate this module to an "Enterprise-Grade" standard suitable for complex construction projects—and considering schedules will be built directly in the platform—the next phases must introduce Manpower Resource Management, Earned Value Management (EVM), reusable project templates, and performance optimizations to support large-scale projects.

## Scope & Constraints
Based on project requirements:
- **Resource Focus:** Strictly Manpower/Labor. Equipment and materials are deferred.
- **Access Control:** Global access for project members; granular node-level RBAC is deferred.
- **Schedule Creation:** Built directly within the platform. P6/MS Project imports are out of scope for now.
- **Scale:** The system must support a maximum of **10,000 tasks** per project. This necessitates strict UI virtualization for the Gantt chart and tree views to ensure smooth 60 FPS performance in the browser.

## Phased Implementation Plan

### Phase 2: Scale Optimization & Virtualization (Prerequisite)
*Objective: Ensure the Gantt chart and Tree View can render up to 10,000 tasks without browser degradation.*
1. **UI Virtualization:**
   - Implement `react-window` or `@tanstack/react-virtual` for the `WbsGanttTree` and `WbsGantt` components.
   - Only render rows currently visible in the user's viewport.
2. **Data Pagination / Lazy Loading (If required):**
   - Optimize the Supabase data fetching in `useWbsSchedule` to handle 10,000 rows efficiently (e.g., using indexing or chunked loading if payload size becomes an issue).

### Phase 3: Manpower Resource Management & Leveling
*Objective: Link labor resources to tasks and visualize allocation to prevent overallocation.*
1. **Database Schema:** 
   - `labor_catalogs` / `manpower_roles`: Define standardized labor roles (e.g., Foremen, Welders) and standard hourly rates.
   - `task_resources`: Link tasks to labor roles (e.g., Task A requires 2 Welders for its duration).
2. **Resource Assignment UI:** 
   - Add a "Resources" tab within the Task Details to assign required manpower and set planned man-hours.
3. **Resource Histograms:**
   - Develop a new panel displaying a bar chart of daily/weekly assigned manpower.
4. **Basic Leveling Indicators:**
   - Visually flag tasks or dates on the Gantt chart where manpower exceeds predefined limits (overallocation warnings).

### Phase 4: Earned Value Management (EVM) & S-Curves
*Objective: Measure project performance using industry-standard EVM metrics.*
1. **EVM Calculation Engine:**
   - Utilize standard labor rates and assigned man-hours to calculate **Planned Value (PV)** (Baseline Cost), **Earned Value (EV)** (Progress % * PV), and **Actual Cost (AC)**.
2. **Performance Indices:**
   - Calculate and display **Schedule Performance Index (SPI)** and **Cost Performance Index (CPI)** on the WBS Node Tree as rollup columns.
3. **S-Curve Dashboards:**
   - Create an interactive S-Curve chart charting cumulative PV, EV, and AC over the project timeline.

### Phase 5: WBS Templates & Activity Libraries
*Objective: Accelerate direct schedule building by reusing standard structures.*
1. **Database Schema:**
   - `wbs_templates`, `wbs_template_nodes`, `wbs_template_tasks`: Store generic hierarchical nodes and standard tasks.
2. **Template Management UI:**
   - Create an Admin interface to define standard WBS templates (e.g., "High-Rise Standard", "Villa Standard").
3. **Instantiation Workflow:**
   - When creating a new project or sub-node, allow the user to "Import from Template", instantly populating the WBS tree.

## Verification
- **Performance Testing:** Generate a mock project with exactly 10,000 tasks and verify scrolling, collapsing nodes, and drag-to-edit functions remain responsive (<100ms latency).
- **Functional Testing:** Verify that assigning 5 workers to a 10-day task accurately generates 400 man-hours.
- **EVM Accuracy:** Cross-check SPI and CPI calculations against a known test dataset.

## Migration & Rollback
- Provide robust `.sql` migration scripts for table creation (`labor_catalogs`, `task_resources`, `wbs_templates`).
- Ensure UI components gracefully fall back if labor catalogs are empty.
