# Telegram Bot UX Upgrade — Workspace, Dashboard, Tasks, Briefs

Turn the bot from a notification responder into a self-serve mobile control center. All work is server-side in `telegram-webhook` plus one new scheduled function and a small Settings UI addition. No changes to the React task pages.

## 1. Persistent reply keyboard (always visible)

Replace the single `☰ Main Menu` button with a 2-row docked keyboard that follows the user everywhere:

```text
[ 📊 Dashboard ]  [ 📋 My Tasks ]  [ ➕ Update ]
[ ⏰ Due Today ]  [ ⚠️ Overdue  ]  [ ⚙️ Settings ]
```

- Set via `reply_markup: { keyboard, resize_keyboard: true, is_persistent: true }` on every bot reply.
- Also register `/start /dashboard /mytasks /today /overdue /update /settings /help` via `setMyCommands` so the slash menu mirrors it.
- `/start` (no code) shows a welcome card + the keyboard. `/start CODE` still links accounts.

## 2. Dashboard (📊)

Cross-project rollup for the logged-in user. One card, no pagination.

```text
📊 My Dashboard

🟢 Completed       5
🟡 In Progress     8
🔴 Overdue         3
⚪ Not Started     2

📅 Due Today       4
🔥 Completion 30d  62%

[ 📋 My Tasks ] [ ⏰ Due Today ] [ ⚠️ Overdue ]
```

- "Completion 30d" = completed in last 30 days ÷ (completed + still-open assigned in same window).
- Numbers come from `tasks` joined to `task_assignments` where assignee = linked user, across every project they belong to.

## 3. My Tasks — filtered, paginated list (📋)

Inline tabs at the top, 5 tasks per page, inline pager.

```text
📋 My Tasks  ·  Page 1/4
Filter: [All] [Today] [Overdue] [Active] [Done]

1. AI Automation                    PRJ-A
   🟡 In Progress · 60% · due Fri
2. Pile Cap Design                  PRJ-B
   🔴 Overdue · 20%  · due Mon
3. Shop Drawing Review              PRJ-A
   🟢 Completed
…

[⬅ Prev]  [Next ➡]
[1] [2] [3] [4] [5]   ← view buttons, one per task on this page
```

- Filter buttons re-render the same card (`editMessageText`) with a new query.
- Tapping a number opens the **existing task detail card** (already built — reused as Level 2).
- All status/progress/note actions on the detail card stay exactly as they are today (Level 3).

## 4. Quick Update entry point (➕)

`➕ Update` taps reuse the in-place editable update card, but prepend a picker:

```text
✍️ Update which task?
1. AI Automation        🟡 60%
2. Pile Cap Design      🔴 20%
3. Shop Drawing Review  🟢 ✓
[⬅ Prev] [Next ➡]
```

Picking a task jumps straight into the existing Progress → Status → Note flow. No duplicate code path.

## 5. Inline search (`@dcos_alerts_bot pile`)

Telegram's inline mode — typing the bot username in any chat opens a live dropdown of matching tasks.

- Handle `inline_query` updates in the webhook.
- Query: case-insensitive match on `title` or `code`, limit 20, scoped to the inviting user's assigned tasks across projects.
- Each result is an `InlineQueryResultArticle` whose tap sends a compact summary message with a `[🔎 Open]` button → opens the task detail card in DM with the bot.
- Register `setMyCommands` and ensure `allowed_updates` includes `inline_query` when calling `setWebhook`.

## 6. Settings (⚙️) — briefs opt-in + unlink

Two surfaces, kept in sync:

- **Bot card**: tap ⚙️ → card with toggles `[Morning brief: 08:00]` `[Evening brief: 18:00]` `[Timezone: Asia/Singapore]` `[Unlink]`. Time taps cycle through `Off · 07:00 · 08:00 · 09:00`.
- **Web** (`src/components/settings/TelegramTab.tsx`): same toggles + a proper time-of-day picker and IANA timezone select, only shown when linked.

Both write to a new table.

## 7. Morning + Evening briefs (scheduled)

A new edge function `telegram-briefs` runs every 15 minutes via `pg_cron + pg_net`. For each user whose local time matches their `morning_at` or `evening_at` (rounded to the slot), it sends:

```text
🌅 Morning Brief
📌 Today: 4 tasks due
⚠️ Overdue: 2
👉 Tap 📋 My Tasks
```

```text
🌙 Daily Wrap
✅ Completed today: 2
📈 Progress updated: 5
Keep pushing.
```

Each user gets one morning + one evening message per local day; idempotency via `(user_id, brief_kind, local_date)` unique row in `telegram_brief_log`.

---

## Technical details

### Files

- `supabase/functions/telegram-webhook/index.ts`
  - Helper `mainKeyboard()` returning the persistent reply keyboard; attach it to every outbound `sendMessage` that isn't an in-place card edit.
  - Add command/text routes: `/dashboard`, `/mytasks`, `/today`, `/overdue`, `/update`, `/settings`, and the matching button labels.
  - New render helpers: `renderDashboard`, `renderTaskList(filter, page)`, `renderTaskPicker(page)`, `renderSettings`.
  - New callback prefixes: `list:<filter>:<page>`, `open:<taskId>`, `pick:<taskId>`, `set:morning:<slot>`, `set:evening:<slot>`, `set:tz:<id>`.
  - New `inline_query` handler returning up to 20 `InlineQueryResultArticle` items.
  - Call `setMyCommands` once on cold start (cached in memory).
- `supabase/functions/telegram-briefs/index.ts` — new. Loops users with prefs, renders + sends, writes log row.
- `src/components/settings/TelegramTab.tsx` — add brief preferences UI (only when linked) calling existing supabase client.
- Migrations:
  - `telegram_brief_prefs(user_id pk, morning_at time null, evening_at time null, timezone text default 'UTC', updated_at)` with RLS allowing owner select/upsert.
  - `telegram_brief_log(id, user_id, brief_kind text check in ('morning','evening'), local_date date, sent_at, unique(user_id,brief_kind,local_date))` — service-role only.
  - `pg_cron` schedule that POSTs to the briefs function every 15 minutes.

### Webhook registration

Re-run `setWebhook` so `allowed_updates` includes `inline_query` (currently only `message`, `callback_query`). Done from the sandbox per the Telegram skill.

### Reuses (no rewrites)

- The existing editable update card (Progress → Status → Note → summary).
- The existing task detail keyboard (`buildTaskKeyboard`) and Received-Task / Update-Status / Open-in-DCOS buttons.
- The existing `tgSendMessage` / `tgEditMessage` helpers.

## Out of scope

- Group chats / multi-user single chat_id.
- Translations.
- Push notifications for newly-created tasks (already covered by `telegram-notify`).
- Charts / images inside Telegram messages.

## Open question to decide during build

Brief slot granularity: cron every 15 minutes means users pick from `:00 / :15 / :30 / :45`. If you'd rather offer free-form HH:MM, change cron to every 5 minutes.
