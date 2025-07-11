-- Quick fix for RLS policies causing processing errors
-- Run this in Supabase SQL Editor to fix the immediate issue

-- First, let's check if the policies exist and drop them safely
DO $$
BEGIN
    -- Drop and recreate policies for element_analyses table
    DROP POLICY IF EXISTS "Users can view analyses for their elements" ON public.element_analyses;
    DROP POLICY IF EXISTS "Users can insert analyses for their elements" ON public.element_analyses;
    DROP POLICY IF EXISTS "Allow anonymous access to analyses for development" ON public.element_analyses;
    DROP POLICY IF EXISTS "Allow anonymous selects on analyses for development" ON public.element_analyses;
    DROP POLICY IF EXISTS "Allow anonymous inserts on analyses for development" ON public.element_analyses;
    DROP POLICY IF EXISTS "Allow anonymous updates on analyses for development" ON public.element_analyses;
    
    -- Create new permissive policies for element_analyses
    EXECUTE 'CREATE POLICY "Dev - allow all on element_analyses" ON public.element_analyses FOR ALL USING (true) WITH CHECK (true)';
    
    -- Drop and recreate policies for inspirations table
    DROP POLICY IF EXISTS "Users can view inspirations for their elements" ON public.inspirations;
    DROP POLICY IF EXISTS "Users can insert inspirations for their elements" ON public.inspirations;
    DROP POLICY IF EXISTS "Allow anonymous access to inspirations for development" ON public.inspirations;
    DROP POLICY IF EXISTS "Allow anonymous selects on inspirations for development" ON public.inspirations;
    DROP POLICY IF EXISTS "Allow anonymous inserts on inspirations for development" ON public.inspirations;
    DROP POLICY IF EXISTS "Allow anonymous updates on inspirations for development" ON public.inspirations;
    
    -- Create new permissive policies for inspirations
    EXECUTE 'CREATE POLICY "Dev - allow all on inspirations" ON public.inspirations FOR ALL USING (true) WITH CHECK (true)';
    
    -- Drop and recreate policies for generated_code table
    DROP POLICY IF EXISTS "Users can view code for their elements" ON public.generated_code;
    DROP POLICY IF EXISTS "Users can insert code for their elements" ON public.generated_code;
    DROP POLICY IF EXISTS "Allow anonymous access to generated code for development" ON public.generated_code;
    DROP POLICY IF EXISTS "Allow anonymous selects on generated_code for development" ON public.generated_code;
    DROP POLICY IF EXISTS "Allow anonymous inserts on generated_code for development" ON public.generated_code;
    DROP POLICY IF EXISTS "Allow anonymous updates on generated_code for development" ON public.generated_code;
    
    -- Create new permissive policies for generated_code
    EXECUTE 'CREATE POLICY "Dev - allow all on generated_code" ON public.generated_code FOR ALL USING (true) WITH CHECK (true)';
    
    RAISE NOTICE 'RLS policies fixed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
END $$;