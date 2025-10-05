import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import D3TwitterCircle from '../components/D3TwitterCircle'
import { TwitterAPIProxy } from '../lib/twitter-api-proxy'
import { InteractionCalculator, CircleData } from '../lib/interaction-calculator'
import { convertUser } from '../lib/twitter-adapter'
import { useWindowSize } from '@/lib/hooks/useWindowSize'
import { AnalysisError } from '@/components/AnalysisError'

export const Route = createFileRoute('/interaction-circle')({
  head: () => ({
    meta: [
      {
        title: 'Twitter Interaction Circle Generator - XKit Tools',
      },
      {
        name: 'description',
        content:
          'Analyze your Twitter interaction data and generate personalized interaction circle visualizations. Discover who you interact with most on Twitter through replies and likes analysis.',
      },
      {
        name: 'keywords',
        content:
          'twitter, interaction circle, social media analysis, twitter analytics, data visualization, twitter tools, social network analysis',
      },
      // Open Graph tags
      {
        property: 'og:title',
        content: 'Twitter Interaction Circle Generator - XKit Tools',
      },
      {
        property: 'og:description',
        content:
          'Analyze your Twitter interaction data and generate personalized interaction circle visualizations. Discover who you interact with most on Twitter.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: 'https://xkit.rxliuli.com/interaction-circle',
      },
      {
        property: 'og:image',
        content: 'https://xkit.rxliuli.com/og/interaction-circle.jpg',
      },
      {
        property: 'og:image:width',
        content: '2560',
      },
      {
        property: 'og:image:height',
        content: '1600',
      },
      {
        property: 'og:image:alt',
        content: 'Twitter Interaction Circle Generator - XKit Tools',
      },
      {
        property: 'og:site_name',
        content: 'XKit Tools',
      },
      // Twitter Card tags
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Twitter Interaction Circle Generator - XKit Tools',
      },
      {
        name: 'twitter:description',
        content: 'Analyze your Twitter interaction data and generate personalized interaction circle visualizations.',
      },
      {
        name: 'twitter:image',
        content: 'https://xkit.rxliuli.com/og/interaction-circle.jpg',
      },
      {
        name: 'twitter:image:alt',
        content: 'Twitter Interaction Circle Generator - XKit Tools',
      },
      {
        name: 'twitter:creator',
        content: '@moeruri',
      },
      {
        name: 'twitter:site',
        content: '@moeruri',
      },
      // Additional meta tags
      {
        name: 'robots',
        content: 'index, follow',
      },
      {
        name: 'author',
        content: 'XKit Tools',
      },
    ],
  }),
  component: TwitterCircle,
})

function TwitterCircle() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [circleData, setCircleData] = useState<CircleData | null>(null)
  const [error, setError] = useState('')
  const { width } = useWindowSize()

  const analyzeUser = async () => {
    if (!username.trim()) {
      setError('Please enter a Twitter username')
      return
    }

    setIsLoading(true)
    setError('')
    setProgress(0)
    setProgressText('Initializing analysis...')

    try {
      const apiProxy = new TwitterAPIProxy()
      const calculator = new InteractionCalculator()

      // Fetch reply data
      setProgress(10)
      setProgressText('Fetching reply data...')

      let currentReplies = 0
      const replies = await apiProxy.getReplies(username, 500, (current, total) => {
        currentReplies = current
        setProgress(10 + (current / total) * 40) // 10-50%
        setProgressText(`Analyzing reply data... ${current}/${total} tweets`)
      })

      // Fetch like data
      setProgress(50)
      setProgressText('Fetching like data...')

      let currentLikes = 0
      const likes = await apiProxy.getLikes(username, 1000, (current, total) => {
        currentLikes = current
        setProgress(50 + (current / total) * 30) // 50-80%
        setProgressText(`Analyzing like data... ${current}/${total} likes`)
      })

      // Fetch target user information
      setProgress(80)
      setProgressText(`Fetching user information...`)

      const user = await apiProxy.getUserByScreenName(username)
      const currentUser = convertUser(user)

      // Calculate interaction weights
      setProgress(85)
      setProgressText(`Calculating interaction weights... Analyzed ${currentReplies} replies and ${currentLikes} likes`)

      const interactions = calculator.parseInteractions(replies, likes)
      const weights = calculator.calculateWeights(interactions)
      const data = calculator.generateCircleData(weights, currentUser, 48)

      setProgress(100)
      setProgressText(`Analysis complete! Generated interaction circle with ${data.totalUsers} users`)
      setCircleData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed, please try again'

      // If it's an extension-related error, provide detailed instructions and download link
      console.log('Analysis error:', errorMessage)
      if (errorMessage.includes('Extension Not Installed or Activated')) {
        setError(
          errorMessage +
            '\n\nPlease install the Twitter Web API extension from the Chrome Web Store:\nhttps://chromewebstore.google.com/detail/pnbhkojogdglhidcgnfljnomjdckkfjh\n\nAfter installation, make sure you are logged into your Twitter account.',
        )
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key submission
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      analyzeUser()
    }
  }

  // Convert image URL to base64
  const convertImageToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.warn('Unable to convert image:', url, error)
      return url // Return original URL if conversion fails
    }
  }

  // Export PNG functionality
  const exportToPNG = async () => {
    const svgElement = document.querySelector('.twitter-circle-container svg') as SVGSVGElement
    if (!svgElement) {
      alert('Visualization chart not found, please try again')
      return
    }

    try {
      // Clone SVG element
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

      // Get all image elements and convert to base64
      const imageElements = clonedSvg.querySelectorAll('image')
      const imagePromises = Array.from(imageElements).map(async (img) => {
        const href = img.getAttribute('href') || img.getAttribute('xlink:href')
        if (href && href.startsWith('http')) {
          try {
            const base64 = await convertImageToBase64(href)
            img.setAttribute('href', base64)
          } catch (error) {
            console.warn('Skip image conversion:', href, error)
          }
        }
      })

      await Promise.all(imagePromises)

      // Get SVG dimensions
      const svgRect = svgElement.getBoundingClientRect()
      const svgData = new XMLSerializer().serializeToString(clonedSvg)

      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Unable to create canvas context')
      }

      // Set canvas dimensions
      const scale = 2
      canvas.width = svgRect.width * scale
      canvas.height = svgRect.height * scale
      ctx.scale(scale, scale)

      // Set background color
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, svgRect.width, svgRect.height)

      // Create image and draw
      const img = new Image()
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height)
        URL.revokeObjectURL(url)

        // Download image
        const link = document.createElement('a')
        link.download = `twitter-circle-${username}-${new Date().getTime()}.png`
        link.href = canvas.toDataURL('image/png', 0.95)
        link.click()
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        alert('Image generation failed, please try again')
      }

      img.src = url
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed, please try again')
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 min-h-screen">
      <div className="max-w-6xl mx-auto pt-4 sm:pt-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            Twitter Interaction Circle Generator
          </h1>
          <p className="text-gray-600 text-sm sm:text-base px-4">
            Analyze your Twitter interaction data and generate personalized interaction circle visualizations
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
            <div className="flex-1 min-w-0">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Twitter Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter username (without @)"
                  className="w-full pl-8 pr-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              onClick={analyzeUser}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
            >
              {isLoading ? 'Analyzing...' : 'Start Analysis'}
            </button>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{progressText}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          <AnalysisError error={error} />
        </div>

        {/* Visualization Section */}
        {circleData && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">@{username}'s Interaction Circle</h2>
              <button
                onClick={exportToPNG}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Export PNG
              </button>
            </div>

            <div className="flex justify-center mb-4 sm:mb-6 twitter-circle-container overflow-x-auto">
              <D3TwitterCircle
                key={`${width}`}
                data={circleData}
                width={Math.min(width - 64, 600)}
                height={Math.min(width - 64, 600)}
              />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{circleData.totalUsers}</div>
                <div className="text-xs sm:text-sm text-gray-600">Interactive Users</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{circleData.totalReplies}</div>
                <div className="text-xs sm:text-sm text-gray-600">Replies</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{circleData.totalLikes}</div>
                <div className="text-xs sm:text-sm text-gray-600">Likes</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">{circleData.analysisDate}</div>
                <div className="text-xs sm:text-sm text-gray-600">Analysis Date</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
