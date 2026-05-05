## Problem

The app fails to compile and no page can load. Vite reports:

```
src/components/wbs/WbsGantt.tsx:483:79: Expected ")" but found "}"
```

Line 483 contains an orphaned fragment left over from a previous edit:

```tsx
482:    return (
483:      setActiveTooltip(open ? (row.kind + row.id) : null)}>
484:        <div
```

The `setActiveTooltip(...)}>` is the tail of a removed `<Tooltip onOpenChange={(open) => ...}>` wrapper. The inner `<div>...</div>` (lines 484–516) is already balanced and is the actual JSX being returned.

## Fix

Delete line 483 entirely so the `return (` flows directly into `<div ...>`:

```tsx
return (
  <div
    className={cn(
      "absolute shadow-sm overflow-visible border cursor-default",
      summaryTone.shell,
    )}
    ...
```

No other changes needed — the rest of the block (closing `</div>);` on line 517) is already correct.

## File

- `src/components/wbs/WbsGantt.tsx` — remove stray line 483
