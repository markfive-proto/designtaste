import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper functions for common database operations
export const db = {
  // User profiles
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  updateUserProfile: async (userId: string, updates: Partial<Database['public']['Tables']['user_profiles']['Update']>) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Projects
  getProjects: async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  createProject: async (project: Database['public']['Tables']['projects']['Insert']) => {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Processing queue
  getQueueItems: async (userId: string, status?: string) => {
    let query = supabase
      .from('processing_queue')
      .select(`
        *,
        projects (*),
        element_analyses (*),
        inspirations (*),
        generated_code (*),
        user_feedback (*)
      `)
      .eq('user_id', userId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  createQueueItem: async (item: Database['public']['Tables']['processing_queue']['Insert']) => {
    const { data, error } = await supabase
      .from('processing_queue')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateQueueItem: async (id: string, updates: Database['public']['Tables']['processing_queue']['Update']) => {
    const { data, error } = await supabase
      .from('processing_queue')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Element analyses
  createAnalysis: async (analysis: Database['public']['Tables']['element_analyses']['Insert']) => {
    const { data, error } = await supabase
      .from('element_analyses')
      .insert(analysis)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Inspirations
  createInspiration: async (inspiration: Database['public']['Tables']['inspirations']['Insert']) => {
    const { data, error } = await supabase
      .from('inspirations')
      .insert(inspiration)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Generated code
  createGeneratedCode: async (code: Database['public']['Tables']['generated_code']['Insert']) => {
    const { data, error } = await supabase
      .from('generated_code')
      .insert(code)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // User feedback
  createFeedback: async (feedback: Database['public']['Tables']['user_feedback']['Insert']) => {
    const { data, error } = await supabase
      .from('user_feedback')
      .insert(feedback)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Project elements
  addElementToProject: async (projectId: string, queueItemId: string, orderIndex?: number) => {
    const { data, error } = await supabase
      .from('project_elements')
      .insert({
        project_id: projectId,
        queue_item_id: queueItemId,
        order_index: orderIndex || 0
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  removeElementFromProject: async (projectId: string, queueItemId: string) => {
    const { error } = await supabase
      .from('project_elements')
      .delete()
      .eq('project_id', projectId)
      .eq('queue_item_id', queueItemId);
    
    if (error) throw error;
  }
};

// Auth helpers
export const auth = {
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};