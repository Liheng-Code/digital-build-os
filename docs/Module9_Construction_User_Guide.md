# Module 9 — Construction Management Module User Guide

## Overview
The Construction Management Module is the central workspace for site execution in DCOS. It manages site tasks, progress tracking, daily reports, issues, inspections, and concrete pours — all linked to the WBS (Work Breakdown Structure).

**Aligned with:** DCOS System Architecture Module Design R0, Section 14

---

## Access & Permissions

| Role | Can Do |
|------|--------|
| Super Admin | Full access to all construction records |
| Company Admin | View all company construction logs |
| Project Manager | Approve tasks, view all reports, manage all construction records |
| Discipline Lead (Site) | Manage assigned project construction tasks |
| Engineer | Create/update tasks, submit for approval, upload photos |
| Site Supervisor | Create daily reports, log manpower/equipment, update progress |
| QA/QC Inspector | View inspections, submit inspection results |
| Subcontractor User | View assigned tasks, update progress, upload photos |

---

## Task Status Flow (Module 14.3)

Tasks follow a strict workflow:

```
Open → Assigned → In Progress → Completed → Submitted for Approval → Approved → Closed
```

**Alternative paths:**
- `Rejected` → `In Progress` (fix issues and resubmit)
- `Any Active Status` → `On Hold` → `Resume` (back to previous status)

### Status Meanings:
| Status | Meaning |
|--------|----------|
| Open | Task created, not yet assigned |
| Assigned | Task assigned to a team member |
| In Progress | Work has started |
| Completed | Work finished, ready for inspection |
| Submitted for Approval | Sent to supervisor/PM for review |
| Approved | Work accepted, task can be closed |
| Closed | Task fully completed and closed |
| Rejected | Work needs revision |
| On Hold | Temporarily paused |

---

## Creating a Construction Task

1. Navigate to **Construction** from the left sidebar (under "Site Execution")
2. Click **New Task** (top right)
3. Fill in:
   - **Task Title** (required)
   - **Description** (optional)
   - **Priority**: Low / Medium / High / Critical
   - **WBS Node**: Select from WBS tree (links task to location)
   - **Planned Start** & **Planned Finish** dates
4. Click **Create Task**

> ⚠️ **Rule:** Task must be linked to a WBS node for progress roll-up to work.

---

## Updating Task Progress

1. Go to **Construction → Tasks** tab
2. Click on a task to open **Task Detail**
3. Go to **Progress** tab
4. Enter progress percentage (0-100%)
5. Click **Update**

> ⚠️ **Rules:**
> - Progress can only be updated when status is `Open`, `Assigned`, `In Progress`, or `Rejected`
> - Task must reach 100% before submitting for approval

---

## Task Status Transitions

In the **Task Detail → Actions** tab:

1. Click **Change Status**
2. Select the new status:
   - `In Progress`: Start work
   - `Completed`: Mark work as finished
   - `Submitted for Approval`: Send for review (requires 100% progress)
   - `Approved`: Accept work (Project Manager/Approver only)
   - `Rejected`: Send back for revisions (requires rejection reason)
   - `On Hold`: Pause work

---

## Daily Site Reports

Daily reports are managed through the existing **Daily Reports** module, accessible from the left sidebar.

**Construction-specific features:**
- Link daily reports to WBS nodes
- Upload site photos (stored in Supabase Storage)
- Log manpower by category (skilled, unskilled, engineers, etc.)
- Log equipment usage hours
- Log material consumption (links to Procurement POs)

---

## Site Issue Log (Module 14.2)

Report site issues directly from the **Construction → Issues** tab:

1. Click **New Issue** (to be implemented)
2. Fill in:
   - **Issue Number** (auto-generated, e.g., `ISS-B01-001`)
   - **Title** & **Description**
   - **Severity**: Low / Medium / High / Critical
   - **WBS Node**: Location of issue
3. Submit → Issue appears in the Issues tab
4. Assign to team member for resolution
5. Mark as `Resolved` when fixed

> 🔗 **Auto-Creation:** Critical issues can auto-create a QA/QC NCR (Non-Conformance Report)

---

## Work Inspection Requests (Module 14.4)

When a task is `Completed`, submit a Work Inspection Request:

1. Go to **Construction → Inspections** tab
2. Click **New Inspection** (to be implemented)
3. Fill in:
   - **Title** & **Description**
   - **WBS Node**
   - **Scheduled Date**
   - **Inspector** (assign to QA/QC inspector)
   - **Related Task** (auto-filled if created from task)
4. Inspector submits result: `Pass` / `Fail` / `Conditional Pass`

> 🔗 **Integration:** Failed inspections auto-create an NCR in the QA/QC Module.

---

## Concrete Pour Records (Module 14.2)

Track concrete pours with detailed records:

1. Go to **Construction → Concrete Pours** tab
2. Click **New Pour Record** (to be implemented)
3. Fill in:
   - **Pour Date**
   - **Concrete Grade**: C20, C25, C30, C35, C40, C45, C50, or Other
   - **Quantity (m³)**
   - **Slump (mm)**
   - **Test Cylinder Count** & IDs
   - **Weather Conditions**
4. Submit → Record appears in the Concrete Pours tab

---

## Construction Dashboard (Module 14.5)

The **Dashboard** tab provides real-time KPIs:

| KPI | Description |
|-----|-------------|
| Active Tasks | Tasks currently in progress |
| Completed Tasks | Tasks approved and closed |
| Overdue Tasks | Tasks past planned finish date |
| Average Progress | Avg progress % across all tasks |
| Open Issues | Issues not yet resolved |
| Critical Issues | High/critical severity issues |
| Pending Inspections | Inspections awaiting result |
| Concrete Poured (m³) | Total concrete volume this week |

---

## Module 14.5 Key Reports

Access reports via **Construction → Reports** (or `/construction/reports`):

1. **Daily Progress Report**: Task completions and progress per day
2. **Weekly Progress Report**: Aggregated weekly summary
3. **Monthly Progress Report**: Monthly progress with variance analysis
4. **Manpower Histogram**: Worker count by category
5. **Equipment Utilization**: Equipment usage rates and hours
6. **Material Consumption**: Material usage by WBS and date
7. **Delay Report**: Overdue tasks sorted by days delayed
8. **Issue Aging Report**: Open issues sorted by days open

> 📥 **Export:** All reports can be exported as Excel or PDF.

---

## WBS Progress Roll-Up (Module 8.4, 8.6)

When you update task progress:
1. The system calculates the average progress of all tasks under a WBS node
2. Progress rolls up to parent WBS nodes automatically
3. Project-level progress is the weighted average of all WBS nodes

> 📊 **Example:** If WBS node `B01-L05-Z03` has 3 tasks at 100%, 50%, and 0%, the node progress = 50%.

---

## Cross-Module Integration

The Construction Module integrates with:

| Module | Integration Point |
|--------|-------------------|
| **Procurement (Module 13)** | Material usage logs link to Purchase Orders (POs) |
| **Inventory (Module 19)** | Material issues update stock levels |
| **QA/QC (Module 12)** | Inspection requests route to ITP, failed inspections create NCRs |
| **Planning (Module 16)** | Task dates sync with master schedule, baseline vs actual progress |
| **Document Control (Module 15)** | Daily reports auto-upload as documents with numbering (e.g., `P001-CON-RPT-001`) |

---

## Notification Triggers (Section 24.5)

You'll receive notifications for:

| Event | Channel |
|-------|---------|
| Task assigned | In-App + Telegram |
| Task overdue | In-App + Email + Telegram (escalates) |
| Task submitted for approval | In-App + Telegram |
| Task approved/rejected | In-App |
| Inspection requested | In-App + Email |
| Inspection result submitted | In-App + Telegram |
| Concrete pour recorded | In-App |
| Site issue reported | In-App + Email + Telegram (if critical) |

---

## Audit Trail (Section 24.4)

All construction actions are logged:
- Task created/updated/deleted
- Status changes
- Progress updates
- Photos uploaded
- Inspection results
- Pour records

Access audit logs via **Admin → Audit Log** (permission required).

---

## Tips & Best Practices

1. **Always link tasks to WBS nodes** for proper progress tracking
2. **Upload photos** for key milestones (pour, inspection, completion)
3. **Log manpower/equipment daily** for accurate cost tracking
4. **Submit for inspection** only when work is 100% complete
5. **Report issues immediately** — don't wait for inspections
6. **Use correct concrete grades** and log all test cylinders
7. **Check notifications regularly** for pending approvals and overdue tasks

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't submit for approval | Ensure progress = 100% |
| Can't start task | Check if dependency task is completed |
| Progress not rolling up | Verify task is linked to WBS node |
| Can't delete task | Remove links to inspections/pour records first |
| Notification not received | Check notification settings in profile |

---

**For technical support:** Contact your system administrator or refer to the DCOS System Architecture documentation.
