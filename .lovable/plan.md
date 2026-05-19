# Telegram Bot Integration — Task & System Alerts

## Goal

Mirror in-app notifications to Telegram so team members get real-time alerts about their tasks (assigned, approved, rejected, overdue, blockers, etc.) on their phone. Phase 1 is **send-only**; schema is designed to extend to two-way replies later.

## Scope (Phase 1)

**Events mirrored to Telegram (when user is linked):**
- Task assigned / unassigned / reopened
- Task submitted for approval / approved / rejected
- Task overdue / blocker reported

**Out of scope for Phase 1:** receiving messages, slash commands, HSE/NCR/RFI/PR cross-module alerts, per-user channel preferences.

## User Linking

Both methods supported:

1. **Self-link via code (preferred)**
   - User opens Settings → Telegram, clicks "Link Telegram".
   - App generates a 6-char one-time code (10-min TTL), stored in `telegram_link_codes`.
   - User opens the bot in Telegram and sends `/start <code>`.
   - Bot webhook validates code, stores `chat_id` on the user's profile, marks code used.
2. **Admin override**
   - Org admin enters a user's `chat_id` directly in the member profile dialog.

Linked users see status + "Unlink" button in Settings.

## Architecture

```text
 createNotification()  ─────► notifications row (in-app, existing)
        │
        └──► after insert ──► telegram-notify edge function
                                    │
                                    ├─ look up recipient.telegram_chat_id
                                    ├─ skip if not linked or muted
                                    └─ POST sendMessage via connector gateway
                                          (Bearer LOVABLE_API_KEY + TELEGRAM_API_KEY)

 Bot webhook (telegram-webhook edge fn, verify_jwt=false)
        └─ handles /start <code> to link chat_id (Phase 1)
           Placeholder for future inbound commands.
```

## Database changes

- `profiles`: add `telegram_chat_id BIGINT NULL` (unique), `telegram_username TEXT NULL`, `telegram_linked_at TIMESTAMPTZ`.
- New table `telegram_link_codes`: `code TEXT PRIMARY KEY`, `user_id UUID`, `expires_at TIMESTAMPTZ`, `used_at TIMESTAMPTZ NULL`, `created_at`.
- New table `telegram_outbox` (idempotency + audit): `notification_id UUID PRIMARY KEY`, `chat_id BIGINT`, `status TEXT` (pending/sent/failed), `error TEXT NULL`, `sent_at`, `created_at`.
- RLS: users read/update only their own profile telegram fields; only service role writes outbox.

## Code changes

**Backend (edge functions):**
- `supabase/functions/telegram-notify/index.ts` — invoked by `createNotification` (or DB trigger → pg_net call). Reads recipient profile, formats message, calls gateway `sendMessage`, writes outbox row.
- `supabase/functions/telegram-webhook/index.ts` — public endpoint (`verify_jwt = false`), validates Telegram secret header, handles `/start <code>` linking.
- `supabase/config.toml` — add `[functions.telegram-webhook] verify_jwt = false`.

**Service layer:**
- `src/services/notificationEngineService.ts` — after successful `notifications` insert, fire-and-forget invoke `telegram-notify` with the new notification id (only for the 8 in-scope event types).
- `src/services/telegramLinkService.ts` (new) — `generateLinkCode()`, `unlinkTelegram()`, `getTelegramStatus()`.

**Frontend:**
- `src/components/settings/TelegramTab.tsx` (new) — shows linked status, "Link Telegram" button (displays code + bot deep-link `https://t.me/<bot>?start=<code>`), "Unlink" button. Added to existing Settings page tabs.
- `src/components/org/MemberFormDialog.tsx` — add admin-only `telegram_chat_id` input.

**Message format:** Title (bold), body, priority emoji, "Open in DCOS" link to `action_url` if present. Uses `parse_mode: HTML`.

## What I need from you

1. **Telegram bot** — Create one via [@BotFather](https://t.me/BotFather) on Telegram:
   - `/newbot` → choose name (e.g. "DCOS Alerts") and username (e.g. `dcos_alerts_bot`).
   - BotFather returns a **bot token**.
   - Send me back the **bot username** (so the deep-link works). I'll handle the token via the Lovable Telegram connector — you'll be prompted to paste it when I connect the connector.
2. **Confirmation to connect the Telegram connector** in this project (one-click after you have the token).
3. *(Optional)* Public published URL is fine; webhook will register against the Supabase edge function URL automatically — no extra hosting needed.

## Phase 2 (later, not built now)

- Inbound `/mytasks`, `/done <task-id>`, `/ack` commands.
- Per-user channel preference matrix (in_app / telegram / email per event type).
- Group chat alerts per project (HSE incidents → site safety group).
- Digest summaries (daily morning task list).

## Technical notes

- Uses Lovable Telegram **connector gateway** — bot token is never stored in code or `.env`; gateway injects it. Only `LOVABLE_API_KEY` + `TELEGRAM_API_KEY` env vars are used by edge functions.
- Webhook secret is derived from `TELEGRAM_API_KEY` via SHA-256 (per Lovable connector pattern) — no extra secret to manage.
- `telegram-notify` is fire-and-forget from the app; failures land in `telegram_outbox` with `status='failed'` and don't block in-app notifications.
- Idempotency: outbox PK on `notification_id` prevents duplicate sends on retry.
