# Supabase Setup Instructions

## Fix RLS Policy Error

You're getting an "Analysis storage error: new row violates row-level security policy" because the development policies need to be applied to your Supabase database.

Since you got a "policy already exists" error, let's use the quick fix approach instead.

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to "SQL Editor" in the left sidebar

### Step 2: Run Quick Fix

Copy and paste the contents of `supabase/fix_rls_policies.sql` into the SQL Editor and run it.

**Or copy this SQL directly:**

```sql
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
```

This script will:
1. Safely drop any existing conflicting policies
2. Create new permissive policies for development
3. Show you a success message when complete

### Alternative: Full Development Policies

If you prefer to run the complete development policies, first run this cleanup:

```sql
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
```

### Step 3: Verify Policies

After running the SQL, you should see success messages for each policy creation. 

### Step 4: Test Processing

1. Clear your current queue: Visit http://localhost:3001/dashboard and click "Clear Queue"
2. Use the Chrome extension to select a new element
3. Check the dashboard to see if processing completes successfully

## Important Notes

- These policies are for **development only** - they allow anonymous access to all tables
- For production, you'll need to implement proper authentication-based policies
- The policies will persist until you manually remove them or redeploy your database schema

## Troubleshooting

If you still get RLS errors after running the policies:

1. Double-check that the policies were created successfully in the SQL Editor
2. Try refreshing your browser and testing again
3. Check the browser console and server logs for more detailed error messages