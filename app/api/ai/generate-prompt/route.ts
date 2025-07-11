import { NextRequest, NextResponse } from 'next/server'
import { generatePromptFromInspiration } from '@/lib/ai-service'

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, componentType } = await request.json()

    if (!imageUrl || !componentType) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl and componentType' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('Generating prompt from inspiration:', { imageUrl, componentType })

    const generatedPrompt = await generatePromptFromInspiration(imageUrl, componentType)

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Prompt generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}