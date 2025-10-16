import { ExternalLinkIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-border-subtle mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Copyright */}
          <div className="text-sm text-text-secondary">{t('footer.copyright', { year: currentYear })}</div>

          {/* Right side - Links */}
          <div className="flex items-center space-x-6">
            <a
              href="https://rxliuli.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1 group"
            >
              <span>{t('footer.visitSite')}</span>
              <ExternalLinkIcon className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <a
              href="https://github.com/rxliuli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1 group"
            >
              <span>{t('footer.github')}</span>
              <ExternalLinkIcon className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Bottom divider and additional info */}
        <div className="mt-6 pt-6 border-t border-muted">
          <div className="text-center">
            <p className="text-xs text-text-secondary">{t('footer.tagline')}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
