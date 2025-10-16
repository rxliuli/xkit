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
import { svgToPNGBase64, exportSVGToPNG } from '@/lib/svg-export'

export const Route = createFileRoute('/{-$lang}/interaction-circle')({
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

  // Share to Twitter functionality
  const shareToTwitter = async () => {
    if (!circleData) {
      alert('No data to share')
      return
    }
    try {
      const text = t('interactionCircle.share.text')
      const imageBase64 = await svgToPNGBase64('.twitter-circle-container svg')
      window.__TWITTER_WEB_API__.shareToTwitter({ text, image: imageBase64 })
    } catch (error) {
      console.error('Share failed:', error)
      alert(t('interactionCircle.errors.shareFailed'))
    }
  }

  // Export PNG functionality
  const exportToPNG = async () => {
    try {
      const filename = `twitter-circle-${username}-${new Date().getTime()}.png`
      await exportSVGToPNG('.twitter-circle-container svg', filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert(t('interactionCircle.errors.exportFailed'))
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-600/10 dark:to-indigo-600/10 p-4 sm:p-6 min-h-screen">
      <div className="max-w-6xl mx-auto pt-4 sm:pt-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-2">
            {t('interactionCircle.title')}
          </h1>
          <p className="text-text-secondary text-sm sm:text-base px-4">{t('interactionCircle.subtitle')}</p>
        </div>

        {/* Input Section */}
        <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
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
          <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
                {t('interactionCircle.visualisation.title', { username })}
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={shareToTwitter}
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  {t('interactionCircle.visualisation.shareButton')}
                </button>
                <button
                  onClick={exportToPNG}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm sm:text-base"
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
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {circleData.totalUsers}
                </div>
                <div className="text-xs sm:text-sm text-text-secondary">
                  {t('interactionCircle.visualisation.stats.users')}
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {circleData.totalReplies}
                </div>
                <div className="text-xs sm:text-sm text-text-secondary">
                  {t('interactionCircle.visualisation.stats.replies')}
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {circleData.totalLikes}
                </div>
                <div className="text-xs sm:text-sm text-text-secondary">
                  {t('interactionCircle.visualisation.stats.likes')}
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {circleData.analysisDate}
                </div>
                <div className="text-xs sm:text-sm text-text-secondary">
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
