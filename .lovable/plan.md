# Why tab navigation is still slow (round 2)

## What the previous fix actually did

Round 1 changed `src/App.tsx` to:
- Lazy-load every page (code-splitting).
- Keep `AppLayout` mounted via a parent `Outlet` route.
- Set React Query defaults (`staleTime: 30s`, no refetch on focus).

That removed the layout remount cost and the giant initial bundle, but **the per-tab "refresh" feeling is still there**. After auditing the pages, here is why.

## Real remaining bottlenecks

### 1. Pages don't use React Query — so `staleTime` does nothing
A scan of `src/pages/*` shows the vast majority of pages call `supabase.from(...)` directly inside `React.useEffect` (e.g. `Tasks.tsx`, `Approvals.tsx`, `Architecture.tsx` with 17 direct calls, `Wbs.tsx`, `Procurement.tsx`, all `procurement/*` detail pages, all `account/*` pages, etc.). Only a handful (`GRNs`, `RFQs`, `POs`, `Invoices`, `Budgets`, plus their detail pages) use `useQuery`.

Effect: every time you click a tab, that page mounts fresh and re-fires all its Supabase queries from scratch. The React Query cache is empty for them, so the global `staleTime` we set is irrelevant. The "refresh" is real network round-trips on every click.

### 2. Heavy pages fan out many sequential queries on mount
`Approvals.tsx` runs four independent loaders (`loadTasks`, `loadTimesheets`, `loadLeave`, `loadCommercial`) in four separate effects. `Architecture.tsx` has multiple nested loaders triggered by `projectId` / `roomId` changes. None of them are cached or deduplicated, and at least one is failing (`Failed to load leave requests` visible in the session replay), which also stalls UI.

### 3. First click to a never-visited tab still has to download its JS chunk
Code-splitting helps initial load but means each tab pays a one-time chunk download cost on first visit. On a slow connection this looks like "slow tab switch". We can hide most of that by prefetching the chunk when the user hovers the sidebar link.

### 4. `AppLayout` still recomputes a lot on every navigation
`AppSidebar` filters every nav item through `usePermissions().can(...)` on each render, and `NotificationBell`/`ProjectSwitcher` re-render on every route change. Low impact compared to #1, but worth memoising.

## Fix plan

### A. Cache page data with React Query (biggest win)
Wrap the per-page fetches in `useQuery` so a second visit to the same tab returns instantly from cache and only revalidates in the background. Target the heaviest, most-navigated pages first:

1. `Approvals.tsx` — convert all four loaders to `useQuery` with stable keys (`["approvals","tasks",projectId]`, etc.) and run them in parallel. Also fix the failing `loadLeave` call so the toast stops firing.
2. `Tasks.tsx` — convert the task list loader.
3. `Wbs.tsx` — convert the tree + schedule loaders.
4. `Procurement.tsx`, `Inventory.tsx`, `Construction.tsx`, `DailyReports.tsx`, `Stakeholders.tsx`, `Organization.tsx` — same pattern.
5. `Architecture.tsx`, `Structural.tsx`, `MEP.tsx` — wrap the room/board/schedule loaders.

Pattern (drop-in replacement for the current `useEffect`+`useState` block):

```ts
const { data: tasks = [], isLoading } = useQuery({
  queryKey: ["approvals", "tasks", activeProject?.id],
  queryFn: () => fetchApprovalTasks(activeProject!.id),
  enabled: !!activeProject?.id,
});
```

This is the single change that will make tab switches feel instant after the first visit.

### B. Prefetch the next chunk on sidebar hover
In `src/components/AppLayout.tsx`, attach `onMouseEnter` on each `NavLink` that calls a lightweight `import("./pages/X")` for that route. Vite turns this into a `<link rel="modulepreload">`-style fetch and the chunk is warm by the time the user clicks. Implemented as a small `prefetch` map keyed by route.

### C. Memoise the layout shell
- Wrap `AppSidebar` in `React.memo`.
- Memoise the filtered nav groups with `React.useMemo` keyed on `[roles, can]`.
- Move the `useTaskUnread` / `useApprovalUnread` badge reads behind `useMemo` so they don't re-render the whole sidebar tree on every poll.

### D. Lift shared data into React Query, not contexts
`ProjectContext` currently refetches the project list whenever the user changes (fine) but also lives in React state. Move the project list to a `useQuery(["projects"])` so any page that needs it shares the same cache instead of duplicating its own `supabase.from("projects").select(...)` calls (several pages do this today).

## Scope / order of work

We will deliver this in two passes so the user feels improvement quickly:

1. **Pass 1 (perceived-speed quick wins):** B + C, plus convert the top 3 heaviest pages (`Approvals`, `Tasks`, `Wbs`) to `useQuery`. ~6 files touched.
2. **Pass 2 (full caching):** Convert the remaining pages listed in A, then D. ~15–20 files touched, mechanical refactor.

## Out of scope
- No schema changes, no RLS changes, no visual redesign.
- No change to Supabase service functions themselves — only how pages call them.

## Risk
Low. `useQuery` is already a project dependency and used in several pages, so we are standardising on an existing pattern. The hover-prefetch is additive and safe.
