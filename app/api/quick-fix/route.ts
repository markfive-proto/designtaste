import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { elementData, prompt } = await request.json()

    if (!elementData || !prompt) {
      return NextResponse.json(
        { error: 'Missing element data or prompt' },
        { status: 400 }
      )
    }

    // Generate quick fix suggestion based on prompt analysis
    const suggestion = generateQuickFixSuggestion(elementData, prompt)

    return NextResponse.json({
      success: true,
      suggestion,
      type: 'quick_fix'
    })

  } catch (error) {
    console.error('Quick fix API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quick fix' },
      { status: 500 }
    )
  }
}

function generateQuickFixSuggestion(elementData: any, prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  const tagName = elementData.tagName?.toLowerCase() || 'element'
  
  // Color and contrast improvements
  if (lowerPrompt.includes('color') || lowerPrompt.includes('contrast')) {
    return `**Color & Contrast Improvements:**

• **Text Color**: Use at least \`text-gray-700\` or \`text-gray-900\` for better readability
• **Background**: Ensure sufficient contrast ratio (4.5:1 for normal text)
• **Hover States**: Add \`hover:bg-blue-600\` for interactive elements
• **Focus States**: Include \`focus:ring-2 focus:ring-blue-500\` for accessibility

**Quick Tailwind Classes:**
\`\`\`css
text-gray-900 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500
\`\`\``
  }
  
  // Spacing and layout
  if (lowerPrompt.includes('spacing') || lowerPrompt.includes('padding') || lowerPrompt.includes('margin') || lowerPrompt.includes('layout')) {
    return `**Spacing & Layout Improvements:**

• **Consistent Padding**: Use \`px-6 py-3\` for buttons, \`p-4\` for cards
• **Vertical Rhythm**: Add \`space-y-4\` to containers for consistent spacing
• **Margins**: Use \`mb-4\` for bottom spacing, \`mt-2\` for top spacing
• **Flex/Grid Gaps**: Use \`gap-4\` or \`gap-6\` for modern layouts

**Quick Tailwind Classes:**
\`\`\`css
px-6 py-3 space-y-4 gap-4 mb-4
\`\`\``
  }
  
  // Modern/styling improvements
  if (lowerPrompt.includes('modern') || lowerPrompt.includes('better') || lowerPrompt.includes('improve') || lowerPrompt.includes('style')) {
    return `**Modern Styling for ${tagName}:**

• **Rounded Corners**: Add \`rounded-lg\` for modern feel
• **Subtle Shadows**: Use \`shadow-md\` or \`shadow-lg\` for depth
• **Smooth Transitions**: Include \`transition-all duration-200\`
• **Typography**: Use \`font-semibold\` and proper text sizes

**Quick Tailwind Classes:**
\`\`\`css
rounded-lg shadow-md transition-all duration-200 font-semibold
\`\`\``
  }
  
  // Button specific improvements
  if (tagName === 'button' || lowerPrompt.includes('button')) {
    return `**Button Improvements:**

• **Size & Padding**: Use \`px-6 py-3\` for good click targets
• **Colors**: Primary buttons with \`bg-blue-600 text-white\`
• **Hover Effects**: Add \`hover:bg-blue-700\` for interaction feedback
• **Focus States**: Include \`focus:outline-none focus:ring-2 focus:ring-blue-500\`
• **Border Radius**: Use \`rounded-lg\` for modern appearance

**Complete Button Classes:**
\`\`\`css
px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg 
hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
transition-colors duration-200
\`\`\``
  }
  
  // Form elements
  if (tagName.includes('input') || lowerPrompt.includes('form') || lowerPrompt.includes('input')) {
    return `**Form Input Improvements:**

• **Border Styling**: Use \`border-2 border-gray-300\`
• **Focus States**: Add \`focus:border-blue-500 focus:ring-blue-500\`
• **Padding**: Use \`px-4 py-2\` for comfortable input
• **Rounded Corners**: Add \`rounded-md\` for modern look

**Input Classes:**
\`\`\`css
w-full px-4 py-2 border-2 border-gray-300 rounded-md 
focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none
\`\`\``
  }
  
  // Typography improvements
  if (lowerPrompt.includes('text') || lowerPrompt.includes('typography') || lowerPrompt.includes('font')) {
    return `**Typography Improvements:**

• **Font Weight**: Use \`font-semibold\` for headings, \`font-medium\` for important text
• **Text Size**: Scale properly with \`text-lg\`, \`text-xl\`, or \`text-2xl\`
• **Line Height**: Add \`leading-relaxed\` for better readability
• **Color Hierarchy**: Use \`text-gray-900\` for primary, \`text-gray-600\` for secondary

**Typography Classes:**
\`\`\`css
text-xl font-semibold text-gray-900 leading-relaxed
\`\`\``
  }
  
  // Default generic improvement
  return `**General Improvements for ${tagName}:**

• **Visual Hierarchy**: Use proper font weights (\`font-semibold\`, \`font-medium\`)
• **Spacing**: Add consistent padding and margins (\`p-4\`, \`mb-4\`)
• **Modern Styling**: Include \`rounded-lg\` and \`shadow-sm\`
• **Interactive States**: Add hover and focus effects
• **Smooth Transitions**: Use \`transition-all duration-200\`

**Recommended Classes:**
\`\`\`css
p-4 rounded-lg shadow-sm font-medium transition-all duration-200
hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500
\`\`\`

*💡 Tip: Test your changes and adjust values based on your design system!*`
}