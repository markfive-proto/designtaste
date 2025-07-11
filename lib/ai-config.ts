import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { mistral } from '@ai-sdk/mistral'

// AI Provider types
export type AIProvider = 'openai' | 'anthropic' | 'mistral'

// Provider configurations
export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: {
      text: 'gpt-4-turbo-preview',
      vision: 'gpt-4-vision-preview',
      fast: 'gpt-3.5-turbo'
    },
    instance: openai,
    supportsVision: true,
    supportsJSONMode: true
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: {
      text: 'claude-3-5-sonnet-20241022',
      vision: 'claude-3-5-sonnet-20241022',
      fast: 'claude-3-haiku-20240307'
    },
    instance: anthropic,
    supportsVision: true,
    supportsJSONMode: true
  },
  mistral: {
    name: 'Mistral AI',
    models: {
      text: 'mistral-large-latest',
      vision: 'pixtral-12b-2409',
      fast: 'mistral-small-latest'
    },
    instance: mistral,
    supportsVision: true,
    supportsJSONMode: true
  }
} as const

// Get current AI provider from environment
export function getAIProvider(): AIProvider {
  const provider = process.env.DEFAULT_AI_PROVIDER as AIProvider
  if (provider && provider in AI_PROVIDERS) {
    return provider
  }
  return 'openai' // Default fallback
}

// Task-specific provider recommendations
export const TASK_PROVIDERS = {
  UI_ANALYSIS: 'mistral' as AIProvider, // Mistral excels at analyzing UI components
  CODE_GENERATION: 'anthropic' as AIProvider, // Anthropic Claude is excellent for code generation
  PROMPT_GENERATION: 'openai' as AIProvider, // OpenAI is good for creative text generation
  IMAGE_ANALYSIS: 'mistral' as AIProvider, // Mistral has good vision capabilities for UI
  CODE_IMPROVEMENT: 'anthropic' as AIProvider, // Anthropic is best for code improvements
} as const

// Get optimal provider for a specific task
export function getOptimalProvider(task: keyof typeof TASK_PROVIDERS): AIProvider {
  const recommendedProvider = TASK_PROVIDERS[task]
  
  // Check if the recommended provider has a valid API key
  if (hasValidApiKey(recommendedProvider)) {
    return recommendedProvider
  }
  
  // Fallback to any available provider
  const availableProviders = getAvailableProviders().filter(p => p.hasApiKey)
  if (availableProviders.length > 0) {
    console.warn(`Recommended provider ${recommendedProvider} not available for ${task}. Using ${availableProviders[0].id}`)
    return availableProviders[0].id
  }
  
  // Final fallback
  console.warn(`No AI providers available for ${task}. Using OpenAI as fallback.`)
  return 'openai'
}

// Get model instance based on provider and requirements
export function getModel(provider: AIProvider, options: {
  useVision?: boolean
  useFast?: boolean
} = {}) {
  const { useVision = false, useFast = false } = options
  const config = AI_PROVIDERS[provider]
  
  if (!config) {
    console.warn(`Unknown AI provider: ${provider}. Falling back to OpenAI.`)
    return openai('gpt-4-turbo-preview')
  }

  const modelKey = useFast ? 'fast' : useVision ? 'vision' : 'text'
  const modelName = config.models[modelKey]
  
  return config.instance(modelName)
}

// Get model for specific task (combines provider selection and model configuration)
export function getModelForTask(task: keyof typeof TASK_PROVIDERS, options: {
  useVision?: boolean
  useFast?: boolean
} = {}) {
  const provider = getOptimalProvider(task)
  return getModel(provider, options)
}

// Get available providers with their capabilities
export function getAvailableProviders(): Array<{
  id: AIProvider
  name: string
  supportsVision: boolean
  supportsJSONMode: boolean
  hasApiKey: boolean
}> {
  return Object.entries(AI_PROVIDERS).map(([id, config]) => ({
    id: id as AIProvider,
    name: config.name,
    supportsVision: config.supportsVision,
    supportsJSONMode: config.supportsJSONMode,
    hasApiKey: hasValidApiKey(id as AIProvider)
  }))
}

// Check if API key is configured for a provider
function hasValidApiKey(provider: AIProvider): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key'
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key'
    case 'mistral':
      return !!process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY !== 'your_mistral_api_key'
    default:
      return false
  }
}

// Provider-specific error handling
export function handleProviderError(provider: AIProvider, error: any): string {
  const providerName = AI_PROVIDERS[provider]?.name || provider
  
  if (error?.message?.includes('API key')) {
    return `${providerName} API key is invalid or missing. Please check your environment variables.`
  }
  
  if (error?.message?.includes('rate limit')) {
    return `${providerName} rate limit exceeded. Please try again later.`
  }
  
  if (error?.message?.includes('model not found')) {
    return `${providerName} model not available. The service may be experiencing issues.`
  }
  
  return `${providerName} request failed: ${error?.message || 'Unknown error'}`
}