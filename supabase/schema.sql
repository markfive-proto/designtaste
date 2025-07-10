-- DesignTaste Database Schema
-- Run this in your Supabase SQL Editor

-- Create enums
CREATE TYPE element_status AS ENUM ('queued', 'processing', 'completed', 'error');
CREATE TYPE component_type AS ENUM ('hero', 'card', 'form', 'navigation', 'button', 'layout', 'footer', 'sidebar');
CREATE TYPE framework_type AS ENUM ('tailwind', 'nextjs', 'react');

-- 1. user_profiles table - Extends Supabase auth
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. projects table - For organizing multiple elements
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. processing_queue table - Main table for elements being processed
CREATE TABLE processing_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    element_name TEXT,
    screenshot_url TEXT,
    dom_data JSONB,
    bounding_box JSONB,
    status element_status DEFAULT 'queued',
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. element_analyses table - AI analysis results
CREATE TABLE element_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_item_id UUID REFERENCES processing_queue(id) ON DELETE CASCADE NOT NULL,
    component_type component_type,
    analysis_data JSONB,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. inspirations table - Design inspiration results
CREATE TABLE inspirations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_item_id UUID REFERENCES processing_queue(id) ON DELETE CASCADE NOT NULL,
    inspiration_url TEXT,
    title TEXT,
    description TEXT,
    tags TEXT[],
    similarity_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. generated_code table - AI-generated code improvements
CREATE TABLE generated_code (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_item_id UUID REFERENCES processing_queue(id) ON DELETE CASCADE NOT NULL,
    framework framework_type NOT NULL,
    code_content TEXT NOT NULL,
    explanation TEXT,
    improvement_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. user_feedback table - User ratings and feedback
CREATE TABLE user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    queue_item_id UUID REFERENCES processing_queue(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. project_elements table - Junction table for project organization
CREATE TABLE project_elements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    queue_item_id UUID REFERENCES processing_queue(id) ON DELETE CASCADE NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, queue_item_id)
);

-- Create indexes for performance
CREATE INDEX idx_processing_queue_user_id ON processing_queue(user_id);
CREATE INDEX idx_processing_queue_status ON processing_queue(status);
CREATE INDEX idx_processing_queue_created_at ON processing_queue(created_at);
CREATE INDEX idx_element_analyses_queue_item_id ON element_analyses(queue_item_id);
CREATE INDEX idx_inspirations_queue_item_id ON inspirations(queue_item_id);
CREATE INDEX idx_generated_code_queue_item_id ON generated_code(queue_item_id);
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_queue_item_id ON user_feedback(queue_item_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_project_elements_project_id ON project_elements(project_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_processing_queue_updated_at BEFORE UPDATE ON processing_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user profile trigger on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE element_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_elements ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- processing_queue policies
CREATE POLICY "Users can view own queue items" ON processing_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own queue items" ON processing_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue items" ON processing_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own queue items" ON processing_queue FOR DELETE USING (auth.uid() = user_id);

-- element_analyses policies (via queue_item_id)
CREATE POLICY "Users can view own analyses" ON element_analyses FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM processing_queue 
        WHERE processing_queue.id = element_analyses.queue_item_id 
        AND processing_queue.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own analyses" ON element_analyses FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM processing_queue 
        WHERE processing_queue.id = element_analyses.queue_item_id 
        AND processing_queue.user_id = auth.uid()
    )
);

-- inspirations policies (via queue_item_id)
CREATE POLICY "Users can view own inspirations" ON inspirations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM processing_queue 
        WHERE processing_queue.id = inspirations.queue_item_id 
        AND processing_queue.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own inspirations" ON inspirations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM processing_queue 
        WHERE processing_queue.id = inspirations.queue_item_id 
        AND processing_queue.user_id = auth.uid()
    )
);

-- generated_code policies (via queue_item_id)
CREATE POLICY "Users can view own generated code" ON generated_code FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM processing_queue 
        WHERE processing_queue.id = generated_code.queue_item_id 
        AND processing_queue.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own generated code" ON generated_code FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM processing_queue 
        WHERE processing_queue.id = generated_code.queue_item_id 
        AND processing_queue.user_id = auth.uid()
    )
);

-- user_feedback policies
CREATE POLICY "Users can view own feedback" ON user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON user_feedback FOR UPDATE USING (auth.uid() = user_id);

-- project_elements policies (via project_id)
CREATE POLICY "Users can view own project elements" ON project_elements FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_elements.project_id 
        AND projects.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own project elements" ON project_elements FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_elements.project_id 
        AND projects.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update own project elements" ON project_elements FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_elements.project_id 
        AND projects.user_id = auth.uid()
    )
);
CREATE POLICY "Users can delete own project elements" ON project_elements FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_elements.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Insert some sample data for testing
INSERT INTO user_profiles (id, email, full_name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, user_id, name, description) 
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Sample Project',
    'A sample project for testing'
) ON CONFLICT (id) DO NOTHING;