## Problem

In the screenshot, gaps **1** (between sidebar and main content) and **2** (between content and the right edge of the window) make the page feel cramped in the middle and wasteful on the sides.

The cause is in `src/components/AppLayout.tsx`:

```tsx
<main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
```

- `p-6 lg:p-8` adds 24–32px padding on every side of `<main>`.
- `max-w-[1600px] mx-auto` caps content width and centers it. Even when the viewport is below 1600px, this combined with the sidebar leaves visible empty bands on both sides of wide tables.
- The Projects table itself stretches to fill its container, so once the outer cage shrinks, the table breathes and the dead space disappears.

## Fix

Edit `src/components/AppLayout.tsx` only — one line:

**Before**
```tsx
<main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
```

**After**
```tsx
<main className="flex-1 px-4 lg:px-6 py-6 w-full min-w-0">
```

Changes:
1. **Remove `max-w-[1600px] mx-auto`** so main content uses the full available width next to the sidebar (gap **2** disappears).
2. **Reduce horizontal padding** to `px-4 lg:px-6` (16–24px) so content sits closer to the sidebar (gap **1** shrinks). Keep `py-6` for vertical breathing room.
3. **Add `min-w-0`** to keep flex children (wide tables, Gantt, schedule grids) from forcing horizontal overflow.

## Scope

- Only `src/components/AppLayout.tsx` is touched.
- All pages benefit automatically (Projects, WBS, Tasks, Reports, etc.) — no per-page changes needed.
- No responsive regressions: the mobile/tablet `ViewportGuard` (≥768px) still applies, and `px-4` is a safe minimum at every breakpoint.
- No changes to the sidebar, header, or `ProjectSwitcher`.

## Optional follow-up (not included unless you want it)

If after this change the very widest screens (≥1920px ultrawide) feel too stretched on text-heavy pages, we can reintroduce a generous cap like `max-w-[1800px]` later, or apply max-widths only on specific pages (e.g. Dashboard) instead of globally.