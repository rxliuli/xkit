import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import D3TwitterCircle from '../../components/D3TwitterCircle'
import { TwitterAPIError, TwitterAPIProxy } from '../../lib/twitter-api-proxy'
import { InteractionCalculator, CircleData } from '../../lib/interaction-calculator'
import { convertUser } from '../../lib/twitter-adapter'
import { useWindowSize } from '@/lib/hooks/useWindowSize'
import { AnalysisError } from '@/components/AnalysisError'
import { LoadingProgressBar } from '@/components/LoadingProgressBar'
import { InputSection } from '@/components/InputSection'

export const Route = createFileRoute('/$lang/interaction-circle')({
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
        content: '1280',
      },
      {
        property: 'og:image:height',
        content: '800',
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
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [circleData, setCircleData] = useState<CircleData | null>(null)
  const [error, setError] = useState('')
  const { width } = useWindowSize()

  useEffect(() => {
    if (username) {
      analyzeUser()
    }
  }, [username])

  const onSubmit = async (username: string) => setUsername(username)

  const analyzeUser = async () => {
    if (!username.trim()) {
      setError(t('interactionCircle.errors.enterUsername'))
      return
    }

    setIsLoading(true)
    setError('')
    setProgress(0)
    setProgressText(t('interactionCircle.progress.initialising'))

    try {
      const apiProxy = new TwitterAPIProxy()
      const calculator = new InteractionCalculator()

      // Fetch reply data
      setProgress(10)
      setProgressText(t('interactionCircle.progress.fetchingReplies'))

      let currentReplies = 0
      const replies = await apiProxy.getReplies(username, 500, (current, total) => {
        currentReplies = current
        setProgress(10 + (current / total) * 40) // 10-50%
        setProgressText(t('interactionCircle.progress.analysingReplies', { current, total }))
      })

      // Fetch like data
      setProgress(50)
      setProgressText(t('interactionCircle.progress.fetchingLikes'))

      let currentLikes = 0
      const likes = await apiProxy.getLikes(username, 1000, (current, total) => {
        currentLikes = current
        setProgress(50 + (current / total) * 30) // 50-80%
        setProgressText(t('interactionCircle.progress.analysingLikes', { current, total }))
      })

      // Fetch target user information
      setProgress(80)
      setProgressText(t('interactionCircle.progress.fetchingUser'))

      const user = await apiProxy.getUserByScreenName(username)
      const currentUser = convertUser(user)

      // Calculate interaction weights
      setProgress(85)
      setProgressText(t('interactionCircle.progress.calculating', { replies: currentReplies, likes: currentLikes }))

      const interactions = calculator.parseInteractions(replies, likes)
      const weights = calculator.calculateWeights(interactions)
      const data = calculator.generateCircleData(weights, currentUser, 48)

      setProgress(100)
      setProgressText(t('interactionCircle.progress.complete', { users: data.totalUsers }))
      setCircleData(data)
    } catch (err) {
      const errorMessage =
        err instanceof TwitterAPIError
          ? t(`api.errors.${err.code}`, err.params)
          : err instanceof Error
            ? err.message
            : t('interactionCircle.errors.analysisFailed')

      // If it's an extension-related error, provide detailed instructions and download link
      if (err instanceof TwitterAPIError && err.code === 'EXTENSION_NOT_INSTALLED') {
        const extensionInstallInstructions = t('api.errors.extensionNotInstalledWithInstructions', {
          url: 'https://chromewebstore.google.com/detail/pnbhkojogdglhidcgnfljnomjdckkfjh',
        })
        console.log('Extension install instructions:', extensionInstallInstructions)
        setError(extensionInstallInstructions)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
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

  // Note: Share to Twitter functionality removed as it's currently not being used in the UI
  // Can be restored from git history if needed in the future

  // Export PNG functionality
  const exportToPNG = async () => {
    const svgElement = document.querySelector('.twitter-circle-container svg') as SVGSVGElement
    if (!svgElement) {
      alert(t('interactionCircle.errors.chartNotFound'))
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
        throw new Error(t('api.errors.canvasContextFailed'))
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
        alert(t('interactionCircle.errors.imageFailed'))
      }

      img.src = url
    } catch (error) {
      console.error('Export failed:', error)
      alert(t('interactionCircle.errors.exportFailed'))
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 min-h-screen">
      <div className="max-w-6xl mx-auto pt-4 sm:pt-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            {t('interactionCircle.title')}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base px-4">{t('interactionCircle.subtitle')}</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <InputSection
            isLoading={isLoading}
            onSubmit={onSubmit}
            classNames={{
              input: 'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              button: 'bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500',
            }}
          />

          {/* Progress Bar */}
          <LoadingProgressBar isLoading={isLoading} progressText={progressText} progress={progress} />

          {/* Error Message */}
          <AnalysisError error={error} />
        </div>

        {/* Visualization Section */}
        {circleData && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {t('interactionCircle.visualisation.title', { username })}
              </h2>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  {t('interactionCircle.visualisation.exportButton')}
                </button>
              </div>
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
                <div className="text-xs sm:text-sm text-gray-600">
                  {t('interactionCircle.visualisation.stats.users')}
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{circleData.totalReplies}</div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {t('interactionCircle.visualisation.stats.replies')}
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{circleData.totalLikes}</div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {t('interactionCircle.visualisation.stats.likes')}
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-orange-600">{circleData.analysisDate}</div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {t('interactionCircle.visualisation.stats.date')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
