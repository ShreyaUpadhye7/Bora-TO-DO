ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS is_all_day boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_offset text DEFAULT NULL;
-- reminder_offset values: '1h', '1d', '1w', '1m', or NULL for none
