## Problem

`src/pages/Structural.tsx` (Structural Engineering page) crashes with `wbsRes is not defined`. The `Promise.all([...])` fetches 4 queries (drawings, BBS, inspections, wbs_nodes) but the destructuring on line 63 only names 3 results — the 4th (`wbsRes`) is missing, while line 89 still tries to read `wbsRes.data`.

## Fix

Add the missing `wbsRes` name to the destructured array.

```ts
const [drawingsRes, bbsRes, inspectionsRes, wbsRes] = await Promise.all([
  // ...same 4 queries
]);
```

No other changes needed — the 4 supabase queries and downstream `setWbsNodes(wbsRes.data || [])` already exist and are correct.

## Files

- `src/pages/Structural.tsx` — line 63 destructuring tweak only.
