import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { languages, type AvailableLanguages, initI18nWithLanguage } from '../i18n'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/$lang')({
  // Validate the language parameter and set i18n language on server-side
  beforeLoad: ({ params }) => {
    const lang = params.lang as string

    // If the language is not valid, redirect to English
    if (!languages.includes(lang as AvailableLanguages)) {
      throw redirect({
        to: '/$lang',
        params: { lang: 'en' },
        replace: true,
      })
    }

    // Set the language for i18n (works on both server and client)
    initI18nWithLanguage(lang as AvailableLanguages)
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { lang } = Route.useParams()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
  }, [lang, i18n])

  return <Outlet />
}
