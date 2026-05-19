CREATE TABLE public.telegram_conversation_state (
  chat_id bigint PRIMARY KEY,
  user_id uuid NOT NULL,
  task_id uuid NOT NULL,
  step text NOT NULL CHECK (step IN ('awaiting_progress','awaiting_status','awaiting_note')),
  progress_pct integer,
  status text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_conversation_state ENABLE ROW LEVEL SECURITY;
-- No policies = service role only access.