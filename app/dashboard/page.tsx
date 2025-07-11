'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Clock, CheckCircle, AlertCircle, Play, User, LogOut } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface QueueItem {
  id: string
  url: string
  elementData: any
  status: 'queued' | 'processing' | 'completed' | 'error'
  priority: number
  timestamp: number
}

interface QueueStats {
  total: number
  queued: number
  processing: number
  completed: number
  error: number
}

export default function DashboardPage() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    queued: 0,
    processing: 0,
    completed: 0,
    error: 0
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check authentication status
    checkAuth()
    loadQueue()
    // Poll for updates every 3 seconds
    const interval = setInterval(loadQueue, 3000)
    return () => clearInterval(interval)
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setAuthLoading(false)
    }
  }

  const loadQueue = async () => {
    try {
      const response = await fetch('/api/elements/queue')
      const data = await response.json()
      
      if (data.queue) {
        setQueue(data.queue)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearQueue = async () => {
    try {
      await fetch('/api/elements/queue', { method: 'DELETE' })
      await loadQueue()
    } catch (error) {
      console.error('Failed to clear queue:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      // Redirect to home or login page
      window.location.href = '/auth/signup'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="w-4 h-4 text-blue-500" />
      case 'processing': return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'border-blue-200 bg-blue-50'
      case 'processing': return 'border-yellow-200 bg-yellow-50'
      case 'completed': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '')
    } catch {
      return url
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Manage your UI element processing queue</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={loadQueue} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={clearQueue} variant="destructive">
              Clear Queue
            </Button>
            
            {/* User Profile */}
            {authLoading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2">
                <img 
                  src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email)}&size=32&background=3B82F6&color=fff`}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                />
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-gray-900">
                    {user.user_metadata?.name || user.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-green-600">✅ Signed in</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-gray-900">Not signed in</div>
                  <div className="text-xs text-orange-600">Limited access</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/auth/signup'}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Elements</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.queued}</div>
              <div className="text-sm text-gray-600">Queued</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Items */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${queue.length} elements in queue`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading queue...</span>
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No elements in queue</h3>
                <p className="text-gray-600 mb-4">
                  Use the Chrome extension to select UI elements and add them to the queue.
                </p>
                <Button asChild>
                  <a href="/install">Install Extension</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 ${getStatusColor(item.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <div className="font-semibold text-gray-900">
                            {item.elementData?.tagName || 'Element'} from {formatUrl(item.url)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Added {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Select Elements</h3>
                <p className="text-sm text-gray-600">
                  Use the Chrome extension to select UI elements on any website
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-gray-600">
                  Elements are analyzed for design improvements and inspiration matching
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Get Code</h3>
                <p className="text-sm text-gray-600">
                  Receive improved code with better design and accessibility
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}