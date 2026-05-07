## Problem

The **Progress & Analytics** page reports different numbers than the **WBS Breakdown** tab for the same project.

**WBS Breakdown** (source: `src/components/wbs/WbsTree.tsx` + `src/hooks/useWbsTree.ts`)
- Reads `tasks` directly and computes a **weighted average** progress per node:
  `Σ(progress_pct × estimated_hours) / Σ(estimated_hours)` over the node + all descendants.
- Always live — no sync needed.

**Progress & Analytics** (source: `src/pages/ProgressAnalytics.tsx`)
- Reads the stored column `wbs_nodes.progress_pct` (line 113, 130, 305, 313).
- This value is only refreshed when the user clicks **Sync Progress** (RPC `sync_all_wbs_progress`), so it goes stale and may use a different formula than the live weighted roll-up.
- Overall progress is a **simple unweighted average** of root nodes' stored `progress_pct` (line 129–132), which differs again from the WBS hierarchy roll-up.

Result: numbers in the KPI cards, Building Progress bar chart, and WBS Node Performance grid don't match what the user sees in WBS Breakdown.

## Fix

Switch Progress & Analytics to the same live computation used by WBS Breakdown — `useWbsTree`'s `nodeStats` (weighted, descendant-inclusive) — and drop the dependency on the stored `progress_pct` column.

Changes in `src/pages/ProgressAnalytics.tsx`:

1. Pull `nodeStats` from `useWbsTree` (already imported, just destructure it).
2. Replace `(node as any).progress_pct` with `nodeStats.get(node.id)?.avgProgress ?? 0` everywhere:
   - `buildingData` (line 113)
   - WBS Node Performance grid (lines 305, 306, 307, 312, 313)
3. Recompute **Overall Progress** the same way WBS Breakdown rolls up the project: weighted average across all tasks (or equivalently across root nodes weighted by their task hours). Simplest and exactly matching: compute it from the already-fetched `tasks` array using the same weighted formula.
4. Remove the **Sync Progress** button and its `handleSync` / `sync_all_wbs_progress` call — no longer needed since the page is now live. (Keeps the page consistent with WBS Breakdown which has no such button.)
5. Leave the S-Curve logic alone (it uses task-level fields, not node `progress_pct`), and leave Active/Completed/Critical KPI cards alone (they already use `tasks.progress_pct`, which matches).

## Files

- `src/pages/ProgressAnalytics.tsx` — only file changed. No DB / RPC / hook changes.

## Out of scope

- The DB column `wbs_nodes.progress_pct` and the `sync_all_wbs_progress` RPC stay as-is; other consumers (if any) are untouched.
