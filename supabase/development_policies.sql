-- Temporary development policies to allow unauthenticated access
-- Run this in Supabase SQL Editor for development only
-- Remember to remove these and implement proper auth for production

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

-- Allow anonymous access to related tables for development
DROP POLICY IF EXISTS "Users can view analyses for their elements" ON public.element_analyses;
CREATE POLICY "Allow anonymous access to analyses for development" ON public.element_analyses
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view inspirations for their elements" ON public.inspirations;
CREATE POLICY "Allow anonymous access to inspirations for development" ON public.inspirations
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view code for their elements" ON public.generated_code;
DROP POLICY IF EXISTS "Users can insert code for their elements" ON public.generated_code;
CREATE POLICY "Allow anonymous access to generated code for development" ON public.generated_code
  FOR ALL USING (true);