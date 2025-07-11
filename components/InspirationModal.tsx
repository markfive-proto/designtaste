'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Copy, 
  Check, 
  Code, 
  Wand2, 
  Download,
  ExternalLink,
  Loader2,
  FileText,
  Sparkles
} from 'lucide-react'

interface InspirationModalProps {
  isOpen: boolean
  onClose: () => void
  inspiration: {
    id: string
    title: string
    imageUrl: string
    source: string
    category: string
    tags: string[]
    similarityScore: number
  }
  componentType: string
  originalElementData?: any
}

interface GeneratedCode {
  tailwindCode: string
  reactCode: string
  cssCode: string
  description: string
  features: string[]
  accessibility: string[]
  responsive: boolean
  animations: string[]
}

export default function InspirationModal({ 
  isOpen, 
  onClose, 
  inspiration, 
  componentType, 
  originalElementData 
}: InspirationModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'prompt' | 'code'>('preview')
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('')
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(key)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const generateCodeFromImage = async () => {
    setIsGeneratingCode(true)
    try {
      const response = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: inspiration.imageUrl,
          componentType,
          userPrompt: `Recreate this ${componentType} design inspired by ${inspiration.title}`,
          originalElementData
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedCode(data.code)
        setActiveTab('code')
      } else {
        console.error('Code generation failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to generate code:', error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const generatePromptFromImage = async () => {
    setIsGeneratingPrompt(true)
    try {
      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: inspiration.imageUrl,
          componentType
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedPrompt(data.prompt)
        setActiveTab('prompt')
      } else {
        console.error('Prompt generation failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to generate prompt:', error)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = inspiration.imageUrl
    link.download = `${inspiration.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-white rounded-lg shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{inspiration.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                from {inspiration.source} • {(inspiration.similarityScore * 100).toFixed(0)}% match
              </p>
            </div>
            <div className="flex items-center gap-2">
              {inspiration.source === 'Dribbble' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const searchQuery = `${componentType} ${inspiration.tags.slice(0, 2).join(' ')}`.toLowerCase().replace(/\s+/g, '-')
                    window.open(`https://dribbble.com/search/${searchQuery}`, '_blank')
                  }}
                  className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Dribbble
                </Button>
              )}
              {inspiration.source === 'Mobbin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const mobbinPatterns: Record<string, string> = {
                      'hero': 'Hero+Section',
                      'form': 'Forms',
                      'navigation': 'Navigation',
                      'button': 'Buttons',
                      'card': 'Cards'
                    }
                    const pattern = mobbinPatterns[componentType.toLowerCase()] || 'pagePatterns.Hero+Section'
                    window.open(`https://mobbin.com/search/apps/web?content_type=marketing-pages&filter=${pattern}`, '_blank')
                  }}
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Mobbin
                </Button>
              )}
              {inspiration.source === 'SaaS Landing Page' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://saaslandingpage.com/', '_blank')}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View SaaS Examples
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={downloadImage}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(inspiration.imageUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Image
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'prompt'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              AI Prompt
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'code'
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" />
              Generated Code
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'preview' && (
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Image */}
                  <div className="lg:w-1/2">
                    <img
                      src={inspiration.imageUrl}
                      alt={inspiration.title}
                      className="w-full rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Image+Not+Available'
                      }}
                    />
                  </div>
                  
                  {/* Details & Actions */}
                  <div className="lg:w-1/2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Design Details</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Component:</strong> {componentType}</div>
                        <div><strong>Source:</strong> {inspiration.source}</div>
                        <div><strong>Match Score:</strong> {(inspiration.similarityScore * 100).toFixed(0)}%</div>
                      </div>
                      
                      {inspiration.tags && inspiration.tags.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {inspiration.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Explore More</h3>
                      
                      {inspiration.source === 'Dribbble' && (
                        <Button
                          onClick={() => {
                            const searchQuery = `${componentType} ${inspiration.tags.slice(0, 2).join(' ')}`.toLowerCase().replace(/\s+/g, '-')
                            window.open(`https://dribbble.com/search/${searchQuery}`, '_blank')
                          }}
                          variant="outline"
                          className="w-full bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Browse Similar on Dribbble
                        </Button>
                      )}
                      
                      {inspiration.source === 'Behance' && (
                        <Button
                          onClick={() => {
                            const searchQuery = `${componentType} ${inspiration.tags.slice(0, 2).join(' ')}`.toLowerCase().replace(/\s+/g, '%20')
                            window.open(`https://www.behance.net/search/projects?search=${searchQuery}`, '_blank')
                          }}
                          variant="outline"
                          className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Browse Similar on Behance
                        </Button>
                      )}
                      
                      {inspiration.source === 'Pinterest' && (
                        <Button
                          onClick={() => {
                            const searchQuery = `${componentType} UI design ${inspiration.tags.slice(0, 2).join(' ')}`.toLowerCase().replace(/\s+/g, '%20')
                            window.open(`https://www.pinterest.com/search/pins/?q=${searchQuery}`, '_blank')
                          }}
                          variant="outline"
                          className="w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Browse Similar on Pinterest
                        </Button>
                      )}
                      
                      {inspiration.source === 'Mobbin' && (
                        <Button
                          onClick={() => {
                            const mobbinPatterns: Record<string, string> = {
                              'hero': 'Hero+Section',
                              'form': 'Forms',
                              'navigation': 'Navigation',
                              'button': 'Buttons',
                              'card': 'Cards',
                              'footer': 'Footer',
                              'header': 'Header'
                            }
                            const pattern = mobbinPatterns[componentType.toLowerCase()] || 'pagePatterns.Hero+Section'
                            window.open(`https://mobbin.com/search/apps/web?content_type=marketing-pages&filter=${pattern}`, '_blank')
                          }}
                          variant="outline"
                          className="w-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Browse ${componentType} on Mobbin
                        </Button>
                      )}
                      
                      {inspiration.source === 'SaaS Landing Page' && (
                        <Button
                          onClick={() => {
                            window.open('https://saaslandingpage.com/', '_blank')
                          }}
                          variant="outline"
                          className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Browse SaaS Examples
                        </Button>
                      )}

                      <h3 className="text-lg font-semibold pt-4">AI-Powered Actions</h3>
                      
                      <Button
                        onClick={generatePromptFromImage}
                        disabled={isGeneratingPrompt}
                        className="w-full"
                        variant="outline"
                      >
                        {isGeneratingPrompt ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        Generate Design Prompt
                      </Button>
                      
                      <Button
                        onClick={generateCodeFromImage}
                        disabled={isGeneratingCode}
                        className="w-full"
                      >
                        {isGeneratingCode ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Code className="w-4 h-4 mr-2" />
                        )}
                        Generate Code from Image
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prompt' && (
              <div className="p-6">
                {generatedPrompt ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Generated Design Prompt</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedPrompt, 'prompt')}
                      >
                        {copiedItem === 'prompt' ? (
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy Prompt
                      </Button>
                    </div>
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {generatedPrompt}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Generate an AI prompt to describe this design
                    </p>
                    <Button onClick={generatePromptFromImage} disabled={isGeneratingPrompt}>
                      {isGeneratingPrompt ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      Generate Prompt
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'code' && (
              <div className="p-6">
                {generatedCode ? (
                  <div className="space-y-6">
                    {/* Description */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Generated Component</h4>
                      <p className="text-blue-800">{generatedCode.description}</p>
                      
                      {generatedCode.features.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-blue-900 mb-1">Features:</h5>
                          <ul className="text-sm text-blue-700 list-disc list-inside">
                            {generatedCode.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Tailwind Code */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Tailwind CSS</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedCode.tailwindCode, 'tailwind')}
                        >
                          {copiedItem === 'tailwind' ? (
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{generatedCode.tailwindCode}</code>
                      </pre>
                    </div>

                    {/* React Code */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">React Component</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedCode.reactCode, 'react')}
                        >
                          {copiedItem === 'react' ? (
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{generatedCode.reactCode}</code>
                      </pre>
                    </div>

                    {/* CSS Code */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Pure CSS</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedCode.cssCode, 'css')}
                        >
                          {copiedItem === 'css' ? (
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{generatedCode.cssCode}</code>
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Generate production-ready code from this design
                    </p>
                    <Button onClick={generateCodeFromImage} disabled={isGeneratingCode}>
                      {isGeneratingCode ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Code className="w-4 h-4 mr-2" />
                      )}
                      Generate Code
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}