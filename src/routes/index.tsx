import i18n from '@/i18n'
import { createFileRoute, redirect } from '@tanstack/react-router'

// This route handles the root path and redirects to the locale-prefixed version
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/$lang',
      params: { lang: i18n.language },
      replace: true,
    })
  },
})
