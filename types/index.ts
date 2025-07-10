export interface ScreenshotData {
  id: string
  imageUrl: string
  domElement: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  createdAt: Date
}

export interface DesignInspiration {
  id: string
  title: string
  imageUrl: string
  source: string
  category: 'hero' | 'card' | 'form' | 'navigation' | 'button' | 'layout'
  tags: string[]
}

export interface CodeGeneration {
  id: string
  screenshotId: string
  inspirationId?: string
  generatedCode: string
  framework: 'tailwind' | 'nextjs' | 'react'
  rating?: number
  feedback?: string
  createdAt: Date
}

export interface UserProfile {
  id: string
  email: string
  name?: string
  preferences: {
    defaultFramework: 'tailwind' | 'nextjs' | 'react'
    stylePreferences: string[]
  }
  createdAt: Date
}