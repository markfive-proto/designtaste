import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(request: NextRequest) {
  const { imageUrl, elementData } = await request.json()

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Image URL is required' },
      { status: 400 }
    )
  }

  try {

    // Use OpenAI GPT-4 Vision for image analysis
    const model = openai('gpt-4o')

    // Analyze the element to suggest appropriate prompt text
    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this UI element and suggest a descriptive prompt that a user might want to improve about it. 

              Focus on:
              - What type of component this is (button, hero section, card, navigation, form, etc.)
              - Common design improvements for this type of element
              - Specific visual aspects that could be enhanced
              
              Provide a helpful suggestion in this format:
              "Improve this [component type] by [specific improvement suggestion]"
              
              Examples:
              - "Improve this hero section by adding more visual hierarchy and modern typography"
              - "Improve this button by adding hover effects and better contrast"
              - "Improve this navigation by making it more accessible with better spacing"
              
              Be specific but concise (under 100 characters). The user should be able to edit/complete your suggestion.
              
              HTML context: ${elementData?.tagName || 'unknown'}`
            },
            {
              type: 'image',
              image: imageUrl
            }
          ]
        }
      ]
    })

    // Extract component type for additional context
    const componentTypeResult = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `What type of UI component is this? Respond with just the component name (e.g., "hero section", "button", "navigation", "card", "form", "footer", etc.). Be specific but use common web design terminology.`
            },
            {
              type: 'image',
              image: imageUrl
            }
          ]
        }
      ]
    })

    return NextResponse.json({
      success: true,
      suggestedPrompt: result.text.trim(),
      componentType: componentTypeResult.text.trim()
    })

  } catch (error) {
    console.error('Element analysis error:', error)
    
    // Fallback suggestions based on element tag
    const tagName = elementData?.tagName?.toLowerCase() || 'div'
    const fallbackSuggestions: Record<string, string> = {
      'button': 'Improve this button by adding modern styling and hover effects',
      'nav': 'Improve this navigation by enhancing accessibility and spacing',
      'header': 'Improve this header section by adding better visual hierarchy',
      'footer': 'Improve this footer by organizing content and improving readability',
      'form': 'Improve this form by enhancing user experience and validation',
      'section': 'Improve this section by updating the design and layout',
      'article': 'Improve this content area by enhancing typography and spacing',
      'div': 'Improve this component by modernizing the design and layout'
    }

    const fallbackComponentTypes: Record<string, string> = {
      'button': 'button',
      'nav': 'navigation',
      'header': 'header',
      'footer': 'footer',
      'form': 'form',
      'section': 'section',
      'article': 'content area',
      'div': 'component'
    }

    return NextResponse.json({
      success: true,
      suggestedPrompt: fallbackSuggestions[tagName] || fallbackSuggestions['div'],
      componentType: fallbackComponentTypes[tagName] || fallbackComponentTypes['div'],
      fallback: true
    })
  }
}