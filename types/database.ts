// Database types for DesignTaste application
// These types match the Supabase database schema

export type ElementStatus = 'queued' | 'processing' | 'completed' | 'error';
export type ComponentType = 'hero' | 'card' | 'form' | 'navigation' | 'button' | 'layout' | 'footer' | 'sidebar';
export type FrameworkType = 'tailwind' | 'nextjs' | 'react';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcessingQueue {
  id: string;
  user_id: string;
  project_id?: string;
  element_name?: string;
  screenshot_url?: string;
  dom_data?: Record<string, any>;
  bounding_box?: Record<string, any>;
  status: ElementStatus;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ElementAnalysis {
  id: string;
  queue_item_id: string;
  component_type?: ComponentType;
  analysis_data?: Record<string, any>;
  confidence_score?: number;
  created_at: string;
}

export interface Inspiration {
  id: string;
  queue_item_id: string;
  inspiration_url?: string;
  title?: string;
  description?: string;
  tags?: string[];
  similarity_score?: number;
  created_at: string;
}

export interface GeneratedCode {
  id: string;
  queue_item_id: string;
  framework: FrameworkType;
  code_content: string;
  explanation?: string;
  improvement_score?: number;
  created_at: string;
}

export interface UserFeedback {
  id: string;
  user_id: string;
  queue_item_id: string;
  rating?: number;
  feedback_text?: string;
  helpful?: boolean;
  created_at: string;
}

export interface ProjectElement {
  id: string;
  project_id: string;
  queue_item_id: string;
  order_index: number;
  created_at: string;
}

// Database schema types for Supabase
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
      };
      processing_queue: {
        Row: ProcessingQueue;
        Insert: Omit<ProcessingQueue, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProcessingQueue, 'id' | 'created_at' | 'updated_at'>>;
      };
      element_analyses: {
        Row: ElementAnalysis;
        Insert: Omit<ElementAnalysis, 'id' | 'created_at'>;
        Update: Partial<Omit<ElementAnalysis, 'id' | 'created_at'>>;
      };
      inspirations: {
        Row: Inspiration;
        Insert: Omit<Inspiration, 'id' | 'created_at'>;
        Update: Partial<Omit<Inspiration, 'id' | 'created_at'>>;
      };
      generated_code: {
        Row: GeneratedCode;
        Insert: Omit<GeneratedCode, 'id' | 'created_at'>;
        Update: Partial<Omit<GeneratedCode, 'id' | 'created_at'>>;
      };
      user_feedback: {
        Row: UserFeedback;
        Insert: Omit<UserFeedback, 'id' | 'created_at'>;
        Update: Partial<Omit<UserFeedback, 'id' | 'created_at'>>;
      };
      project_elements: {
        Row: ProjectElement;
        Insert: Omit<ProjectElement, 'id' | 'created_at'>;
        Update: Partial<Omit<ProjectElement, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      element_status: ElementStatus;
      component_type: ComponentType;
      framework_type: FrameworkType;
    };
  };
}

// Helper types for API responses
export interface QueueItemWithDetails extends ProcessingQueue {
  project?: Project;
  analysis?: ElementAnalysis;
  inspirations?: Inspiration[];
  generated_code?: GeneratedCode[];
  feedback?: UserFeedback[];
}

export interface ProjectWithElements extends Project {
  elements?: ProcessingQueue[];
  element_count?: number;
}

// API request/response types
export interface CreateQueueItemRequest {
  element_name?: string;
  screenshot_url?: string;
  dom_data?: Record<string, any>;
  bounding_box?: Record<string, any>;
  project_id?: string;
  priority?: number;
}

export interface UpdateQueueItemRequest {
  status?: ElementStatus;
  priority?: number;
  element_name?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateFeedbackRequest {
  queue_item_id: string;
  rating?: number;
  feedback_text?: string;
  helpful?: boolean;
} 