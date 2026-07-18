-- ==========================================
-- DIDAKTA DATABASE SCHEMA
-- Execute this in the Supabase SQL Editor
-- ==========================================

-- 1. Create plannings table
CREATE TABLE IF NOT EXISTS public.plannings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT NOT NULL,
    learning_objective TEXT NOT NULL,
    unit TEXT NOT NULL,
    reference_url TEXT,
    reference_document_name TEXT,
    content JSONB NOT NULL,
    reading_level JSONB NOT NULL,
    curricular_summary TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.plannings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Users can insert their own plannings" 
ON public.plannings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own plannings" 
ON public.plannings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own plannings" 
ON public.plannings 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plannings" 
ON public.plannings 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Enable indexes for faster querying
CREATE INDEX IF NOT EXISTS plannings_user_id_idx ON public.plannings (user_id);
CREATE INDEX IF NOT EXISTS plannings_created_at_idx ON public.plannings (created_at DESC);
