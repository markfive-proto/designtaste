import { NextRequest, NextResponse } from 'next/server'
import { getModelForTask } from '@/lib/ai-config'
import { generateObject } from 'ai'
import { z } from 'zod'
import { openai } from '@ai-sdk/openai'

const VariationsSchema = z.object({
  variations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    changes: z.array(z.string()),
    designRationale: z.string(),
    imageUrl: z.string().optional() // We'll generate placeholder images
  }))
})

export async function POST(request: NextRequest) {
  const { imageUrl, componentType, originalElementData } = await request.json()

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Image URL is required' },
      { status: 400 }
    )
  }

  try {
    // Use OpenAI GPT-4 Vision for image analysis (Mistral doesn't support images)
    const model = openai('gpt-4o')

    // Generate design variations using AI
    const result = await generateObject({
      model,
      schema: VariationsSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this ${componentType} design and create 2 distinct design variations. For each variation, provide:
              1. A creative title
              2. A detailed description of what makes it different
              3. A list of specific changes from the original
              4. Design rationale explaining why this variation would be effective
              
              Focus on:
              - Modern design trends
              - Improved user experience
              - Visual hierarchy enhancements
              - Accessibility improvements
              - Different aesthetic approaches (minimalist, bold, elegant, etc.)
              
              Make each variation meaningfully different from the original and from each other.`
            },
            {
              type: 'image',
              image: imageUrl
            }
          ]
        }
      ]
    })

    // Add placeholder images for variations (in a real app, you'd generate actual images)
    const variationsWithImages = result.object.variations.map((variation, index) => ({
      ...variation,
      imageUrl: `https://images.unsplash.com/photo-${index === 0 ? '1581291518857-4e27b48ff24e' : '1559028006-448665bd7c7f'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&v=${Date.now()}`
    }))

    return NextResponse.json({
      success: true,
      variations: variationsWithImages
    })

  } catch (error) {
    console.error('Variations generation error:', error)
    
    // Fallback variations if AI fails
    const fallbackVariations = [
      {
        title: `Modern ${componentType || 'Component'} Design`,
        description: 'A clean, modern approach with improved spacing and typography',
        changes: ['Increased padding', 'Modern typography', 'Subtle shadows'],
        designRationale: 'Modern design principles focus on clean lines and generous whitespace',
        imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      },
      {
        title: `Bold ${componentType || 'Component'} Variant`,
        description: 'A more vibrant design with stronger visual hierarchy',
        changes: ['Bolder colors', 'Stronger contrast', 'Enhanced CTAs'],
        designRationale: 'Bold designs create stronger user engagement and clearer actions',
        imageUrl: 'https://images.unsplash.com/photo-1559028006-448665bd7c7f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      }
    ]

    return NextResponse.json({
      success: true,
      variations: fallbackVariations,
      fallback: true
    })
  }
}