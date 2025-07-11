import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Add CORS headers for extension requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const { id, elementData, screenshot, url } = await request.json()

    // Validate required fields
    if (!id || !elementData || !screenshot || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For development, use a default user_id or allow null
    // In production, you'd authenticate the user first
    console.log('Processing element:', { id, url, elementData: Object.keys(elementData) });
    
    const { data, error } = await supabase
      .from('processing_queue')
      .insert({
        id,
        user_id: null, // Allow null for development (handled by RLS policies)
        element_data: elementData,
        screenshot_url: screenshot,
        source_url: url,
        status: 'processing',
        priority: 1,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to store element data' },
        { status: 500 }
      )
    }

    // Start background processing
    processElementInBackground(id)

    return NextResponse.json({
      success: true,
      elementId: id,
      message: 'Element queued for processing'
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

async function processElementInBackground(elementId: string) {
  try {
    // This would typically be handled by a background job queue
    // For now, we'll simulate the processing
    
    // 1. Analyze the element with AI
    await analyzeElementWithAI(elementId)
    
    // 2. Find design inspirations
    await findDesignInspirations(elementId)
    
    // 3. Update status to completed
    await supabase
      .from('processing_queue')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', elementId)

  } catch (error) {
    console.error('Background processing error:', error)
    
    // Get more detailed error message
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    } else {
      console.error('Non-Error thrown:', error)
      errorMessage = String(error)
    }
    
    // Update status to error
    await supabase
      .from('processing_queue')
      .update({ 
        status: 'error',
        error_message: errorMessage,
        processed_at: new Date().toISOString()
      })
      .eq('id', elementId)
  }
}

async function analyzeElementWithAI(elementId: string) {
  try {
    console.log('Analyzing element with AI:', elementId)
    
    // Get element data from database
    const { data: element, error: fetchError } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('id', elementId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch element from database:', fetchError)
      throw new Error(`Database fetch error: ${fetchError.message}`)
    }

    if (!element) {
      throw new Error('Element not found in database')
    }

    console.log('Element data retrieved:', {
      id: element.id,
      hasElementData: !!element.element_data,
      elementDataKeys: element.element_data ? Object.keys(element.element_data) : []
    })

    // Analyze element based on its data
    const elementData = element.element_data
    if (!elementData) {
      throw new Error('Element data is null or undefined')
    }

    const componentType = detectComponentType(elementData)
    console.log('Detected component type:', componentType)
    
    // Create analysis based on element characteristics
    const analysis = {
      componentType,
      designIssues: generateDesignIssues(elementData, componentType),
      styleCharacteristics: extractStyleCharacteristics(elementData),
      recommendations: generateRecommendations(elementData, componentType)
    }

    console.log('Generated analysis:', analysis)

    // Store analysis results
    const { error: insertError } = await supabase
      .from('element_analyses')
      .insert({
        element_id: elementId,
        component_type: analysis.componentType,
        design_issues: analysis.designIssues,
        style_characteristics: analysis.styleCharacteristics,
        recommendations: analysis.recommendations,
        confidence_score: 0.8,
        created_at: new Date().toISOString()
      })
    
    if (insertError) {
      console.error('Failed to store analysis:', insertError)
      throw new Error(`Analysis storage error: ${insertError.message}`)
    }
    
    console.log('Analysis stored successfully')
    
  } catch (error) {
    console.error('Analysis failed:', error)
    throw error
  }
}

async function findDesignInspirations(elementId: string) {
  try {
    console.log('Finding design inspirations for:', elementId)
    
    // Get element analysis and data
    const { data: element, error: elementError } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('id', elementId)
      .single()

    if (elementError) {
      console.error('Failed to fetch element for inspiration search:', elementError)
      throw new Error(`Element fetch error: ${elementError.message}`)
    }

    if (!element) {
      throw new Error('Element not found for inspiration search')
    }

    console.log('Fetching analysis for inspiration search...')
    const { data: analysis, error: analysisError } = await supabase
      .from('element_analyses')
      .select('*')
      .eq('element_id', elementId)
      .single()

    if (analysisError) {
      console.log('Analysis fetch error (will use fallback):', analysisError.message)
    }

    const componentType = analysis?.component_type || detectComponentType(element.element_data)
    const userPrompt = element.element_data?.userPrompt || ''
    
    console.log('Inspiration search parameters:', {
      componentType,
      userPrompt,
      hasAnalysis: !!analysis
    })
    
    // Generate search keywords based on analysis and user prompt
    const searchKeywords = generateSearchKeywords(componentType, userPrompt, analysis?.style_characteristics || [])
    console.log('Search keywords:', searchKeywords)
    
    // Search for inspirations using multiple sources
    const inspirations = await searchDesignInspirations(componentType, searchKeywords)
    
    console.log('Found inspirations:', inspirations.length)

    // Store inspirations in database
    let storedCount = 0
    for (const inspiration of inspirations) {
      const { error: inspirationError } = await supabase
        .from('inspirations')
        .insert({
          element_id: elementId,
          title: inspiration.title,
          image_url: inspiration.image_url,
          source: inspiration.source,
          category: componentType,
          tags: inspiration.tags,
          similarity_score: inspiration.similarity_score,
          created_at: new Date().toISOString()
        })
      
      if (inspirationError) {
        console.error('Failed to store inspiration:', inspirationError)
      } else {
        storedCount++
      }
    }
    
    console.log(`Successfully stored ${storedCount}/${inspirations.length} inspirations`)
    
  } catch (error) {
    console.error('Inspiration search failed:', error)
    throw error
  }
}

function detectComponentType(elementData: any): string {
  const tagName = elementData.tagName?.toLowerCase()
  const textContent = elementData.textContent?.toLowerCase() || ''
  const className = elementData.html?.toLowerCase() || ''
  
  // Enhanced heuristics to detect component type
  if (tagName === 'nav' || textContent.includes('menu') || className.includes('nav')) return 'navigation'
  if (tagName === 'header' || textContent.includes('hero') || className.includes('hero')) return 'hero'
  if (tagName === 'footer' || className.includes('footer')) return 'footer'
  if (tagName === 'form' || textContent.includes('submit') || className.includes('form')) return 'form'
  if (tagName === 'button' || className.includes('btn') || className.includes('button')) return 'button'
  if (tagName === 'article' || tagName === 'section' || className.includes('card')) return 'card'
  if (tagName === 'aside' || className.includes('sidebar')) return 'sidebar'
  
  return 'layout'
}

function generateDesignIssues(elementData: any, componentType: string): string[] {
  const issues: string[] = []
  const styles = elementData.computedStyles || {}
  
  // Check common design issues
  if (styles.color && styles.backgroundColor) {
    const textColor = styles.color
    const bgColor = styles.backgroundColor
    if (textColor === bgColor || textColor === 'inherit') {
      issues.push('Poor color contrast - text may be hard to read')
    }
  }
  
  if (!styles.padding || styles.padding === '0px') {
    issues.push('Insufficient padding - element may feel cramped')
  }
  
  if (!styles.margin || styles.margin === '0px') {
    issues.push('No margins - element may be too close to others')
  }
  
  if (componentType === 'button' && !styles.borderRadius) {
    issues.push('Sharp corners - modern buttons typically have rounded edges')
  }
  
  if (!styles.fontWeight || styles.fontWeight === 'normal') {
    issues.push('Weak typography hierarchy - consider bolder text for emphasis')
  }
  
  return issues.length > 0 ? issues : ['No major design issues detected']
}

function extractStyleCharacteristics(elementData: any): string[] {
  const characteristics: string[] = []
  const styles = elementData.computedStyles || {}
  const className = elementData.html?.toLowerCase() || ''
  
  // Detect style patterns
  if (styles.borderRadius && parseFloat(styles.borderRadius) > 8) {
    characteristics.push('rounded')
  }
  
  if (styles.boxShadow && styles.boxShadow !== 'none') {
    characteristics.push('elevated')
  }
  
  if (className.includes('gradient') || styles.background?.includes('gradient')) {
    characteristics.push('gradient')
  }
  
  if (styles.backgroundColor === 'transparent' || !styles.backgroundColor) {
    characteristics.push('minimal')
  }
  
  if (styles.fontSize && parseFloat(styles.fontSize) > 18) {
    characteristics.push('large-text')
  }
  
  return characteristics.length > 0 ? characteristics : ['standard']
}

function generateRecommendations(elementData: any, componentType: string): string[] {
  const recommendations: string[] = []
  const styles = elementData.computedStyles || {}
  
  // Component-specific recommendations
  switch (componentType) {
    case 'button':
      recommendations.push('Consider adding hover effects with transition animations')
      recommendations.push('Use consistent padding (e.g., px-6 py-3) for better proportions')
      recommendations.push('Add focus states for accessibility (focus:ring-2)')
      break
      
    case 'card':
      recommendations.push('Add subtle shadows for depth (shadow-md)')
      recommendations.push('Use consistent border radius (rounded-lg)')
      recommendations.push('Consider proper spacing between content elements')
      break
      
    case 'navigation':
      recommendations.push('Ensure proper spacing between navigation items')
      recommendations.push('Add hover states for interactive elements')
      recommendations.push('Consider sticky positioning for better UX')
      break
      
    default:
      recommendations.push('Improve visual hierarchy with proper typography scale')
      recommendations.push('Add consistent spacing using a design system')
      recommendations.push('Consider accessibility improvements (contrast, focus states)')
  }
  
  return recommendations
}

function generateSearchKeywords(componentType: string, userPrompt: string, characteristics: string[]): string[] {
  const keywords: string[] = []
  
  // Add component type
  keywords.push(componentType)
  
  // Add style characteristics
  keywords.push(...characteristics)
  
  // Extract keywords from user prompt
  if (userPrompt) {
    const promptWords = userPrompt.toLowerCase()
      .split(/[^a-z]+/)
      .filter(word => word.length > 2 && !['the', 'and', 'this', 'that', 'with', 'for'].includes(word))
    keywords.push(...promptWords)
  }
  
  // Add common design terms
  const designTerms = ['modern', 'clean', 'minimal', 'ui', 'design', 'interface']
  keywords.push(...designTerms)
  
  return [...new Set(keywords)] // Remove duplicates
}

async function searchDesignInspirations(componentType: string, keywords: string[]): Promise<any[]> {
  const inspirations: any[] = []
  
  try {
    // Create Unsplash search URLs (free API)
    const searchTerms = [
      `${componentType} ui design`,
      `modern ${componentType}`,
      `${keywords.slice(0, 3).join(' ')} interface`
    ]
    
    let count = 0
    for (const term of searchTerms) {
      if (count >= 6) break // Limit to 6 results
      
      // Use Unsplash Source API for design images
      const baseUrl = 'https://source.unsplash.com/400x300'
      const searchUrl = `${baseUrl}/?${encodeURIComponent(term)}`
      
      inspirations.push({
        title: `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} Design Inspiration`,
        image_url: searchUrl,
        source: 'unsplash',
        tags: keywords.slice(0, 3),
        similarity_score: 0.7 + (Math.random() * 0.2) // Random score between 0.7-0.9
      })
      
      count++
    }
    
    // Add some curated Dribbble-style URLs
    const dribbbleSearches = [
      `https://cdn.dribbble.com/users/1/screenshots/1/shot.jpg`,
      `https://cdn.dribbble.com/users/2/screenshots/2/shot.jpg`,
      `https://cdn.dribbble.com/users/3/screenshots/3/shot.jpg`
    ]
    
    dribbbleSearches.forEach((url, index) => {
      if (count < 6) {
        inspirations.push({
          title: `${componentType} Design Pattern ${index + 1}`,
          image_url: `https://source.unsplash.com/400x300/?ui,${componentType}&v=${Date.now() + index}`,
          source: 'design-collection',
          tags: [componentType, 'modern', 'clean'],
          similarity_score: 0.8 + (Math.random() * 0.1)
        })
        count++
      }
    })
    
  } catch (error) {
    console.error('Search failed:', error)
    
    // Fallback inspirations
    for (let i = 0; i < 3; i++) {
      inspirations.push({
        title: `${componentType} Design Example ${i + 1}`,
        image_url: `https://picsum.photos/400/300?random=${Date.now() + i}`,
        source: 'fallback',
        tags: [componentType, 'design'],
        similarity_score: 0.6
      })
    }
  }
  
  return inspirations
}