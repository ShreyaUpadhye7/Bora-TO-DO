CREATE TABLE public.gratitude_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  entry_date date NOT NULL,
  jar_month text NOT NULL, -- format: "2026-03" (YYYY-MM)
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gratitude" ON public.gratitude_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gratitude" ON public.gratitude_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gratitude" ON public.gratitude_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gratitude" ON public.gratitude_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
