import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const elementId = params.id

    // Get element status (simple query without relations)
    const { data: element, error } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('id', elementId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch element status' },
        { status: 500 }
      )
    }

    if (!element) {
      return NextResponse.json(
        { error: 'Element not found' },
        { status: 404 }
      )
    }

    // Transform data for frontend
    const transformedElement = {
      id: element.id,
      url: element.source_url,
      elementData: element.element_data,
      status: element.status,
      priority: element.priority,
      timestamp: new Date(element.created_at).getTime(),
      processedAt: element.processed_at ? new Date(element.processed_at).getTime() : null,
      errorMessage: element.error_message || null,
      analysis: element.element_analyses?.[0] || null,
      inspirations: element.inspirations || [],
      generatedCode: element.generated_code || []
    }

    return NextResponse.json(transformedElement)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const elementId = params.id
    const { status, priority } = await request.json()

    const updates: any = {}
    if (status) updates.status = status
    if (priority !== undefined) updates.priority = priority

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('processing_queue')
      .update(updates)
      .eq('id', elementId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update element' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      element: data
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const elementId = params.id

    // Delete element and all related data (cascading delete)
    const { error } = await supabase
      .from('processing_queue')
      .delete()
      .eq('id', elementId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete element' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Element deleted successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}