import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Add CORS headers for extension requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const elementId = params.id

    if (!elementId) {
      return NextResponse.json(
        { error: 'Element ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get element data
    const { data: element, error: elementError } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('id', elementId)
      .single()

    if (elementError) {
      console.error('Failed to fetch element:', elementError)
      return NextResponse.json(
        { error: 'Element not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Get analysis data
    const { data: analysis, error: analysisError } = await supabase
      .from('element_analyses')
      .select('*')
      .eq('element_id', elementId)
      .single()

    if (analysisError) {
      console.log('No analysis found:', analysisError.message)
    }

    // Get inspirations data
    const { data: inspirations, error: inspirationsError } = await supabase
      .from('inspirations')
      .select('*')
      .eq('element_id', elementId)
      .order('similarity_score', { ascending: false })

    if (inspirationsError) {
      console.log('No inspirations found:', inspirationsError.message)
    }

    // Transform data for frontend
    const result = {
      element: {
        id: element.id,
        url: element.source_url,
        elementData: element.element_data,
        status: element.status,
        createdAt: element.created_at,
        processedAt: element.processed_at,
        errorMessage: element.error_message
      },
      analysis: analysis ? {
        componentType: analysis.component_type,
        designIssues: analysis.design_issues,
        styleCharacteristics: analysis.style_characteristics,
        recommendations: analysis.recommendations,
        confidenceScore: analysis.confidence_score,
        createdAt: analysis.created_at
      } : null,
      inspirations: inspirations ? inspirations.map(inspiration => ({
        id: inspiration.id,
        title: inspiration.title,
        imageUrl: inspiration.image_url,
        source: inspiration.source,
        category: inspiration.category,
        tags: inspiration.tags,
        similarityScore: inspiration.similarity_score,
        createdAt: inspiration.created_at
      })) : []
    }

    return NextResponse.json(result, { headers: corsHeaders })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}