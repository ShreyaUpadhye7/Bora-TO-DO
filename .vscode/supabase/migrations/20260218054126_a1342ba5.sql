
-- Add category and severity columns to todos
ALTER TABLE public.todos ADD COLUMN category TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE public.todos ADD COLUMN severity INTEGER NOT NULL DEFAULT 3;
