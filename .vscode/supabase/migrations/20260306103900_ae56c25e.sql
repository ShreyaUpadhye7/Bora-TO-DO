
CREATE TABLE public.virtual_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pet_type text NOT NULL DEFAULT 'koya',
  pet_name text NOT NULL DEFAULT 'My Pet',
  hunger integer NOT NULL DEFAULT 80,
  happiness integer NOT NULL DEFAULT 80,
  cleanliness integer NOT NULL DEFAULT 80,
  energy integer NOT NULL DEFAULT 80,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  coins integer NOT NULL DEFAULT 50,
  last_fed timestamp with time zone DEFAULT now(),
  last_played timestamp with time zone DEFAULT now(),
  last_cleaned timestamp with time zone DEFAULT now(),
  last_slept timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.virtual_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pet" ON public.virtual_pets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pet" ON public.virtual_pets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pet" ON public.virtual_pets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
