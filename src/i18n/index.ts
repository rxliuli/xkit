import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from './locales/en-us/translation.json'
import zhCN from './locales/zh-cn/translation.json'
import zhTW from './locales/zh-tw/translation.json'
import jaJP from './locales/ja-jp/translation.json'

export const availableLanguages = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'ja-JP': jaJP,
} as const

export type AvailableLanguages = keyof typeof availableLanguages
export const languages: AvailableLanguages[] = ['en-US', 'zh-CN', 'zh-TW', 'ja-JP']

/**
 * Detects the appropriate language based on the current path or browser settings.
 *
 * @param serverPath - Optional path from server-side request (for SSR)
 * @returns The detected language code
 */
const detectBrowserLanguage = (serverPath?: string): AvailableLanguages => {
  // Server-side: extract language from the provided path
  if (typeof window === 'undefined') {
    if (serverPath) {
      const pathParts = serverPath.split('/')
      const urlLang = pathParts[1] // First segment after /

      if (languages.includes(urlLang as AvailableLanguages)) {
        return urlLang as AvailableLanguages
      }
    }

    return 'en-US'
  } else {
    const pathParts = window.location.pathname.split('/')
    const urlLang = pathParts[1] // First segment after /

    if (languages.includes(urlLang as AvailableLanguages)) {
      return urlLang as AvailableLanguages
    }

    // Fallback to browser language
    const browserLang = navigator.language

    if (languages.includes(browserLang as AvailableLanguages)) {
      return browserLang as AvailableLanguages
    }

    const langCode = browserLang.split('-')[0]
    const match = languages.find((lang) => lang.startsWith(langCode))

    return match || 'en-US'
  }
}

/**
 * Initializes i18n with a specific language (useful for SSR).
 *
 * @param language - The language to initialize with
 */
export const initI18nWithLanguage = (language: AvailableLanguages) => {
  if (i18n.language !== language) {
    i18n.changeLanguage(language)
  }
}

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    'ja-JP': { translation: jaJP },
  },
  lng: detectBrowserLanguage(),
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
})

export default i18n
