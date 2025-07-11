'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InspirationModal from '@/components/InspirationModal'
import { 
  ArrowLeft,
  Copy, 
  Check, 
  ExternalLink, 
  Lightbulb, 
  Palette, 
  AlertTriangle, 
  Star,
  Download,
  Code,
  Eye,
  Monitor,
  Wand2
} from 'lucide-react'

interface ElementData {
  id: string
  url: string
  elementData: any
  status: string
  createdAt: string
  processedAt?: string
  errorMessage?: string
}

interface Analysis {
  componentType: string
  designIssues: string[]
  styleCharacteristics: string[]
  recommendations: string[]
  confidenceScore: number
  createdAt: string
}

interface Inspiration {
  id: string
  title: string
  imageUrl: string
  source: string
  category: string
  tags: string[]
  similarityScore: number
  createdAt: string
}

export default function ElementDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const elementId = params.id as string

  const [loading, setLoading] = useState(true)
  const [element, setElement] = useState<ElementData | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'insights' | 'variations' | 'inspirations' | 'code'>('insights')
  const [selectedInspiration, setSelectedInspiration] = useState<Inspiration | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [variations, setVariations] = useState<any[]>([])
  const [loadingVariations, setLoadingVariations] = useState(false)
  // --- Real-time status state ---
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    if (elementId) {
      loadDetails()
      // Real-time status polling
      const fetchStatus = async () => {
        const res = await fetch(`/api/elements/${elementId}/status`)
        setStatus(await res.json())
      }
      fetchStatus()
      const interval = setInterval(fetchStatus, 3000)
      return () => clearInterval(interval)
    }
  }, [elementId])

  const loadDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/elements/${elementId}/details`)
      const data = await response.json()
      
      if (response.ok) {
        setElement(data.element)
        setAnalysis(data.analysis)
        setInspirations(data.inspirations || [])
      } else {
        console.error('Failed to load details:', data.error)
      }
    } catch (error) {
      console.error('Failed to load details:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyImageUrl = async (imageUrl: string, inspirationId: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl)
      setCopiedImageId(inspirationId)
      setTimeout(() => setCopiedImageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(key)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const openInspirationModal = (inspiration: Inspiration) => {
    setSelectedInspiration(inspiration)
    setIsModalOpen(true)
  }

  const openVariationModal = (variation: any) => {
    // Convert variation to inspiration format for the modal
    const variationAsInspiration: Inspiration = {
      id: `variation-${Date.now()}`,
      title: variation.title,
      imageUrl: variation.imageUrl,
      source: 'AI Generated',
      category: analysis?.componentType || 'component',
      tags: variation.changes || [],
      similarityScore: 1.0,
      createdAt: new Date().toISOString()
    }
    setSelectedInspiration(variationAsInspiration)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedInspiration(null)
  }

  const generateVariations = async () => {
    if (!element?.elementData?.elementScreenshot) return
    
    setLoadingVariations(true)
    try {
      const response = await fetch('/api/ai/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: element.elementData.elementScreenshot,
          componentType: analysis?.componentType || 'component',
          originalElementData: element.elementData
        })
      })

      const data = await response.json()
      if (data.success) {
        setVariations(data.variations || [])
      } else {
        console.error('Variations generation failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to generate variations:', error)
    } finally {
      setLoadingVariations(false)
    }
  }

  const generateTailwindCode = () => {
    if (!element?.elementData) return ''
    
    const { tailwindClasses, tagName, innerHTML, attributes } = element.elementData
    
    if (tailwindClasses?.length > 0) {
      // Use extracted Tailwind classes
      const classString = tailwindClasses.join(' ')
      return `<${tagName.toLowerCase()} className="${classString}">\n  ${innerHTML || 'Content here'}\n</${tagName.toLowerCase()}>`
    } else {
      // Generate Tailwind from computed styles
      return generateTailwindFromStyles()
    }
  }

  const generateTailwindFromStyles = () => {
    if (!element?.elementData?.computedStyles) return ''
    
    const styles = element.elementData.computedStyles
    const classes: string[] = []
    
    // Convert common styles to Tailwind
    if (styles.display === 'flex') classes.push('flex')
    if (styles.display === 'grid') classes.push('grid')
    if (styles.justifyContent === 'center') classes.push('justify-center')
    if (styles.alignItems === 'center') classes.push('items-center')
    
    // Background
    if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      classes.push('bg-gray-100') // Simplified
    }
    
    // Text
    if (styles.color) classes.push('text-gray-900')
    if (styles.fontWeight === '600') classes.push('font-semibold')
    if (styles.fontWeight === '700') classes.push('font-bold')
    
    // Spacing
    if (styles.padding) classes.push('p-4')
    if (styles.margin) classes.push('m-4')
    
    // Border
    if (styles.borderRadius) classes.push('rounded-lg')
    if (styles.border && styles.border !== 'none') classes.push('border')
    
    const classString = classes.join(' ')
    const tagName = element.elementData.tagName?.toLowerCase() || 'div'
    
    return `<${tagName} className="${classString}">\n  ${element.elementData.innerHTML || 'Content here'}\n</${tagName}>`
  }

  const generateCSSCode = () => {
    if (!element?.elementData?.computedStyles) return ''
    
    const styles = element.elementData.computedStyles
    const cssRules: string[] = []
    
    Object.entries(styles).forEach(([property, value]) => {
      if (value && value !== 'normal' && value !== 'none') {
        cssRules.push(`  ${property}: ${value};`)
      }
    })
    
    const className = element.elementData.classList?.[0] || 'element'
    return `.${className} {\n${cssRules.join('\n')}\n}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading element details...</p>
        </div>
      </div>
    )
  }

  if (!element) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Element Not Found</h1>
          <p className="text-gray-600 mb-4">The requested element could not be found.</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {element?.elementData?.tagName || 'Element'} Analysis
                </h1>
                <p className="text-sm text-gray-500">
                  from {element?.url ? new URL(element.url).hostname : 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {(element?.status === 'processing' || status?.status === 'processing') && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  View Other Elements
                </Button>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                element?.status === 'completed' ? 'bg-green-100 text-green-800' :
                element?.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                element?.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {element?.status?.charAt(0).toUpperCase() + element?.status?.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time AI status/stepper UI */}
      {status && (element?.status === 'processing' || status?.status === 'processing') && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-lg border border-blue-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <h3 className="font-semibold text-gray-900">AI Analysis in Progress</h3>
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <span className="font-medium text-gray-700">{status.currentStep}</span>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-blue-600">{status.progress}%</span>
            </div>
            
            <div className="flex gap-2 mb-4">
              {status.steps && status.steps.map((step: any, idx: number) => (
                <div
                  key={idx}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    step.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step.label}
                </div>
              ))}
            </div>
            
            <div className="text-blue-600 font-medium text-center">
              🤖 {status.currentStep} - Feel free to browse other elements while waiting!
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Element Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  Original Element
                </CardTitle>
              </CardHeader>
              <CardContent>
                {element.elementData?.elementScreenshot ? (
                  <div className="mb-4">
                    <img
                      src={element.elementData.elementScreenshot}
                      alt="Original element"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
                    <Monitor className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  <div><strong>Tag:</strong> {element.elementData?.tagName}</div>
                  {element.elementData?.userPrompt && (
                    <div><strong>User Input:</strong> "{element.elementData.userPrompt}"</div>
                  )}
                  {element.elementData?.aiSuggestion && (
                    <div><strong>AI Suggestion:</strong> "{element.elementData.aiSuggestion}"</div>
                  )}
                  {element.elementData?.insights && (
                    <div><strong>Insights:</strong> {element.elementData.insights}</div>
                  )}
                  {element.elementData?.tailwindClasses?.length > 0 && (
                    <div><strong>Tailwind Classes:</strong> {element.elementData.tailwindClasses.length}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs Content */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('insights')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'insights'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lightbulb className="w-4 h-4 inline mr-2" />
                Insights
              </button>
              <button
                onClick={() => {
                  setActiveTab('variations')
                  if (variations.length === 0 && !loadingVariations && element?.elementData?.elementScreenshot) {
                    generateVariations()
                  }
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'variations'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wand2 className="w-4 h-4 inline mr-2" />
                AI Variations ({variations.length})
              </button>
              <button
                onClick={() => setActiveTab('inspirations')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'inspirations'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Star className="w-4 h-4 inline mr-2" />
                Inspirations ({inspirations.length})
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code className="w-4 h-4 inline mr-2" />
                Code
              </button>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'insights' && analysis && (
                <div className="space-y-6">
                  {/* Design Issues */}
                  {analysis.designIssues && analysis.designIssues.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-orange-600">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          Design Issues
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analysis.designIssues.map((issue, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-green-600">
                          <Lightbulb className="w-5 h-5 mr-2" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-4">
                          {analysis.recommendations.map((recommendation, index) => (
                            <li key={index} className="flex items-start justify-between group">
                              <div className="flex items-start flex-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{recommendation}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyText(recommendation, `rec-${index}`)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                              >
                                {copiedText === `rec-${index}` ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'variations' && (
                <div>
                  {loadingVariations ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating AI Variations</h3>
                        <p className="text-gray-600">
                          Creating design variations based on your element...
                        </p>
                      </CardContent>
                    </Card>
                  ) : variations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {variations.map((variation, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="relative cursor-pointer" onClick={() => openVariationModal(variation)}>
                            <img
                              src={variation.imageUrl}
                              alt={variation.title}
                              className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Variation+Preview'
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 backdrop-blur-sm">
                                <Wand2 className="w-4 h-4 inline mr-2" />
                                Generate Code
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 mb-1">{variation.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{variation.description}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {variation.changes?.slice(0, 3).map((change: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  {change}
                                </span>
                              ))}
                            </div>
                            <Button
                              onClick={() => openVariationModal(variation)}
                              className="w-full"
                              size="sm"
                            >
                              <Wand2 className="w-4 h-4 mr-2" />
                              Generate Code
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Wand2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Design Variations</h3>
                        <p className="text-gray-600 mb-4">
                          Generate AI-powered design variations based on your original element.
                        </p>
                        <Button onClick={generateVariations} disabled={!element?.elementData?.elementScreenshot}>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Variations
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'inspirations' && (
                <div>
                  {inspirations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {inspirations.map((inspiration) => (
                        <motion.div
                          key={inspiration.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="relative cursor-pointer" onClick={() => openInspirationModal(inspiration)}>
                            <img
                              src={inspiration.imageUrl}
                              alt={inspiration.title}
                              className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available'
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 backdrop-blur-sm">
                                <Wand2 className="w-4 h-4 inline mr-2" />
                                Generate AI Code
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyImageUrl(inspiration.imageUrl, inspiration.id)
                                }}
                                className="bg-white bg-opacity-90 hover:bg-opacity-100"
                              >
                                {copiedImageId === inspiration.id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(inspiration.imageUrl, '_blank')
                                }}
                                className="bg-white bg-opacity-90 hover:bg-opacity-100"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 mb-1">{inspiration.title}</h4>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                              <span>from {inspiration.source}</span>
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-1 text-yellow-400" />
                                {(inspiration.similarityScore * 100).toFixed(0)}%
                              </span>
                            </div>
                            {inspiration.tags && inspiration.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {inspiration.tags.slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <Button
                              onClick={() => openInspirationModal(inspiration)}
                              className="w-full"
                              size="sm"
                            >
                              <Wand2 className="w-4 h-4 mr-2" />
                              AI Code Generation
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inspirations Available</h3>
                        <p className="text-gray-600">
                          No design inspirations were generated for this element.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'code' && (
                <div className="space-y-6">
                  {/* Tailwind Code */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Code className="w-5 h-5 mr-2 text-blue-600" />
                          Tailwind CSS
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyText(generateTailwindCode(), 'tailwind')}
                        >
                          {copiedText === 'tailwind' ? (
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{generateTailwindCode()}</code>
                      </pre>
                    </CardContent>
                  </Card>

                  {/* CSS Code */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Palette className="w-5 h-5 mr-2 text-purple-600" />
                          CSS Styles
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyText(generateCSSCode(), 'css')}
                        >
                          {copiedText === 'css' ? (
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{generateCSSCode()}</code>
                      </pre>
                    </CardContent>
                  </Card>

                  {/* Raw HTML */}
                  {element.elementData?.html && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Monitor className="w-5 h-5 mr-2 text-orange-600" />
                            Raw HTML
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyText(element.elementData.html, 'html')}
                          >
                            {copiedText === 'html' ? (
                              <Check className="w-4 h-4 mr-2 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 mr-2" />
                            )}
                            Copy
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                          <code>{element.elementData.html}</code>
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI-Powered Inspiration Modal */}
      {selectedInspiration && (
        <InspirationModal
          isOpen={isModalOpen}
          onClose={closeModal}
          inspiration={{
            id: selectedInspiration.id,
            title: selectedInspiration.title,
            imageUrl: selectedInspiration.imageUrl,
            source: selectedInspiration.source,
            category: selectedInspiration.category,
            tags: selectedInspiration.tags,
            similarityScore: selectedInspiration.similarityScore
          }}
          componentType={analysis?.componentType || 'component'}
          originalElementData={element?.elementData}
        />
      )}
    </div>
  )
}