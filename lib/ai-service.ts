import { generateText, generateObject } from 'ai'
import { z } from 'zod'
import { getAIProvider, getModel, getModelForTask, getOptimalProvider, handleProviderError } from './ai-config'

// Schema for generated component code
const ComponentCodeSchema = z.object({
  tailwindCode: z.string().describe('Complete Tailwind CSS component code'),
  reactCode: z.string().describe('React component with TypeScript'),
  cssCode: z.string().describe('Pure CSS alternative'),
  description: z.string().describe('Description of the design'),
  features: z.array(z.string()).describe('Key features of the component'),
  accessibility: z.array(z.string()).describe('Accessibility considerations'),
  responsive: z.boolean().describe('Whether the component is responsive'),
  animations: z.array(z.string()).describe('Animation effects used')
})

export type GeneratedComponentCode = z.infer<typeof ComponentCodeSchema>

export async function generateCodeFromInspiration(
  imageUrl: string,
  componentType: string,
  userPrompt?: string,
  originalElementData?: any
): Promise<GeneratedComponentCode> {
  try {
    const model = getModelForTask('CODE_GENERATION', { useVision: true })
    
    const systemPrompt = `You are an expert UI/UX developer who can analyze design images and generate high-quality, production-ready code.

CONTEXT:
- Component Type: ${componentType}
- User Request: ${userPrompt || 'Recreate this design'}
- Original Element: ${originalElementData ? JSON.stringify(originalElementData, null, 2) : 'None'}

TASK:
Analyze the design inspiration image and generate:
1. Modern Tailwind CSS component code
2. React TypeScript component
3. Pure CSS alternative
4. Detailed description and features

REQUIREMENTS:
- Use modern Tailwind CSS classes
- Include hover states and transitions
- Make it responsive (mobile-first)
- Follow accessibility best practices
- Use semantic HTML
- Include proper TypeScript types
- Add animation effects where appropriate

STYLE GUIDELINES:
- Use consistent spacing (4, 6, 8, 12, 16, 24)
- Modern color palette (gray, blue, green, etc.)
- Rounded corners (rounded-lg, rounded-xl)
- Subtle shadows (shadow-sm, shadow-md)
- Clean typography (font-medium, font-semibold)
- Proper contrast ratios

OUTPUT FORMAT:
Return properly formatted, ready-to-use code that developers can copy and paste.`

    const result = await generateObject({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please analyze this ${componentType} design and generate production-ready code. Focus on recreating the visual style, layout, and interactions shown in the image.`
            },
            {
              type: 'image',
              image: imageUrl
            }
          ]
        }
      ],
      schema: ComponentCodeSchema,
      temperature: 0.3 // Lower temperature for more consistent code generation
    })

    return result.object
  } catch (error) {
    const provider = getOptimalProvider('CODE_GENERATION')
    console.error('AI code generation failed:', handleProviderError(provider, error))
    
    // Fallback to template-based generation
    return generateFallbackCode(componentType, userPrompt)
  }
}

export async function generatePromptFromInspiration(
  imageUrl: string,
  componentType: string
): Promise<string> {
  try {
    const model = getModelForTask('PROMPT_GENERATION', { useVision: true })
    
    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a UI/UX design expert. Analyze the provided image and create a detailed, actionable prompt that a developer could use to recreate this ${componentType} design.

The prompt should include:
- Layout structure and positioning
- Color scheme and styling
- Typography and spacing
- Interactive elements and states
- Responsive behavior
- Animation effects
- Accessibility considerations

Make the prompt specific, actionable, and professional.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this ${componentType} design and create a detailed prompt for recreating it:`
            },
            {
              type: 'image',
              image: imageUrl
            }
          ]
        }
      ],
      temperature: 0.4
    })

    return result.text
  } catch (error) {
    const provider = getOptimalProvider('PROMPT_GENERATION')
    console.error('AI prompt generation failed:', handleProviderError(provider, error))
    return generateFallbackPrompt(componentType)
  }
}

export async function improveExistingCode(
  currentCode: string,
  improvementRequest: string,
  componentType: string
): Promise<string> {
  try {
    const model = getModelForTask('CODE_IMPROVEMENT', { useVision: false })
    
    const result = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert frontend developer. Improve the provided ${componentType} code based on the user's request. 

Focus on:
- Modern best practices
- Performance optimization
- Accessibility improvements
- Code readability
- Responsive design
- Animation enhancements

Return only the improved code, properly formatted.`
        },
        {
          role: 'user',
          content: `Current code:
\`\`\`
${currentCode}
\`\`\`

Improvement request: ${improvementRequest}

Please provide the improved version:`
        }
      ],
      temperature: 0.2
    })

    return result.text
  } catch (error) {
    const provider = getOptimalProvider('CODE_IMPROVEMENT')
    console.error('Code improvement failed:', handleProviderError(provider, error))
    return currentCode
  }
}

function generateFallbackCode(componentType: string, userPrompt?: string): GeneratedComponentCode {
  const fallbackTemplates: Record<string, GeneratedComponentCode> = {
    form: {
      tailwindCode: `<form className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2">
      Email
    </label>
    <input 
      type="email" 
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Enter your email"
    />
  </div>
  <button 
    type="submit"
    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
  >
    Submit
  </button>
</form>`,
      reactCode: `import React, { useState } from 'react';

interface FormProps {
  onSubmit: (email: string) => void;
}

export default function EmailForm({ onSubmit }: FormProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
          Email
        </label>
        <input 
          id="email"
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email"
          required
        />
      </div>
      <button 
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
      >
        Submit
      </button>
    </form>
  );
}`,
      cssCode: `.email-form {
  max-width: 28rem;
  margin: 0 auto;
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.375rem;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus {
  ring: 2px solid #3B82F6;
  border-color: #3B82F6;
}

.submit-button {
  width: 100%;
  background: #3B82F6;
  color: white;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background: #2563EB;
}`,
      description: 'A clean, modern email form with focus states and hover effects',
      features: ['Responsive design', 'Focus states', 'Hover effects', 'Clean typography'],
      accessibility: ['Proper labels', 'Focus indicators', 'ARIA attributes', 'Keyboard navigation'],
      responsive: true,
      animations: ['Hover transitions', 'Focus ring']
    },
    button: {
      tailwindCode: `<button className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click Me
</button>`,
      reactCode: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}: ButtonProps) {
  const baseClasses = 'font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white focus:ring-blue-500 hover:shadow-lg transform hover:-translate-y-0.5'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500';

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed transform-none' 
    : '';

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={\`\${baseClasses} \${variantClasses} \${disabledClasses}\`}
    >
      {children}
    </button>
  );
}`,
      cssCode: `.btn {
  font-weight: 600;
  padding: 0.5rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  outline: none;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover {
  background: #2563EB;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.btn-primary:active {
  background: #1D4ED8;
}

.btn-primary:focus {
  ring: 2px solid #3B82F6;
  ring-offset: 2px;
}`,
      description: 'A modern button with hover effects and smooth transitions',
      features: ['Hover animation', 'Active states', 'Shadow effects', 'Focus indicators'],
      accessibility: ['Focus ring', 'ARIA support', 'Keyboard navigation', 'Disabled state'],
      responsive: true,
      animations: ['Hover lift', 'Shadow transition', 'Color transitions']
    }
  }

  return fallbackTemplates[componentType] || fallbackTemplates.button
}

function generateFallbackPrompt(componentType: string): string {
  const prompts: Record<string, string> = {
    form: `Create a modern ${componentType} with clean input fields, proper spacing, focus states, and a prominent submit button. Use a card-like container with subtle shadows and ensure good contrast for accessibility.`,
    button: `Design a ${componentType} with smooth hover animations, proper focus states, and multiple variants. Include elevation effects and ensure it meets accessibility standards.`,
    navigation: `Build a ${componentType} menu with clear hierarchy, hover effects, and responsive behavior. Use proper spacing and typography scale.`,
    card: `Create a ${componentType} component with proper content hierarchy, subtle shadows, and hover interactions. Ensure responsive layout and good information architecture.`
  }

  return prompts[componentType] || `Create a modern ${componentType} component with clean design, proper spacing, and smooth interactions.`
}