# In-chat Progress Update Flow (Telegram)

Let assignees update a task's **progress %**, **status**, and an **optional note** by replying inside the Telegram chat — no Mini App round-trip needed. The existing Mini App button stays as a secondary option.

## What the user sees in Telegram

1. Notification message arrives with three buttons:
   - `✍️ Update Progress` (new — starts the in-chat flow)
   - `📈 Open Mini App` (kept)
   - `🌐 Update in Browser` (kept)

2. Tapping `✍️ Update Progress`:
   ```text
   Bot: Reply with progress % for "Install rebar grid B2" (T-0042).
        Send a number 0–100.
        Reply /cancel to abort.
   ```

3. User types `65` →
   ```text
   Bot: Pick a status:
        [ In Progress ] [ Pending Approval ] [ Blocked ] [ Keep current ]
   ```

4. User taps a status →
   ```text
   Bot: Add a note? Reply with text, or /skip.
   ```

5. User types note or `/skip` →
   ```text
   Bot: ✅ Task updated
        Task: Install rebar grid B2 (T-0042)
        Progress: 65%
        Status: In Progress
        Note: Concrete pour delayed
   ```

`/cancel` at any step ends the flow.

## Technical changes

### 1. New table: `telegram_conversation_state`
Tracks the multi-step conversation per chat.

| column            | type        | notes                                    |
|-------------------|-------------|------------------------------------------|
| chat_id           | bigint PK   | one active flow per chat                 |
| user_id           | uuid        | linked DCOS user                         |
| task_id           | uuid        | task being updated                       |
| step              | text        | `awaiting_progress` \| `awaiting_status` \| `awaiting_note` |
| progress_pct      | int         | filled after step 1                      |
| status            | text        | filled after step 2                      |
| expires_at        | timestamptz | 15-min TTL                               |
| updated_at        | timestamptz |                                          |

RLS: service-role only (webhook writes via service key).

### 2. Edit `supabase/functions/telegram-notify/index.ts`
Add a third inline-keyboard button with `callback_data: "upd:<task_id>"`.

### 3. Edit `supabase/functions/telegram-webhook/index.ts`
- Accept `callback_query` updates (register in `setWebhook` allowed_updates).
- On `callback_data = upd:<task_id>`: verify assignment, write state `awaiting_progress`, prompt for number.
- On text reply while state exists:
  - `awaiting_progress`: parse 0–100 → save → prompt status with inline keyboard `st:in_progress`, `st:pending_approval`, `st:blocked`, `st:keep`.
  - `awaiting_note`: save note → finalize via existing `telegram-task-update` logic → clear state → send confirmation.
- On `callback_data = st:<value>`: save status → prompt for note.
- Handle `/cancel` and `/skip`.
- Expire states older than 15 min.

### 4. Extract shared update logic
Move the task-update body (insert task_update, update tasks, send confirmation) from `telegram-task-update/index.ts` into a small shared helper inlined in both functions — or have the webhook call `telegram-task-update` internally with a service-key bypass. Simplest: inline a `finalizeTaskUpdate(db, …)` helper in the webhook file.

### 5. Update Telegram `setWebhook` allowed_updates
Add `callback_query` to the list. (One-time call via gateway.)

## Out of scope
- Reordering/removing existing notification buttons (keeping both Mini App and Browser).
- Voice-note or photo updates.
- Group-chat flows (state is per chat_id and assumes 1 user per linked chat).
