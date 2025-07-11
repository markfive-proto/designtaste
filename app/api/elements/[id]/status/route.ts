import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const elementId = params.id

    // Get element status
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

    // Get analysis status
    const { data: analysis } = await supabase
      .from('element_analyses')
      .select('id, created_at')
      .eq('element_id', elementId)
      .single()

    // Get inspirations status
    const { data: inspirations } = await supabase
      .from('inspirations')
      .select('id')
      .eq('element_id', elementId)

    // Calculate progress and current step
    const progress = calculateProgress(element.status, !!analysis, inspirations?.length || 0)
    const currentStep = getCurrentStep(element.status, !!analysis, inspirations?.length || 0)
    const aiProvider = getAIProviderForStep(!!analysis, inspirations?.length || 0)
    const steps = getProcessingSteps(element.status, !!analysis, inspirations?.length || 0)

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
      progress,
      currentStep,
      aiProvider,
      steps, // <-- new
      analysis: !!analysis,
      inspirationsCount: inspirations?.length || 0,
      isProcessing: element.status === 'processing'
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

function calculateProgress(status: string, hasAnalysis: boolean, inspirationsCount: number): number {
  if (status === 'error') return 0
  if (status === 'completed') return 100
  
  let progress = 0
  
  // Base progress for being in queue
  if (status === 'processing') progress += 15
  
  // Analysis completion
  if (hasAnalysis) progress += 35
  
  // Inspirations completion
  if (inspirationsCount > 0) progress += 35
  
  // Final completion
  if (status === 'completed') progress += 15
  
  return Math.min(progress, status === 'completed' ? 100 : 95)
}

function getProcessingSteps(status: string, hasAnalysis: boolean, inspirationsCount: number) {
  // Each step: label, completed
  return [
    {
      label: 'Analyzing image',
      completed: status === 'completed' || status === 'processing' && hasAnalysis || status === 'error',
    },
    {
      label: 'Suggesting tips',
      completed: status === 'completed' || status === 'processing' && hasAnalysis || status === 'error',
    },
    {
      label: 'Finding inspiration',
      completed: status === 'completed' || inspirationsCount > 0 || status === 'error',
    },
    {
      label: 'Generating code',
      completed: status === 'completed' || status === 'error',
    },
  ]
}

function getCurrentStep(status: string, hasAnalysis: boolean, inspirationsCount: number): string {
  if (status === 'error') return 'Error occurred during processing'
  if (status === 'completed') return 'Processing completed successfully'

  if (!hasAnalysis) {
    return 'Analyzing image...'
  }

  // If analysis is done but no inspirations
  if (hasAnalysis && inspirationsCount === 0) {
    return 'Finding inspiration...'
  }

  // If inspirations found but not completed
  if (hasAnalysis && inspirationsCount > 0 && status !== 'completed') {
    return 'Generating code...'
  }

  return 'Finalizing results...'
}

function getAIProviderForStep(hasAnalysis: boolean, inspirationsCount: number): string {
  if (!hasAnalysis) {
    return 'Mistral AI'
  }
  
  if (inspirationsCount === 0) {
    return 'Design Sources'
  }
  
  return 'Processing'
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