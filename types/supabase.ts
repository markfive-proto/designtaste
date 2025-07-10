// TypeScript types for Supabase database schema

export type ElementStatus = 'queued' | 'processing' | 'completed' | 'error'
export type ComponentType = 'hero' | 'card' | 'form' | 'navigation' | 'button' | 'layout' | 'footer' | 'sidebar'
export type FrameworkType = 'tailwind' | 'nextjs' | 'react'

export interface UserProfile {
  id: string
  email: string
  name?: string
  avatar_url?: string
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProcessingQueueItem {
  id: string
  user_id?: string
  element_data: {
    html: string
    css: string
    boundingBox: DOMRect
    tagName: string
    textContent: string
    computedStyles: Record<string, string>
  }
  screenshot_url?: string
  source_url: string
  status: ElementStatus
  priority: number
  error_message?: string
  created_at: string
  processed_at?: string
  updated_at: string
}

export interface ElementAnalysis {
  id: string
  element_id: string
  component_type?: ComponentType
  design_issues: string[]
  style_characteristics: string[]
  recommendations: string[]
  confidence_score: number
  created_at: string
}

export interface Inspiration {
  id: string
  element_id: string
  title: string
  image_url: string
  source?: string
  category?: ComponentType
  tags: string[]
  similarity_score: number
  created_at: string
}

export interface GeneratedCode {
  id: string
  element_id: string
  framework: FrameworkType
  code: string
  description?: string
  improvements: string[]
  rating?: number
  user_feedback?: string
  created_at: string
}

export interface UserFeedback {
  id: string
  user_id: string
  element_id: string
  generated_code_id: string
  rating: number
  feedback_text?: string
  helpful: boolean
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface ProjectElement {
  project_id: string
  element_id: string
  added_at: string
}

export interface QueueWithDetails extends ProcessingQueueItem {
  component_type?: ComponentType
  design_issues?: string[]
  recommendations?: string[]
  inspiration_count: number
  generated_code_count: number
}

// API Response types
export interface QueueResponse {
  queue: ProcessingQueueItem[]
  stats: {
    total: number
    queued: number
    processing: number
    completed: number
    error: number
  }
}

export interface ElementStatusResponse {
  id: string
  url: string
  elementData: any
  status: ElementStatus
  priority: number
  timestamp: number
  processedAt?: number
  errorMessage?: string
  analysis?: ElementAnalysis
  inspirations: Inspiration[]
  generatedCode: GeneratedCode[]
}

export interface CodeGenerationRequest {
  elementId: string
  inspirationIds?: string[]
  framework?: FrameworkType
  stylePreferences?: string[]
}

export interface CodeGenerationResponse {
  success: boolean
  generatedCode: {
    id: string
    framework: FrameworkType
    code: string
    description: string
    improvements: string[]
    timestamp: number
  }
}

// Database function return types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
      processing_queue: {
        Row: ProcessingQueueItem
        Insert: Omit<ProcessingQueueItem, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProcessingQueueItem, 'id' | 'created_at' | 'updated_at'>>
      }
      element_analyses: {
        Row: ElementAnalysis
        Insert: Omit<ElementAnalysis, 'id' | 'created_at'>
        Update: Partial<Omit<ElementAnalysis, 'id' | 'created_at'>>
      }
      inspirations: {
        Row: Inspiration
        Insert: Omit<Inspiration, 'id' | 'created_at'>
        Update: Partial<Omit<Inspiration, 'id' | 'created_at'>>
      }
      generated_code: {
        Row: GeneratedCode
        Insert: Omit<GeneratedCode, 'id' | 'created_at'>
        Update: Partial<Omit<GeneratedCode, 'id' | 'created_at'>>
      }
      user_feedback: {
        Row: UserFeedback
        Insert: Omit<UserFeedback, 'id' | 'created_at'>
        Update: Partial<Omit<UserFeedback, 'id' | 'created_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      project_elements: {
        Row: ProjectElement
        Insert: Omit<ProjectElement, 'added_at'>
        Update: never
      }
    }
    Views: {
      queue_with_details: {
        Row: QueueWithDetails
      }
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      element_status: ElementStatus
      component_type: ComponentType
      framework_type: FrameworkType
    }
  }
}