import { createFileRoute, redirect } from '@tanstack/react-router'

// This route handles the root path and redirects to the locale-prefixed version
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // Detect browser language - this will only run on client-side navigation
    let detectedLang = 'en'

    if (typeof window !== 'undefined') {
      const browserLang = navigator.language
      const supportedLangs = ['en', 'zh-CN', 'zh-TW', 'ja-JP']

      if (supportedLangs.includes(browserLang)) {
        detectedLang = browserLang
      } else {
        const langCode = browserLang.split('-')[0]
        const match = supportedLangs.find((lang) => lang.startsWith(langCode))
        detectedLang = match || 'en'
      }
    }

    // Redirect to the locale-specific home page
    throw redirect({
      to: '/$lang',
      params: { lang: detectedLang },
      replace: true,
    })
  },
})
