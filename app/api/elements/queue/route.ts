import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // For development, return mock data if Supabase is not set up
    // This allows testing without setting up the database first
    
    try {
      // Get all elements in the processing queue (simple query without relations)
      const { data: queueItems, error } = await supabase
        .from('processing_queue')
        .select('*')
        .order('created_at', { ascending: false })

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

      // Transform data for frontend (without relations for now)
      const transformedQueue = queueItems?.map(item => ({
        id: item.id,
        url: item.source_url,
        elementData: item.element_data,
        status: item.status,
        priority: item.priority,
        timestamp: new Date(item.created_at).getTime(),
        analysis: null, // Will be populated when relations are set up
        inspirations: [], // Will be populated when relations are set up
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
      })
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
      })
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}