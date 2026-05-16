# Fix slow tab-to-tab navigation

## Summary of the issue

Switching between tabs (sidebar links) feels heavy because of three compounding problems in `src/App.tsx` and the routing shell:

1. **No code-splitting.** All ~64 page components (Tasks, WBS, Financials, Reports, Construction, HR, etc.) are statically imported at the top of `src/App.tsx`. That ships one giant JS bundle and forces React to instantiate every module up front — first paint and every subsequent navigation pay the cost.
2. **AppLayout remounts on every route change.** Each `<Route>` wraps its page in `<ProtectedRoute><AppLayout>...</AppLayout></ProtectedRoute>`. Because the layout element is recreated per route, React unmounts and remounts the sidebar, topbar, project switcher, notification bell, etc. on every tab click — re-running their effects and refetching their data.
3. **React Query has no defaults.** `new QueryClient()` uses `staleTime: 0` and `refetchOnWindowFocus: true`. Every navigation refetches data that was just fetched, and just focusing the tab triggers refetches.

Together this is why tab switching feels like a full page refresh.

## Fix plan

### 1. Lazy-load page routes
- Convert all `import Page from "./pages/..."` in `src/App.tsx` to `const Page = React.lazy(() => import("./pages/..."))`.
- Wrap `<Routes>` in `<React.Suspense fallback={<PageLoader />}>` with a lightweight skeleton/spinner.
- Keep `Auth`, `ResetPassword`, `NotFound`, and `Index` eager (small, used immediately) — optional.

Result: initial bundle drops dramatically and each tab only loads its own chunk once, then is cached.

### 2. Hoist the layout into a parent route
Replace the repeated `<ProtectedRoute><AppLayout>...</AppLayout></ProtectedRoute>` wrappers with a single layout route using react-router v6 `Outlet`:

```text
<Route element={<ProtectedRoute><AppLayout><Outlet/></AppLayout></ProtectedRoute>}>
  <Route path="/" element={<Index/>} />
  <Route path="/projects" element={<Projects/>} />
  ...
</Route>
```

Now AppLayout (sidebar, topbar, project switcher) stays mounted across tab navigations — only the page content swaps. This alone removes most of the visible "refresh".

### 3. Set sane React Query defaults
In `src/App.tsx`:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

Stops redundant refetches when switching tabs or refocusing the browser.

### 4. (Optional, low risk) Small follow-ups
- Add `React.memo` to `AppLayout`'s sidebar/topbar children if they re-render on context change.
- Verify `NotificationBell` and `ProjectSwitcher` don't poll on mount in a tight loop (only once now that they don't remount).

## Out of scope
- No data model changes, no Supabase/RLS changes, no visual redesign.
- Existing page logic stays the same — only how they are loaded and wrapped changes.

## Files touched
- `src/App.tsx` — lazy imports, Suspense, layout route, QueryClient defaults.
- (Possibly) `src/components/AppLayout.tsx` — accept `children` already; switch to `<Outlet/>` if we convert.

## Risk
Low. Behavior is identical; navigation just becomes near-instant after the first visit to each tab.
