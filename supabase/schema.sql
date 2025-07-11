-- Supabase Database Schema for Vibe UI Assistant
-- This file contains all the table definitions and relationships

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE element_status AS ENUM ('queued', 'processing', 'completed', 'error');
CREATE TYPE component_type AS ENUM ('hero', 'card', 'form', 'navigation', 'button', 'layout', 'footer', 'sidebar');
CREATE TYPE framework_type AS ENUM ('tailwind', 'nextjs', 'react');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing queue table - stores elements being processed
CREATE TABLE IF NOT EXISTS public.processing_queue (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  element_data JSONB NOT NULL,
  screenshot_url TEXT,
  source_url TEXT NOT NULL,
  status element_status DEFAULT 'queued',
  priority INTEGER DEFAULT 1,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Element analyses table - stores AI analysis results
CREATE TABLE IF NOT EXISTS public.element_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  element_id TEXT REFERENCES public.processing_queue(id) ON DELETE CASCADE,
  component_type component_type,
  design_issues TEXT[],
  style_characteristics TEXT[],
  recommendations TEXT[],
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspirations table - stores design inspiration results
CREATE TABLE IF NOT EXISTS public.inspirations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  element_id TEXT REFERENCES public.processing_queue(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  source TEXT,
  category component_type,
  tags TEXT[],
  similarity_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated code table - stores AI-generated code improvements
CREATE TABLE IF NOT EXISTS public.generated_code (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  element_id TEXT REFERENCES public.processing_queue(id) ON DELETE CASCADE,
  framework framework_type NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  improvements TEXT[],
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  user_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback table - stores user ratings and feedback
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  element_id TEXT REFERENCES public.processing_queue(id) ON DELETE CASCADE,
  generated_code_id UUID REFERENCES public.generated_code(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table - for organizing multiple elements
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project elements junction table
CREATE TABLE IF NOT EXISTS public.project_elements (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  element_id TEXT REFERENCES public.processing_queue(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, element_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processing_queue_user_id ON public.processing_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON public.processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_created_at ON public.processing_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_element_analyses_element_id ON public.element_analyses(element_id);
CREATE INDEX IF NOT EXISTS idx_inspirations_element_id ON public.inspirations(element_id);
CREATE INDEX IF NOT EXISTS idx_generated_code_element_id ON public.generated_code(element_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_processing_queue_updated_at
  BEFORE UPDATE ON public.processing_queue
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.element_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_elements ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Processing queue policies
CREATE POLICY "Users can view their own queue items" ON public.processing_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue items" ON public.processing_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue items" ON public.processing_queue
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue items" ON public.processing_queue
  FOR DELETE USING (auth.uid() = user_id);

-- Element analyses policies
CREATE POLICY "Users can view analyses for their elements" ON public.element_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.processing_queue pq 
      WHERE pq.id = element_analyses.element_id 
      AND pq.user_id = auth.uid()
    )
  );

-- Inspirations policies
CREATE POLICY "Users can view inspirations for their elements" ON public.inspirations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.processing_queue pq 
      WHERE pq.id = inspirations.element_id 
      AND pq.user_id = auth.uid()
    )
  );

-- Generated code policies
CREATE POLICY "Users can view code for their elements" ON public.generated_code
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.processing_queue pq 
      WHERE pq.id = generated_code.element_id 
      AND pq.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert code for their elements" ON public.generated_code
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.processing_queue pq 
      WHERE pq.id = generated_code.element_id 
      AND pq.user_id = auth.uid()
    )
  );

-- User feedback policies
CREATE POLICY "Users can manage their own feedback" ON public.user_feedback
  FOR ALL USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can manage their own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- Project elements policies
CREATE POLICY "Users can manage their project elements" ON public.project_elements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_elements.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a view for queue with related data (for easier querying)
CREATE OR REPLACE VIEW public.queue_with_details AS
SELECT 
  pq.*,
  ea.component_type,
  ea.design_issues,
  ea.recommendations,
  COALESCE(insp_count.count, 0) as inspiration_count,
  COALESCE(code_count.count, 0) as generated_code_count
FROM public.processing_queue pq
LEFT JOIN public.element_analyses ea ON pq.id = ea.element_id
LEFT JOIN (
  SELECT element_id, COUNT(*) as count 
  FROM public.inspirations 
  GROUP BY element_id
) insp_count ON pq.id = insp_count.element_id
LEFT JOIN (
  SELECT element_id, COUNT(*) as count 
  FROM public.generated_code 
  GROUP BY element_id
) code_count ON pq.id = code_count.element_id;