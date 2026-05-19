ALTER TABLE public.telegram_outbox 
  ADD COLUMN IF NOT EXISTS message_id BIGINT,
  ADD COLUMN IF NOT EXISTS message_text TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID;
CREATE INDEX IF NOT EXISTS idx_telegram_outbox_entity ON public.telegram_outbox(entity_type, entity_id, chat_id);