import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { elementId, inspirationIds, framework = 'nextjs', stylePreferences = [] } = await request.json()

    if (!elementId) {
      return NextResponse.json(
        { error: 'Element ID is required' },
        { status: 400 }
      )
    }

    // Get element data and analysis
    const { data: element, error: elementError } = await supabase
      .from('processing_queue')
      .select(`
        *,
        element_analyses (*),
        inspirations (*)
      `)
      .eq('id', elementId)
      .single()

    if (elementError || !element) {
      return NextResponse.json(
        { error: 'Element not found' },
        { status: 404 }
      )
    }

    // Get selected inspirations if provided
    let selectedInspirations = []
    if (inspirationIds && inspirationIds.length > 0) {
      const { data: inspirations } = await supabase
        .from('inspirations')
        .select('*')
        .in('id', inspirationIds)
      
      selectedInspirations = inspirations || []
    }

    // Generate code using OpenAI
    const generatedCode = await generateCodeWithAI(element, selectedInspirations, framework, stylePreferences)

    // Store generated code
    const { data: codeRecord, error: codeError } = await supabase
      .from('generated_code')
      .insert({
        element_id: elementId,
        framework,
        code: generatedCode.code,
        description: generatedCode.description,
        improvements: generatedCode.improvements,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (codeError) {
      console.error('Failed to store generated code:', codeError)
      return NextResponse.json(
        { error: 'Failed to store generated code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      generatedCode: {
        id: codeRecord.id,
        framework,
        code: generatedCode.code,
        description: generatedCode.description,
        improvements: generatedCode.improvements,
        timestamp: new Date(codeRecord.created_at).getTime()
      }
    })

  } catch (error) {
    console.error('Code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    )
  }
}

async function generateCodeWithAI(
  element: any,
  inspirations: any[],
  framework: string,
  stylePreferences: string[]
) {
  const analysis = element.element_analyses?.[0]
  const elementData = element.element_data

  // Build the prompt for code generation
  const prompt = buildCodeGenerationPrompt(elementData, analysis, inspirations, framework, stylePreferences)

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert frontend developer specializing in creating beautiful, accessible, and performant UI components. You generate clean, production-ready code with proper TypeScript types and modern best practices."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })

    const response = completion.choices[0]?.message?.content || ''
    
    // Parse the response to extract code and metadata
    return parseCodeGenerationResponse(response)

  } catch (error) {
    console.error('OpenAI API error:', error)
    
    // Fallback to mock generation
    return generateMockCode(elementData, framework)
  }
}

function buildCodeGenerationPrompt(
  elementData: any,
  analysis: any,
  inspirations: any[],
  framework: string,
  stylePreferences: string[]
): string {
  const componentType = analysis?.component_type || 'component'
  const designIssues = analysis?.design_issues || []
  const recommendations = analysis?.recommendations || []

  let prompt = `Generate an improved ${framework} component based on this analysis:

ORIGINAL ELEMENT:
- Tag: ${elementData.tagName}
- Content: ${elementData.textContent?.slice(0, 200)}
- Component Type: ${componentType}

DESIGN ISSUES IDENTIFIED:
${designIssues.map((issue: string) => `- ${issue}`).join('\n')}

RECOMMENDATIONS:
${recommendations.map((rec: string) => `- ${rec}`).join('\n')}

STYLE PREFERENCES:
${stylePreferences.join(', ')}

FRAMEWORK: ${framework}
${framework === 'nextjs' ? '- Use Next.js 14 with App Router' : ''}
${framework === 'nextjs' ? '- Include proper TypeScript types' : ''}
- Use Tailwind CSS classes
- Include Framer Motion for subtle animations
- Ensure accessibility (ARIA labels, semantic HTML)
- Make it responsive (mobile-first)

${inspirations.length > 0 ? `
DESIGN INSPIRATIONS TO CONSIDER:
${inspirations.map((insp: any) => `- ${insp.title}: ${insp.tags?.join(', ')}`).join('\n')}
` : ''}

Please provide:
1. Complete component code
2. Brief description of improvements made
3. List of specific enhancements

Format your response as:
## Description
[Brief description]

## Improvements
- [List of improvements]

## Code
\`\`\`typescript
[Component code]
\`\`\`
`

  return prompt
}

function parseCodeGenerationResponse(response: string) {
  const sections = {
    description: '',
    improvements: [],
    code: ''
  }

  // Extract description
  const descMatch = response.match(/## Description\s*\n(.*?)(?=\n##|$)/s)
  if (descMatch) {
    sections.description = descMatch[1].trim()
  }

  // Extract improvements
  const improvMatch = response.match(/## Improvements\s*\n(.*?)(?=\n##|$)/s)
  if (improvMatch) {
    sections.improvements = improvMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
  }

  // Extract code
  const codeMatch = response.match(/```(?:typescript|tsx|jsx)?\s*\n(.*?)\n```/s)
  if (codeMatch) {
    sections.code = codeMatch[1].trim()
  }

  return sections
}

function generateMockCode(elementData: any, framework: string) {
  const componentName = elementData.tagName === 'BUTTON' ? 'Button' : 'Component'
  
  return {
    description: `Improved ${componentName.toLowerCase()} with better styling and accessibility`,
    improvements: [
      'Enhanced visual hierarchy with proper typography',
      'Improved color contrast for accessibility',
      'Added responsive design patterns',
      'Included subtle animations for better UX'
    ],
    code: `export function Improved${componentName}() {
  return (
    <${elementData.tagName.toLowerCase()} className="
      bg-gradient-to-r from-blue-500 to-blue-600
      text-white font-semibold
      px-6 py-3 rounded-lg
      hover:from-blue-600 hover:to-blue-700
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      transition-all duration-200
      shadow-lg hover:shadow-xl
    ">
      ${elementData.textContent || 'Component Content'}
    </${elementData.tagName.toLowerCase()}>
  )
}`
  }
}