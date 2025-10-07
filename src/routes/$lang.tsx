import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import i18n, { initI18nWithLanguage, languages, type AvailableLanguages } from '../i18n'

export const Route = createFileRoute('/$lang')({
  // Validate the language parameter and set i18n language on server-side
  beforeLoad: ({ params }) => {
    const lang = params.lang as string

    if (lang.startsWith('.') || !languages.includes(lang as AvailableLanguages)) {
      throw redirect({
        to: '/$lang',
        params: { lang: i18n.language },
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
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
  }, [lang, i18n])

  return <Outlet />
}
