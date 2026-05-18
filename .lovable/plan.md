# Fix slow tab switching across the app

## Problem found

Tab switching is still slow because the slowdown is not limited to WBS, Procurement, or Architecture.

Current profiling shows three app-wide issues:

1. The shared layout and sidebar still re-render a large navigation tree on every route change.
2. The app performs duplicate startup requests for the same user, roles, projects, permissions, and notifications.
3. Some route-level queries still fail or refetch unnecessarily, including the WBS schedule query requesting `budgeted_cost` and `actual_cost` columns that do not exist in the current database.

This makes every button/tab feel like a full refresh even when page data is cached.

## Fix plan

### 1. Stabilize app-wide auth and project data

- Move project list loading from manual context state into React Query.
- Cache projects for a longer window so tab navigation does not re-query project data.
- Memoize the `AuthContext` and `ProjectContext` values so their consumers do not re-render unnecessarily.
- Prevent duplicate profile/role loads during initial auth/session setup.

### 2. Optimize sidebar and top bar rendering

- Precompute visible navigation groups with `useMemo` instead of filtering every group on every route update.
- Memoize permission checks so sidebar rendering is cheap.
- Keep notification badge reads shared through one cached query instead of multiple same-table requests.
- Keep the current route prefetch behavior, but add click-time prefetch for direct/fast clicks that happen without hover.

### 3. Fix failed queries that cause repeated retries/loading

- Update the WBS schedule loader so it no longer selects missing task columns.
- Keep cost rollups safe by defaulting missing budget/actual cost fields to zero on the client.
- Review common tabs for obvious repeated failed network requests and stop them from retrying on navigation.

### 4. Reduce perceived “refresh” on page switches

- Increase app-wide React Query `staleTime` for normal navigation data from 30 seconds to a longer practical window.
- Use cached data immediately while background refresh happens later.
- Avoid full-screen loading states when cached data already exists.

### 5. Validate with browser profiling

- Re-profile sidebar clicks across Project Info, WBS, Tasks, Architecture, and Procurement.
- Confirm duplicate startup requests are reduced.
- Confirm no repeated 400 requests are generated during tab switching.

## Expected result

After the fix, moving from one module/tab/button to another should feel near-instant after first load, and the app should stop behaving like every click triggers a full page refresh.

## Out of scope

- No UI redesign.
- No database schema changes unless profiling proves a missing index is the real bottleneck.
- No changes to permissions or business workflows.