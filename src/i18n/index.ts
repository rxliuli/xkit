import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/translation.json'
import zhCN from './locales/zh-cn/translation.json'
import zhTW from './locales/zh-tw/translation.json'
import jaJP from './locales/ja-jp/translation.json'

export const availableLanguages = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'ja-JP': jaJP,
} as const

export type AvailableLanguages = keyof typeof availableLanguages
export const languages: AvailableLanguages[] = ['en', 'zh-CN', 'zh-TW', 'ja-JP']

const detectBrowserLanguage = (): AvailableLanguages => {
  if (typeof window === 'undefined') return 'en'

  const browserLang = navigator.language

  if (languages.includes(browserLang as AvailableLanguages)) {
    return browserLang as AvailableLanguages
  }

  const langCode = browserLang.split('-')[0]
  const match = languages.find((lang) => lang.startsWith(langCode))

  return match || 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    'ja-JP': { translation: jaJP },
  },
  lng: typeof window !== 'undefined' ? detectBrowserLanguage() : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
