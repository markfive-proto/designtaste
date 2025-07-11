-- Temporary development policies to allow unauthenticated access
-- Run this in Supabase SQL Editor for development only
-- Remember to remove these and implement proper auth for production

-- Clean up any existing development policies first
DROP POLICY IF EXISTS "Allow anonymous inserts for development" ON public.processing_queue;
DROP POLICY IF EXISTS "Allow anonymous selects for development" ON public.processing_queue;
DROP POLICY IF EXISTS "Allow anonymous updates for development" ON public.processing_queue;
DROP POLICY IF EXISTS "Allow anonymous deletes for development" ON public.processing_queue;

-- Clean up existing policies for related tables
DROP POLICY IF EXISTS "Allow anonymous selects on analyses for development" ON public.element_analyses;
DROP POLICY IF EXISTS "Allow anonymous inserts on analyses for development" ON public.element_analyses;
DROP POLICY IF EXISTS "Allow anonymous updates on analyses for development" ON public.element_analyses;

DROP POLICY IF EXISTS "Allow anonymous selects on inspirations for development" ON public.inspirations;
DROP POLICY IF EXISTS "Allow anonymous inserts on inspirations for development" ON public.inspirations;
DROP POLICY IF EXISTS "Allow anonymous updates on inspirations for development" ON public.inspirations;

DROP POLICY IF EXISTS "Allow anonymous selects on generated_code for development" ON public.generated_code;
DROP POLICY IF EXISTS "Allow anonymous inserts on generated_code for development" ON public.generated_code;
DROP POLICY IF EXISTS "Allow anonymous updates on generated_code for development" ON public.generated_code;

-- Allow anonymous inserts for development
DROP POLICY IF EXISTS "Users can insert their own queue items" ON public.processing_queue;
CREATE POLICY "Allow anonymous inserts for development" ON public.processing_queue
  FOR INSERT WITH CHECK (true);

-- Allow anonymous selects for development  
DROP POLICY IF EXISTS "Users can view their own queue items" ON public.processing_queue;
CREATE POLICY "Allow anonymous selects for development" ON public.processing_queue
  FOR SELECT USING (true);

-- Allow anonymous updates for development
DROP POLICY IF EXISTS "Users can update their own queue items" ON public.processing_queue;
CREATE POLICY "Allow anonymous updates for development" ON public.processing_queue
  FOR UPDATE USING (true);

-- Allow anonymous deletes for development
DROP POLICY IF EXISTS "Users can delete their own queue items" ON public.processing_queue;
CREATE POLICY "Allow anonymous deletes for development" ON public.processing_queue
  FOR DELETE USING (true);

-- Allow anonymous access to element_analyses table for development
DROP POLICY IF EXISTS "Users can view analyses for their elements" ON public.element_analyses;
CREATE POLICY "Allow anonymous selects on analyses for development" ON public.element_analyses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert analyses for their elements" ON public.element_analyses;
CREATE POLICY "Allow anonymous inserts on analyses for development" ON public.element_analyses
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update analyses for their elements" ON public.element_analyses;
CREATE POLICY "Allow anonymous updates on analyses for development" ON public.element_analyses
  FOR UPDATE USING (true);

-- Allow anonymous access to inspirations table for development
DROP POLICY IF EXISTS "Users can view inspirations for their elements" ON public.inspirations;
CREATE POLICY "Allow anonymous selects on inspirations for development" ON public.inspirations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert inspirations for their elements" ON public.inspirations;
CREATE POLICY "Allow anonymous inserts on inspirations for development" ON public.inspirations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update inspirations for their elements" ON public.inspirations;
CREATE POLICY "Allow anonymous updates on inspirations for development" ON public.inspirations
  FOR UPDATE USING (true);

-- Allow anonymous access to generated_code table for development
DROP POLICY IF EXISTS "Users can view code for their elements" ON public.generated_code;
CREATE POLICY "Allow anonymous selects on generated_code for development" ON public.generated_code
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert code for their elements" ON public.generated_code;
CREATE POLICY "Allow anonymous inserts on generated_code for development" ON public.generated_code
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update code for their elements" ON public.generated_code;
CREATE POLICY "Allow anonymous updates on generated_code for development" ON public.generated_code
  FOR UPDATE USING (true);