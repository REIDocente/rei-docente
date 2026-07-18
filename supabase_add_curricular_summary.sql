-- Migration: Add curricular_summary column to plannings table
-- Run this in the Supabase SQL Editor if you have an existing database setup.

ALTER TABLE public.plannings 
ADD COLUMN IF NOT EXISTS curricular_summary TEXT;
