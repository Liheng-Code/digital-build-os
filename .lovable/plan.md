
## Recommendation on scope

Your question — "what's the real practical use case?" My recommendation:

**Merge into a single page: `Organization` (replaces Team & Roles)** with two tabs:
- **Org Chart** — the visual hierarchy from your reference image (MD → GM → PM → 6 departments)
- **Permissions Matrix** — the existing matrix, kept intact but rendered inside the same page

Why: admins almost always toggle between "who is this person / what dept" and "what can their role do." Splitting them across two sidebar items forces context-switching. The standalone Permissions page becomes redundant and is removed from the sidebar.

## What gets built

### 1. Seed 27 staff into the database

Migration + seed insert:
- 27 rows in `profiles` with `employee_id` = `C-0001`…`C-0027`, `full_name`, `email`, `phone`, `job_title`, `department`
- Add new columns to `profiles` if missing: `report_to_employee_id text`, `level text` (L1–L6), `avatar_seed text`
- 27 corresponding `auth.users` (email + a shared demo password like `Demo1234!`) created via the existing `seed-demo-users` edge function pattern
- 27 `user_roles` rows mapping department → app_role:
  - Management (MD/GM/PM) → `admin` / `project_manager`
  - Architecture, Structural → `engineer`
  - Procurement → `project_manager` (for managers) / `engineer`
  - Construction → `supervisor` / `engineer`
  - HR → `admin` for HR Manager, else `worker`
  - Account → `accountant`

### 2. New page `src/pages/Organization.tsx` (replaces `Team.tsx`)

Tabs:
- **Org Chart tab** — the hierarchy laid out exactly like your reference:
  - Top: 3 stacked cards (MD → GM → PM) with vertical connectors
  - Below: 6 department columns (Architecture / Structural / Procurement / Construction / HR / Account), each with a colored header (using existing `departmentMeta` tones) and member cards underneath
  - Each card: ID badge (`C-0004`), avatar (initials in dept-colored circle), name, job title, role badge
  - Click a card → opens `MemberDetailSheet` showing email, phone, roles, and an "Add/Remove role" inline editor (today's Team page functionality preserved)
- **Permissions tab** — unchanged matrix from `Permissions.tsx`, embedded as a child component
- Sidebar entries: keep "Organization", remove "Team & Roles" and "Permissions" links

### 3. Demo landing on `/auth`

When the user is signed out and on `/auth`, show a new **Demo Login** panel above (or replacing) the email/password form:
- Heading: "Sign in as a demo user"
- **Department dropdown filter** (All / Management / Architecture / Structural / Procurement / Construction / HR / Account)
- Below it: org chart (compact version reusing the same component) filtered to selected department
- Click any person card → auto-fills email + demo password and immediately calls `supabase.auth.signInWithPassword` → redirects to `/`
- Existing manual email/password form stays below in a collapsed "Sign in manually" disclosure

### 4. Photos

Your reference image uses stock photos that aren't licensed for embedding. Plan: **initials avatars in department-tinted circles** (matching the visual rhythm of the chart). The original org chart image is decorative and will appear as a hero banner on the Organization page only. If you prefer real photos later, you can upload individual headshots and we'll swap them in.

## Technical bits

```text
Files added
  src/pages/Organization.tsx           (new, replaces Team)
  src/components/org/OrgChart.tsx      (visual hierarchy, reusable)
  src/components/org/OrgMemberCard.tsx
  src/components/org/DemoLoginPanel.tsx
  supabase migration: add profiles.report_to_employee_id, level, avatar_seed
  supabase insert: 27 profiles + user_roles
  edge function call: seed 27 auth users with shared demo password

Files edited
  src/App.tsx                  swap /team route → /organization, drop /permissions
  src/components/AppLayout.tsx sidebar: remove Team/Permissions, add Organization
  src/pages/Auth.tsx           mount <DemoLoginPanel /> above the form
  src/components/RouteHead.tsx add /organization metadata

Files removed
  src/pages/Team.tsx
  src/pages/Permissions.tsx (logic folded into Organization tab)
```

Departments map to roles via a single `DEPT_TO_ROLE` table in `src/lib/orgMeta.ts` so the seed and UI stay consistent.

## Open question before I build

The 27 demo emails (`liheng@dcos.com`, etc.) — should I create them as **real auth users** with a shared password `Demo1234!` (so click-to-login works), or do you have a different password convention you want me to use? Reply with "Demo1234! is fine" or give me the password you want.
