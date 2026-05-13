# Drag-and-Drop Dependency Linking on Gantt

Replace the current "select two tasks → click Link Tasks (FS)" flow with a direct, MS Project-style drag from one task bar to another. The dependency relation type is determined by which **end** of each bar the user drags from and drops onto.

## Relation mapping (MS Project standard)

| From end (predecessor) | To end (successor) | Relation |
|---|---|---|
| Finish (right) | Start (left)  | **FS** — Finish-to-Start |
| Start (left)   | Start (left)  | **SS** — Start-to-Start |
| Finish (right) | Finish (right)| **FF** — Finish-to-Finish |
| Start (left)   | Finish (right)| **SF** — Start-to-Finish |

(The user listed FS twice; treating the duplicate as FF, which is the standard fourth MS Project type.)

## UX

- Each task bar in `WbsGantt.tsx` gets two small **circular connection handles** — one at the left edge (Start) and one at the right edge (Finish).
- Handles are subtle by default and **highlight on row hover**; cursor becomes a crosshair over them.
- **Mousedown on a handle** starts a linking drag:
  - A dashed rubber-band SVG line follows the cursor from the source handle.
  - Other task bars highlight their two handles as drop targets when the cursor enters them.
- **Mouseup on another task's handle** creates the dependency with the relation derived from the table above (lag = 0).
- Mouseup elsewhere cancels the drag (no toast spam).
- Self-link and duplicate links are blocked with a single `toast.error`.
- After successful insert: `toast.success("Linked: <PRED> → <SUCC> (FS|SS|FF|SF)")` and the predecessor list refreshes (same path the existing edit flow uses).

## Interaction modes

- Linking handles are active **whenever the user is not in "Edit" mode** (Edit mode is reserved for drag-to-shift bars). This avoids the conflict already noted in the Phase 1 plan between bar-drag and link-drag.
- The existing **two-click "Link Tasks (FS)" toolbar** in `Wbs.tsx` (lines 452–476) is removed since drag-and-drop replaces it. `selectedTaskId` selection on bar click is preserved for highlighting / dependency-edit access.

## Files to change

**`src/components/wbs/WbsGantt.tsx`**
- Add a new prop `onCreateLink?: (predecessorId: string, taskId: string, relation: "FS"|"SS"|"FF"|"SF") => void`.
- Add internal state `linkDrag: { fromTaskId, fromEnd: "start"|"finish", cursorX, cursorY } | null`.
- Render two handle dots per task bar (skip milestones — single center handle that acts as both start & finish; map by horizontal direction of drop).
- Add `onMouseDown` on each handle → start linking drag (stop propagation so it doesn't trigger move-drag).
- Window `mousemove` updates cursor coords; window `mouseup` resolves drop:
  - Use `document.elementFromPoint` (or hit-test against handle bounding rects we maintain in a ref map) to find target handle → resolve relation.
- Render a dashed rubber-band `<line>` inside the existing SVG layer while dragging.

**`src/pages/Wbs.tsx`**
- Remove the Link Tasks toolbar block (lines 452–476) and the `secondTaskId` plumbing for that toolbar (keep `selectedTaskId` for highlight only).
- Implement `onCreateLink` handler: insert into `task_predecessors` (matches existing pattern in `TaskDependenciesSection.tsx`) and refresh the predecessors list using the same code already in the edit-dialog `onSave` (lines 549–562).
- Pass `onCreateLink` to `<WbsGantt>`.

## Out of scope

- Lag editing during drag (still 0 on create; user edits via existing dependency dialog).
- Dragging dependency endpoints to re-route an existing link (future).
- Touch/pen support (mouse only, matches existing drag-to-shift).

## Risks

- Drop hit-testing on small 8px handles can feel finicky → use a 14px invisible hit area around each visible 8px dot.
- Handles must not block bar-click selection → handles use `stopPropagation` on mousedown only when the user actually starts a link drag (>3px movement); a pure click on a handle falls through as a bar click.
