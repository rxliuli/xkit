import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import D3FamilyTree from '../components/D3FamilyTree'
import { TwitterAPIProxy } from '../lib/twitter-api-proxy'
import { convertUser } from '../lib/twitter-adapter'
import { FamilyTreeCalculator, FamilyTreeData } from '../lib/family-tree-calculator'
import { InteractionCalculator } from '../lib/interaction-calculator'
import { useWindowSize } from '@/lib/hooks/useWindowSize'
import { AnalysisError } from '@/components/AnalysisError'

export const Route = createFileRoute('/family-tree')({
  head: () => ({
    meta: [
      {
        title: 'Twitter Family Tree Generator - XKit Tools',
      },
      {
        name: 'description',
        content:
          'Generate a family tree visualization based on Twitter following relationships. Discover your Twitter network and relationship hierarchy.',
      },
      {
        name: 'keywords',
        content:
          'twitter, family tree, following network, social media analysis, twitter analytics, relationship visualization, twitter tools',
      },
      // Open Graph tags
      {
        property: 'og:title',
        content: 'Twitter Family Tree Generator - XKit Tools',
      },
      {
        property: 'og:description',
        content:
          'Generate a family tree visualization based on Twitter following relationships. Discover your Twitter network and relationship hierarchy.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: 'https://xkit.rxliuli.com/family-tree',
      },
      {
        property: 'og:image',
        content: 'https://xkit.rxliuli.com/og/family-tree.jpg',
      },
      {
        property: 'og:image:width',
        content: '1280',
      },
      {
        property: 'og:image:height',
        content: '800',
      },
      {
        property: 'og:image:alt',
        content: 'Twitter Family Tree Generator - XKit Tools',
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
        content: 'Twitter Family Tree Generator - XKit Tools',
      },
      {
        name: 'twitter:description',
        content: 'Generate a family tree visualization based on Twitter following relationships.',
      },
      {
        name: 'twitter:image',
        content: 'https://xkit.rxliuli.com/og/family-tree.jpg',
      },
      {
        name: 'twitter:image:alt',
        content: 'Twitter Family Tree Generator - XKit Tools',
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
  component: FamilyTree,
})

function FamilyTree() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [treeData, setTreeData] = useState<FamilyTreeData | null>()
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
      const calculator = new FamilyTreeCalculator()
      const interactionCalc = new InteractionCalculator()

      // Get target user information
      setProgress(5)
      setProgressText('Fetching user information...')
      const rawTargetUser = await apiProxy.getUserByScreenName(username)
      const targetUser = convertUser(rawTargetUser)

      // Fetch interaction data (replies and likes)
      setProgress(10)
      setProgressText('Fetching interaction data...')

      const replies = await apiProxy.getReplies(username, 200, (current, total) => {
        setProgress(10 + (current / total) * 20) // 10-30%
        setProgressText(`Analyzing replies... ${current}/${total}`)
      })

      const likes = await apiProxy.getLikes(username, 300, (current, total) => {
        setProgress(30 + (current / total) * 20) // 30-50%
        setProgressText(`Analyzing likes... ${current}/${total}`)
      })

      // Fetch following data
      setProgress(50)
      setProgressText('Fetching following data...')

      const following = await apiProxy.getFollowing(targetUser.id, 100, (current, total) => {
        setProgress(50 + (current / total) * 15) // 50-65%
        setProgressText(`Analyzing following... ${current}/${total} users`)
      })

      // Fetch followers data
      setProgress(65)
      setProgressText('Fetching followers data...')

      const followers = await apiProxy.getFollowers(targetUser.id, 100, (current, total) => {
        setProgress(65 + (current / total) * 15) // 65-80%
        setProgressText(`Analyzing followers... ${current}/${total} users`)
      })

      // Build family tree relationships with interaction weights
      setProgress(80)
      setProgressText('Building family tree with interaction data...')

      const relationships = calculator.buildRelationships(following, followers)

      // Calculate interaction weights
      const interactions = interactionCalc.parseInteractions(replies, likes)
      const weights = interactionCalc.calculateWeights(interactions)

      setProgress(90)
      setProgressText('Selecting most interacted users...')

      const data = calculator.generateTreeData(relationships, targetUser, weights)

      setProgress(100)
      setProgressText(`Analysis complete! Generated family tree with ${data.totalNodes} users`)
      console.log('Family Tree Data:', data)
      setTreeData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed, please try again'

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

  // Generate PNG as base64
  const generatePNGBase64 = async (): Promise<string> => {
    const svgElement = document.querySelector('.family-tree-container svg') as SVGSVGElement
    if (!svgElement) {
      throw new Error('Visualization chart not found')
    }

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
    return new Promise((resolve, reject) => {
      const img = new Image()
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height)
        URL.revokeObjectURL(url)

        // Get base64 data
        const base64 = canvas.toDataURL('image/png', 0.95)
        resolve(base64)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Image generation failed'))
      }

      img.src = url
    })
  }

  // Share to Twitter functionality
  const shareToTwitter = async () => {
    try {
      const text = `Check out my Twitter Family Tree! 🌳\n\nVisualized my network with ${treeData?.totalNodes} users, including ${treeData?.followingCount} following and ${treeData?.followersCount} followers.\n\nGenerate your own at:\nhttps://xkit.rxliuli.com/family-tree/`

      // Generate image as base64
      const imageBase64 = await generatePNGBase64()

      if (window.__TWITTER_WEB_API__?.shareToTwitter) {
        window.__TWITTER_WEB_API__.shareToTwitter({ text, image: imageBase64 })
      } else {
        const encodedText = encodeURIComponent(text)
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank')
      }
    } catch (error) {
      console.error('Share failed:', error)
      alert('Failed to generate image for sharing, please try again')
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
      return url
    }
  }

  // Export PNG functionality
  const exportToPNG = async () => {
    const svgElement = document.querySelector('.family-tree-container svg') as SVGSVGElement
    if (!svgElement) {
      alert('Visualization chart not found, please try again')
      return
    }

    try {
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

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

      const svgRect = svgElement.getBoundingClientRect()
      const svgData = new XMLSerializer().serializeToString(clonedSvg)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Unable to create canvas context')
      }

      const scale = 2
      canvas.width = svgRect.width * scale
      canvas.height = svgRect.height * scale
      ctx.scale(scale, scale)

      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, svgRect.width, svgRect.height)

      const img = new Image()
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height)
        URL.revokeObjectURL(url)

        const link = document.createElement('a')
        link.download = `twitter-family-tree-${username}-${new Date().getTime()}.png`
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
    <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 sm:p-6 min-h-screen">
      <div className="max-w-6xl mx-auto pt-4 sm:pt-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            Twitter Family Tree Generator
          </h1>
          <p className="text-gray-600 text-sm sm:text-base px-4">
            Visualize your Twitter network as a family tree based on following relationships
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
                  className="w-full pl-8 pr-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              onClick={analyzeUser}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
            >
              {isLoading ? 'Analyzing...' : 'Generate Tree'}
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
                  className="bg-purple-600 h-3 rounded-full transition-all duration-300 relative overflow-hidden"
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
        {treeData && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">@{username}'s Family Tree</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* <button
                  onClick={shareToTwitter}
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share
                </button> */}
                <button
                  onClick={exportToPNG}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  Export PNG
                </button>
              </div>
            </div>

            <div className="flex justify-center mb-4 sm:mb-6 family-tree-container overflow-x-auto">
              <D3FamilyTree key={`${width}`} data={treeData} width={Math.min(width - 64, 600)} height={800} />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{treeData.totalNodes}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{treeData.followingCount}</div>
                <div className="text-xs sm:text-sm text-gray-600">Following</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{treeData.followersCount}</div>
                <div className="text-xs sm:text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-pink-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-pink-600">{treeData.mutualCount}</div>
                <div className="text-xs sm:text-sm text-gray-600">Mutual Follows</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
