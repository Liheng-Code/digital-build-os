# Telegram Settings: Brief preferences UI

Add a Daily Briefs section to the existing `TelegramTab` so linked users can configure morning and evening brief delivery times and their timezone from the web app. Values feed the existing `telegram_brief_prefs` table consumed by the `telegram-briefs` edge function.

## What the user sees

A new card section appears below the Connected state (only when Telegram is linked):

- Morning Brief — toggle on/off + time picker (defaults 08:00 when enabled, null = off)
- Evening Wrap — toggle on/off + time picker (defaults 18:00 when enabled, null = off)
- Timezone — searchable select of IANA zones (defaults to detected browser zone)
- Save button (disabled until dirty), with toast feedback
- Helper text explaining briefs are sent at the chosen local time on the selected timezone, in 15-minute increments

When Telegram is not linked, the briefs section is hidden (linking is prerequisite).

## Technical details

1. New service `src/services/telegramBriefService.ts`
   - `getBriefPrefs(userId)` -> reads single row from `telegram_brief_prefs`
   - `upsertBriefPrefs(userId, { morning_at, evening_at, timezone })` -> upsert by `user_id`

2. Extend `TelegramTab.tsx`
   - Load prefs alongside status (parallel) when linked
   - Local form state: `morningEnabled`, `morningTime`, `eveningEnabled`, `eveningTime`, `timezone`
   - Time picker: native `<input type="time" step="900">` (15-min increments to match cron slots)
   - Timezone: shadcn Select populated from `Intl.supportedValuesOf('timeZone')` with browser zone as default; falls back to a curated short list if unsupported
   - Save handler converts enabled+time to `"HH:MM:00"` or `null`, calls upsert, refreshes

3. No DB/schema changes — table and RLS already exist.

## Out of scope

Per-project brief filters, weekly digests, push to mobile.
