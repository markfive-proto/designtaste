import { NextRequest, NextResponse } from 'next/server'
import { getAvailableProviders, getAIProvider } from '@/lib/ai-config'

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const availableProviders = getAvailableProviders()
    const currentProvider = getAIProvider()
    
    return NextResponse.json({
      success: true,
      currentProvider,
      providers: availableProviders,
      recommendation: getRecommendation(availableProviders)
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Providers status error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get provider status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

function getRecommendation(providers: Array<any>): string {
  const validProviders = providers.filter(p => p.hasApiKey)
  
  if (validProviders.length === 0) {
    return 'No AI providers are configured. Please add API keys to your environment variables.'
  }
  
  if (validProviders.length === 1) {
    return `Using ${validProviders[0].name}. Consider adding additional providers for redundancy.`
  }
  
  // Preference order: Anthropic > OpenAI > Mistral
  const hasAnthropic = validProviders.some(p => p.id === 'anthropic')
  const hasOpenAI = validProviders.some(p => p.id === 'openai')
  const hasMistral = validProviders.some(p => p.id === 'mistral')
  
  if (hasAnthropic) {
    return 'Anthropic Claude is recommended for best code generation quality.'
  } else if (hasOpenAI) {
    return 'OpenAI GPT-4 provides excellent vision and code generation capabilities.'
  } else if (hasMistral) {
    return 'Mistral provides good performance for code generation tasks.'
  }
  
  return 'Multiple providers available - consider testing to find your preference.'
}