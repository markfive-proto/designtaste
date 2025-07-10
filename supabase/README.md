# Supabase Database Setup for DesignTaste

This directory contains the database schema and setup instructions for the DesignTaste application.

## Project Details

- **Supabase Project ID**: `gpcipgsdojphmgftaxes`
- **Project URL**: https://supabase.com/dashboard/project/gpcipgsdojphmgftaxes

## Setup Instructions

### 1. Run the Database Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/gpcipgsdojphmgftaxes
2. Navigate to the **SQL Editor** in the left sidebar
3. Copy the entire contents of `schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the schema

### 2. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://gpcipgsdojphmgftaxes.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

You can find these values in your Supabase dashboard under **Settings** > **API**.

### 3. Database Structure

The schema creates the following tables:

#### Core Tables
- **`user_profiles`** - Extends Supabase auth with user preferences
- **`projects`** - For organizing multiple elements
- **`processing_queue`** - Main table for elements being processed
- **`element_analyses`** - AI analysis results
- **`inspirations`** - Design inspiration results
- **`generated_code`** - AI-generated code improvements
- **`user_feedback`** - User ratings and feedback
- **`project_elements`** - Junction table for project organization

#### Enums
- **`element_status`**: `queued`, `processing`, `completed`, `error`
- **`component_type`**: `hero`, `card`, `form`, `navigation`, `button`, `layout`, `footer`, `sidebar`
- **`framework_type`**: `tailwind`, `nextjs`, `react`

### 4. Features Included

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Proper policies for SELECT, INSERT, UPDATE, DELETE operations

#### Automatic Triggers
- **User Profile Creation**: Automatically creates a user profile when a user signs up
- **Updated Timestamps**: Automatically updates `updated_at` fields when records are modified

#### Performance Optimizations
- Indexes on frequently queried columns
- Foreign key relationships for data integrity
- Efficient query patterns

### 5. Testing the Setup

After running the schema, you can test the setup by:

1. **Check Tables**: Go to **Table Editor** in your Supabase dashboard
2. **Verify RLS**: Check that RLS is enabled on all tables
3. **Test Authentication**: Try signing up a new user to test the automatic profile creation

### 6. API Integration

The application includes:
- TypeScript types in `types/database.ts`
- Supabase client configuration in `lib/supabase.ts`
- Helper functions for common database operations

### 7. Troubleshooting

#### Common Issues

1. **Permission Denied**: Make sure RLS policies are correctly set up
2. **Foreign Key Errors**: Ensure all referenced tables exist
3. **Type Errors**: Verify that the TypeScript types match the database schema

#### Reset Database

If you need to reset the database:
1. Go to **Settings** > **Database** in your Supabase dashboard
2. Click **Reset Database** (⚠️ This will delete all data)

### 8. Development vs Production

- **Development**: The schema includes sample data for testing
- **Production**: Remove sample data before deploying

### 9. Next Steps

After setting up the database:
1. Configure authentication in your Supabase dashboard
2. Set up storage buckets for screenshots (if needed)
3. Configure any additional Supabase features you want to use

## Schema File

The main schema file is `schema.sql` which contains:
- All table definitions
- Indexes for performance
- RLS policies
- Triggers and functions
- Sample data for testing

Run this file in your Supabase SQL Editor to set up the complete database structure. 