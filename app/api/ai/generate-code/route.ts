import { NextRequest, NextResponse } from 'next/server'
import { generateCodeFromInspiration } from '@/lib/ai-service'

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
    const { imageUrl, componentType, userPrompt, originalElementData } = await request.json()

    if (!imageUrl || !componentType) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl and componentType' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('Generating code from inspiration:', { imageUrl, componentType, userPrompt })

    const generatedCode = await generateCodeFromInspiration(
      imageUrl,
      componentType,
      userPrompt,
      originalElementData
    )

    return NextResponse.json({
      success: true,
      code: generatedCode
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Code generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}