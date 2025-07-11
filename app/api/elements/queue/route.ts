import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Add CORS headers for extension requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    // For development, return mock data if Supabase is not set up
    // This allows testing without setting up the database first
    
    try {
      // Get all elements in the processing queue with related data
      console.log('Fetching queue items from database...');
      
      const { data: queueItems, error } = await supabase
        .from('processing_queue')
        .select(`
          *,
          element_analyses(*),
          inspirations(*)
        `)
        .order('created_at', { ascending: false })

      console.log('Database query result:', { 
        itemCount: queueItems?.length || 0, 
        error: error?.message || null 
      });

      if (error) {
        console.error('Database error:', error)
        // Return empty queue instead of error for development
        return NextResponse.json({
          queue: [],
          stats: {
            total: 0,
            queued: 0,
            processing: 0,
            completed: 0,
            error: 0
          }
        })
      }

      // Transform data for frontend with all related data included
      const transformedQueue = queueItems?.map(item => ({
        id: item.id,
        url: item.source_url,
        elementData: item.element_data,
        status: item.status,
        priority: item.priority,
        timestamp: new Date(item.created_at).getTime(),
        analysis: item.element_analyses?.[0] ? {
          componentType: item.element_analyses[0].component_type,
          designIssues: item.element_analyses[0].design_issues,
          styleCharacteristics: item.element_analyses[0].style_characteristics,
          recommendations: item.element_analyses[0].recommendations,
          confidenceScore: item.element_analyses[0].confidence_score,
          createdAt: item.element_analyses[0].created_at
        } : null,
        inspirations: item.inspirations ? item.inspirations.map((inspiration: any) => ({
          id: inspiration.id,
          title: inspiration.title,
          imageUrl: inspiration.image_url,
          source: inspiration.source,
          category: inspiration.category,
          tags: inspiration.tags,
          similarityScore: inspiration.similarity_score,
          createdAt: inspiration.created_at
        })) : [],
        processedAt: item.processed_at ? new Date(item.processed_at).getTime() : null,
        errorMessage: item.error_message || null
      })) || []

      return NextResponse.json({
        queue: transformedQueue,
        stats: {
          total: transformedQueue.length,
          queued: transformedQueue.filter(item => item.status === 'queued').length,
          processing: transformedQueue.filter(item => item.status === 'processing').length,
          completed: transformedQueue.filter(item => item.status === 'completed').length,
          error: transformedQueue.filter(item => item.status === 'error').length
        }
      }, { headers: corsHeaders })
    } catch (dbError) {
      console.log('Database not available, returning empty queue for development')
      return NextResponse.json({
        queue: [],
        stats: {
          total: 0,
          queued: 0,
          processing: 0,
          completed: 0,
          error: 0
        }
      }, { headers: corsHeaders })
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear the entire queue
    const { error } = await supabase
      .from('processing_queue')
      .delete()
      .neq('id', 'impossible-id') // Delete all records

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to clear queue' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Queue cleared successfully'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}