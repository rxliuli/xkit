import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { initI18nWithLanguage, languages, type AvailableLanguages } from '../i18n'

export const Route = createFileRoute('/{-$lang}')({
  // Validate the language parameter and set i18n language on server-side
  beforeLoad: ({ params }) => {
    // Default to en-US if no lang parameter
    const defaultLang: AvailableLanguages = 'en-US'
    const lang = params.lang || defaultLang

    // Validate language
    if (lang.startsWith('.') || !languages.includes(lang as AvailableLanguages)) {
      // If invalid, redirect to default language (root path)
      throw redirect({
        to: '/',
        replace: true,
      })
    }

    initI18nWithLanguage(lang as AvailableLanguages)
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { lang } = Route.useParams()
  const { i18n } = useTranslation()

  useEffect(() => {
    // Default to en-US if no lang parameter
    const targetLang = lang || 'en-US'
    if (i18n.language !== targetLang) {
      i18n.changeLanguage(targetLang)
    }
  }, [lang, i18n])

  return <Outlet />
}
