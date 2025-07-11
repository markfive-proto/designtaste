'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Lightbulb, 
  Palette, 
  AlertTriangle, 
  Star,
  Download
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

interface ElementDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  elementId: string
}

export default function ElementDetailsModal({ isOpen, onClose, elementId }: ElementDetailsModalProps) {
  const [loading, setLoading] = useState(true)
  const [element, setElement] = useState<ElementData | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [inspirations, setInspirations] = useState<Inspiration[]>([])
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && elementId) {
      loadDetails()
    }
  }, [isOpen, elementId])

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

  const downloadImage = (imageUrl: string, title: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
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
              <h2 className="text-2xl font-bold text-gray-900">Element Analysis</h2>
              <p className="text-sm text-gray-600 mt-1">
                {element?.elementData?.tagName || 'Element'} from {element?.url ? new URL(element.url).hostname : 'Unknown'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading details...</span>
              </div>
            ) : (
              <div className="p-6 space-y-8">
                {/* Element Preview */}
                {element?.elementData?.elementScreenshot && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Palette className="w-5 h-5 mr-2 text-blue-600" />
                      Original Element
                    </h3>
                    <div className="flex items-start gap-4">
                      <img
                        src={element.elementData.elementScreenshot}
                        alt="Original element"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Tag:</strong> {element.elementData.tagName}</p>
                          <p><strong>Type:</strong> {analysis?.componentType || 'Unknown'}</p>
                          {element.elementData.userPrompt && (
                            <p><strong>Request:</strong> "{element.elementData.userPrompt}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Results */}
                {analysis && (
                  <div className="space-y-6">
                    {/* Design Issues */}
                    {analysis.designIssues && analysis.designIssues.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                          Design Issues
                        </h3>
                        <div className="bg-orange-50 rounded-lg p-4">
                          <ul className="space-y-2">
                            {analysis.designIssues.map((issue, index) => (
                              <li key={index} className="flex items-start">
                                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-gray-700">{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2 text-green-600" />
                          Recommendations
                        </h3>
                        <div className="bg-green-50 rounded-lg p-4">
                          <ul className="space-y-3">
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
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Design Inspirations */}
                {inspirations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-purple-600" />
                      Design Inspirations ({inspirations.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {inspirations.map((inspiration) => (
                        <motion.div
                          key={inspiration.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="relative">
                            <img
                              src={inspiration.imageUrl}
                              alt={inspiration.title}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available'
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200">
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => copyImageUrl(inspiration.imageUrl, inspiration.id)}
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
                                  onClick={() => downloadImage(inspiration.imageUrl, inspiration.title)}
                                  className="bg-white bg-opacity-90 hover:bg-opacity-100"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => window.open(inspiration.imageUrl, '_blank')}
                                  className="bg-white bg-opacity-90 hover:bg-opacity-100"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 mb-1">{inspiration.title}</h4>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                              <span>from {inspiration.source}</span>
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-1 text-yellow-400" />
                                {(inspiration.similarityScore * 100).toFixed(0)}%
                              </span>
                            </div>
                            {inspiration.tags && inspiration.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
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
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Data States */}
                {!analysis && inspirations.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Available</h3>
                    <p className="text-gray-600">
                      This element hasn't been fully processed yet or encountered an error during analysis.
                    </p>
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