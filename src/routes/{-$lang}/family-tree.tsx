import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import D3FamilyTree from '../../components/D3FamilyTree'
import { convertUser } from '../../lib/twitter-adapter'
import { FamilyTreeCalculator, FamilyTreeData } from '../../lib/family-tree-calculator'
import { InteractionCalculator } from '../../lib/interaction-calculator'
import { TwitterAPIError, TwitterAPIProxy } from '../../lib/twitter-api-proxy'
import { useWindowSize } from '@/lib/hooks/useWindowSize'
import { AnalysisError } from '@/components/AnalysisError'
import { LoadingProgressBar } from '@/components/LoadingProgressBar'
import { InputSection } from '@/components/InputSection'
import { FaTwitter } from 'react-icons/fa'
import { svgToPNGBase64, exportSVGToPNG } from '@/lib/svg-export'

export const Route = createFileRoute('/{-$lang}/family-tree')({
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
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [treeData, setTreeData] = useState<FamilyTreeData | null>()
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
      setError(t('familyTree.errors.enterUsername'))
      return
    }

    setIsLoading(true)
    setError('')
    setProgress(0)
    setProgressText(t('familyTree.progress.initialising'))

    try {
      const apiProxy = new TwitterAPIProxy()
      const calculator = new FamilyTreeCalculator()
      const interactionCalc = new InteractionCalculator()

      // Get target user information
      setProgress(5)
      setProgressText(t('familyTree.progress.fetchingUser'))
      const rawTargetUser = await apiProxy.getUserByScreenName(username)
      const targetUser = convertUser(rawTargetUser)

      // Fetch interaction data (replies and likes)
      setProgress(10)
      setProgressText(t('familyTree.progress.fetchingInteractions'))

      const replies = await apiProxy.getReplies(username, 200, (current, total) => {
        setProgress(10 + (current / total) * 20) // 10-30%
        setProgressText(t('familyTree.progress.analysingReplies', { current, total }))
      })

      const likes = await apiProxy.getLikes(username, 300, (current, total) => {
        setProgress(30 + (current / total) * 20) // 30-50%
        setProgressText(t('familyTree.progress.analysingLikes', { current, total }))
      })

      // Fetch following data
      setProgress(50)
      setProgressText(t('familyTree.progress.fetchingFollowing'))

      const following = await apiProxy.getFollowing(targetUser.id, 100, (current, total) => {
        setProgress(50 + (current / total) * 15) // 50-65%
        setProgressText(t('familyTree.progress.analysingFollowing', { current, total }))
      })

      // Fetch followers data
      setProgress(65)
      setProgressText(t('familyTree.progress.fetchingFollowers'))

      const followers = await apiProxy.getFollowers(targetUser.id, 100, (current, total) => {
        setProgress(65 + (current / total) * 15) // 65-80%
        setProgressText(t('familyTree.progress.analysingFollowers', { current, total }))
      })

      // Build family tree relationships with interaction weights
      setProgress(80)
      setProgressText(t('familyTree.progress.buildingTree'))

      const relationships = calculator.buildRelationships(following, followers)

      // Calculate interaction weights
      const interactions = interactionCalc.parseInteractions(replies, likes)
      const weights = interactionCalc.calculateWeights(interactions)

      setProgress(90)
      setProgressText(t('familyTree.progress.selectingUsers'))

      const data = calculator.generateTreeData(relationships, targetUser, weights)

      setProgress(100)
      setProgressText(t('familyTree.progress.complete', { nodes: data.totalNodes }))
      console.log('Family Tree Data:', data)
      setTreeData(data)
    } catch (err) {
      const errorMessage =
        err instanceof TwitterAPIError
          ? t(`api.errors.${err.code}`, err.params)
          : err instanceof Error
            ? err.message
            : t('familyTree.errors.analysisFailed')

      console.log('Analysis error:', errorMessage)
      if (err instanceof TwitterAPIError && err.code === 'EXTENSION_NOT_INSTALLED') {
        const extensionInstallInstructions = t('api.errors.extensionNotInstalledWithInstructions', {
          url: 'https://chromewebstore.google.com/detail/pnbhkojogdglhidcgnfljnomjdckkfjh',
        })
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
    if (!treeData) {
      alert('No data to share')
      return
    }
    try {
      const text = t('familyTree.share.text')
      const imageBase64 = await svgToPNGBase64('.family-tree-container svg')
      window.__TWITTER_WEB_API__.shareToTwitter({ text, image: imageBase64 })
    } catch (error) {
      console.error('Share failed:', error)
      alert(t('familyTree.errors.shareFailed'))
    }
  }

  // Export PNG functionality
  const exportToPNG = async () => {
    try {
      const filename = `twitter-family-tree-${username}-${new Date().getTime()}.png`
      await exportSVGToPNG('.family-tree-container svg', filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert(t('familyTree.errors.exportFailed'))
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 sm:p-6 min-h-screen">
      <div className="max-w-6xl mx-auto pt-4 sm:pt-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{t('familyTree.title')}</h1>
          <p className="text-gray-600 text-sm sm:text-base px-4">{t('familyTree.subtitle')}</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <InputSection
            isLoading={isLoading}
            onSubmit={onSubmit}
            classNames={{
              input: 'focus:ring-2 focus:ring-purple-500 focus:border-transparent',
              button: 'bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500',
            }}
          />

          {/* Progress Bar */}
          <LoadingProgressBar isLoading={isLoading} progressText={progressText} progress={progress} />

          {/* Error Message */}
          <AnalysisError error={error} />
        </div>

        {/* Visualization Section */}
        {treeData && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {t('familyTree.visualisation.title', { username })}
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={shareToTwitter}
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <FaTwitter />
                  {t('familyTree.visualisation.shareButton')}
                </button>
                <button
                  onClick={exportToPNG}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                  {t('familyTree.visualisation.exportButton')}
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
                <div className="text-xs sm:text-sm text-gray-600">{t('familyTree.visualisation.stats.totalUsers')}</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{treeData.followingCount}</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('familyTree.visualisation.stats.following')}</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{treeData.followersCount}</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('familyTree.visualisation.stats.followers')}</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-pink-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-pink-600">{treeData.mutualCount}</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('familyTree.visualisation.stats.mutual')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
