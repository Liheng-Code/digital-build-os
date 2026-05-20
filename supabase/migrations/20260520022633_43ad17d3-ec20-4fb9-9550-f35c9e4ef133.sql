
-- Brief preferences (per user)
CREATE TABLE IF NOT EXISTS public.telegram_brief_prefs (
  user_id      uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  morning_at   time,
  evening_at   time,
  timezone     text NOT NULL DEFAULT 'UTC',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_brief_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own brief prefs"
  ON public.telegram_brief_prefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own brief prefs"
  ON public.telegram_brief_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own brief prefs"
  ON public.telegram_brief_prefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own brief prefs"
  ON public.telegram_brief_prefs FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public._tg_brief_prefs_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_tg_brief_prefs_touch ON public.telegram_brief_prefs;
CREATE TRIGGER trg_tg_brief_prefs_touch
  BEFORE UPDATE ON public.telegram_brief_prefs
  FOR EACH ROW EXECUTE FUNCTION public._tg_brief_prefs_touch();

-- Delivery idempotency log
CREATE TABLE IF NOT EXISTS public.telegram_brief_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brief_kind  text NOT NULL CHECK (brief_kind IN ('morning','evening')),
  local_date  date NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, brief_kind, local_date)
);

ALTER TABLE public.telegram_brief_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own brief log"
  ON public.telegram_brief_log FOR SELECT
  USING (auth.uid() = user_id);

-- Scheduling extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
