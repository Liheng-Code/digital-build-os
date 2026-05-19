# Telegram Flow Polish: Dedupe Assign + In-Place Card Update

Two changes, both server-side. No UI changes in the React app.

## 1. Remove duplicate "Task assigned" notification

Today, when a task is created/assigned, two notifications fire:

- From `task_assignments` insert trigger → "You were assigned a task" (per assignee)
- From `tasks` status-change trigger → "Task assigned" (sent to every current assignee)

Both produce a Telegram message of the same `task_assigned` type. Remove the second one.

**Change:** New migration that updates the `tasks` status trigger function to skip the `WHEN 'assigned'` branch entirely. The `task_assignments` trigger remains the single source of truth for "you got assigned" alerts. Other status transitions (started, submitted, approved, etc.) are untouched.

## 2. In-chat Update flow as a single editable card

Today, each step posts a brand-new message in the chat. Replace this with one card that is edited in place at each step, then turns into the final summary at the end. Every step has a Back button.

### Step states (rendered inside the same message)

```text
┌──────────────────────────────────────────┐
│ ✍️ Update Progress                       │
│ Task: <title> (CODE)                     │
│ Current: 40% • In Progress               │
│ ───────────────────────────────────────  │
│ [step body — see below]                  │
└──────────────────────────────────────────┘
```

1. **Progress** — body: "Reply with a number 0–100." Keyboard: `[❌ Cancel]`
2. **Status** — body: "Progress: 60%. Pick a status." Keyboard:
   - Row 1: `In Progress` `Pending Approval`
   - Row 2: `Completed` `Blocked` `Keep current`
   - Row 3: `⬅ Back` `❌ Cancel`
3. **Note** — body: "Progress: 60% • Status: Completed. Reply with a note, or /skip." Keyboard: `[⬅ Back] [❌ Cancel]`
4. **Final summary** (replaces card, stays in chat):
   ```
   ✅ Task updated
   Task: <title> (CODE)
   Progress: 60%
   Status: Completed
   Note: <text or —>
   By: <user> at <time>
   ```

The card lives at the same message_id throughout, so the chat ends with one tidy summary right under the original task notification.

### Back behavior

- Back from Status → re-render Progress prompt, keep saved pct in state so it shows as default ("Last: 60%").
- Back from Note → re-render Status keyboard.
- Back is a callback button, no new message.

### Cancellation

- `❌ Cancel` button or `/cancel` text → edit card to: `❌ Update cancelled.` (no keyboard) and clear state.

### Where progress text input fits

Users still type the percentage as a chat message (Telegram has no inline numeric input). When they send the number:

- Validate 0–100. If invalid, edit the card to show `⚠️ Send a number 0–100.` and keep the same keyboard.
- On valid input, delete the user's typed number (`deleteMessage`) so the chat stays clean, then edit the card forward to the Status step.

Note replies behave the same way — accept text, delete the user message, edit card to summary.

## Technical details

Files touched:

- `supabase/migrations/<new>.sql` — replace `notify_task_status_changes()` (or equivalent) to drop the `assigned` branch.
- `supabase/functions/telegram-webhook/index.ts`:
  - Add `message_id` and `original_progress`/`original_status` columns usage on `telegram_conversation_state` (extend schema with `card_message_id bigint`).
  - Helpers: `editCard(chatId, messageId, text, keyboard)` calling `editMessageText`; `deleteMessage(chatId, messageId)`.
  - Rewrite callback handler to branch on `upd:`, `st:<value>`, `nav:back`, `nav:cancel`.
  - On `upd:` start: send initial card via `sendMessage`, store returned `message_id` in state.
  - On text in `awaiting_progress` / `awaiting_note`: validate, delete user message, edit card forward.
  - Render helpers `renderProgressStep`, `renderStatusStep`, `renderNoteStep`, `renderSummary`, `renderCancelled` so every transition uses the same template.
- Migration: `ALTER TABLE telegram_conversation_state ADD COLUMN card_message_id bigint;`

Reuses existing `finalizeTaskUpdate` for the DB write. No changes to the Mini App, browser link, or notification-fan-out logic.

## Out of scope

- Reordering the three buttons on the original task notification.
- Translations / non-English copy.
- Group chats with multiple linked users on one chat_id.
