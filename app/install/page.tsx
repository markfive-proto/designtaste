'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Chrome, CheckCircle } from 'lucide-react'

export default function InstallPage() {
  const handleDownload = () => {
    // This would download the packaged extension
    const link = document.createElement('a')
    link.href = '/vibe-ui-assistant.zip'
    link.download = 'vibe-ui-assistant.zip'
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Install Vibe UI Assistant
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Get the Chrome extension to start improving your UI/UX with AI-powered suggestions
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-500" />
                  Development Version
                </CardTitle>
                <CardDescription>
                  For testing and development purposes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleDownload}
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Extension
                </Button>
                <p className="text-sm text-gray-600">
                  Download the extension package and follow the installation instructions below.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="w-5 h-5 text-green-500" />
                  Chrome Web Store
                </CardTitle>
                <CardDescription>
                  Official release (coming soon)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  disabled
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Coming Soon
                </Button>
                <p className="text-sm text-gray-600">
                  The extension will be available on the Chrome Web Store after beta testing.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
              <CardDescription>
                Follow these steps to install the development version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Download the Extension</h3>
                    <p className="text-gray-600">
                      Click the "Download Extension" button above to get the latest version.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Extract the Files</h3>
                    <p className="text-gray-600">
                      Unzip the downloaded file to a folder on your computer.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Open Chrome Extensions</h3>
                    <p className="text-gray-600 mb-2">
                      Go to <code className="bg-gray-100 px-2 py-1 rounded">chrome://extensions/</code> in your Chrome browser.
                    </p>
                    <p className="text-gray-600">
                      Enable "Developer mode" in the top right corner.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Load the Extension</h3>
                    <p className="text-gray-600">
                      Click "Load unpacked" and select the folder where you extracted the files.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Start Using!</h3>
                    <p className="text-gray-600">
                      The extension icon should appear in your toolbar. Navigate to any website and press{' '}
                      <kbd className="bg-gray-100 px-2 py-1 rounded border">Ctrl+Shift+V</kbd> to start selecting UI elements.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-8"
        >
          <Button asChild variant="outline">
            <a href="/">Back to Home</a>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}