import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { MenuIcon, Languages, Moon, Sun, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { languages, type AvailableLanguages } from '../i18n'
import { useTheme } from '../lib/hooks/useTheme'

export function Header() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { lang?: string }
  const navigate = useNavigate()
  const { themeMode, resolvedTheme, toggleTheme } = useTheme()

  // Get current language: undefined means en-US (default)
  const currentLang = (params.lang || 'en-US') as AvailableLanguages

  // Helper: Get language prefix for URL (en-US uses root, others use /{lang})
  const getLangPrefix = (lng: AvailableLanguages) => {
    return lng === 'en-US' ? '' : `/${lng}`
  }

  // Helper: Get current page path without language prefix
  const getCurrentPage = () => {
    if (typeof window === 'undefined') return ''
    const path = window.location.pathname
    // Remove language prefix if present
    const withoutLang = languages.reduce((p, lang) => p.replace(`/${lang}`, ''), path)
    return withoutLang || '/'
  }

  // Handler to change language
  const changeLanguage = (lng: AvailableLanguages) => {
    const currentPage = getCurrentPage()
    const newPath = getLangPrefix(lng) + currentPage
    navigate({ to: newPath, replace: false })
  }

  return (
    <header className="bg-header border-b border-border-subtle shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link
            to={'/{-$lang}'}
            params={currentLang === 'en-US' ? {} : { lang: currentLang }}
            className="flex items-center space-x-3"
          >
            <img src={'/logo192.png'} alt="XKit Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-text-primary">{t('header.brand')}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            <Link
              to={'/{-$lang}'}
              params={currentLang === 'en-US' ? {} : { lang: currentLang }}
              className="text-nav hover:text-nav-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
              activeProps={{
                className: 'text-nav-active hover:text-nav-active-hover!',
              }}
            >
              {t('header.home')}
            </Link>
            <Link
              to={'/{-$lang}/interaction-circle'}
              params={currentLang === 'en-US' ? {} : { lang: currentLang }}
              className="text-nav hover:text-nav-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
              activeProps={{
                className: 'text-nav-active hover:text-nav-active-hover!',
              }}
            >
              {t('header.twitterCircle')}
            </Link>

            <Link
              to={'/{-$lang}/family-tree'}
              params={currentLang === 'en-US' ? {} : { lang: currentLang }}
              className="text-nav hover:text-nav-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
              activeProps={{
                className: 'text-nav-active hover:text-nav-active-hover!',
              }}
            >
              {t('header.familyTree')}
            </Link>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="text-nav hover:text-nav-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
              aria-label={t('header.theme.label', { mode: t(`header.theme.${themeMode}`) })}
              title={
                themeMode === 'auto'
                  ? t('header.theme.titleAuto', {
                      mode: t('header.theme.auto'),
                      resolved: t(`header.theme.${resolvedTheme}`),
                    })
                  : t('header.theme.title', { mode: t(`header.theme.${themeMode}`) })
              }
            >
              {themeMode === 'auto' ? (
                <Monitor className="h-5 w-5" />
              ) : themeMode === 'light' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Language Switcher */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-nav hover:text-nav-hover px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <Languages className="h-4 w-4" />
                <span className="uppercase">{currentLang.split('-')[0]}</span>
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-dropdown rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => changeLanguage(lang)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-hover ${
                        currentLang === lang ? 'text-nav-active bg-hover font-medium' : 'text-nav bg-transparent'
                      }`}
                    >
                      {lang === 'en-US' && 'English'}
                      {lang === 'zh-CN' && '简体中文'}
                      {lang === 'zh-TW' && '繁體中文'}
                      {lang === 'zh-HK' && '廣東話'}
                      {lang === 'ja-JP' && '日本語'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="text-nav hover:text-nav-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2"
                >
                  <span className="sr-only">{t('header.menu')}</span>
                  <MenuIcon className="h-6 w-6" />
                </button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <div className="flex items-center space-x-3 mb-6">
                    <img src={'/logo192.png'} alt="XKit Logo" className="h-8 w-8" />
                    <SheetTitle className="text-xl font-bold text-text-primary">{t('header.brand')}</SheetTitle>
                  </div>
                </SheetHeader>

                <nav className="flex flex-col space-y-4">
                  <SheetClose asChild>
                    <Link
                      to={'/{-$lang}'}
                      params={currentLang === 'en-US' ? {} : { lang: currentLang }}
                      className="text-nav hover:text-nav-hover hover:bg-hover border border-border-subtle px-4 py-3 rounded-md text-base font-medium transition-colors"
                      activeProps={{
                        className: 'text-nav-active hover:text-nav-active-hover bg-hover',
                      }}
                    >
                      🏠 {t('header.home')}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to={'/{-$lang}/interaction-circle'}
                      params={currentLang === 'en-US' ? {} : { lang: currentLang }}
                      className="text-nav hover:text-nav-hover hover:bg-hover border border-border-subtle px-4 py-3 rounded-md text-base font-medium transition-colors"
                      activeProps={{
                        className: 'text-nav-active hover:text-nav-active-hover bg-hover',
                      }}
                    >
                      🐦 {t('header.twitterCircle')}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to={'/{-$lang}/family-tree'}
                      params={currentLang === 'en-US' ? {} : { lang: currentLang }}
                      className="text-nav hover:text-nav-hover hover:bg-hover border border-border-subtle px-4 py-3 rounded-md text-base font-medium transition-colors"
                      activeProps={{
                        className: 'text-nav-active hover:text-nav-active-hover bg-hover',
                      }}
                    >
                      🌳 {t('header.familyTree')}
                    </Link>
                  </SheetClose>

                  {/* Mobile Theme Switcher */}
                  <div className="pt-4 border-t border-border-subtle">
                    <p className="px-4 py-2 text-sm font-semibold text-text-secondary">{t('header.theme.section')}</p>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-nav hover:bg-hover rounded-md"
                    >
                      <span>
                        {themeMode === 'auto'
                          ? `💻 ${t('header.theme.auto')} (${t(`header.theme.${resolvedTheme}`)})`
                          : themeMode === 'light'
                            ? `☀️ ${t('header.theme.light')}`
                            : `🌙 ${t('header.theme.dark')}`}
                      </span>
                      {themeMode === 'auto' ? (
                        <Monitor className="h-4 w-4" />
                      ) : themeMode === 'light' ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Mobile Language Switcher */}
                  <div className="pt-4 border-t border-border-subtle">
                    <p className="px-4 py-2 text-sm font-semibold text-text-secondary">Language</p>
                    <div className="space-y-2">
                      {languages.map((lang) => (
                        <SheetClose key={lang} asChild>
                          <button
                            onClick={() => changeLanguage(lang)}
                            className={`block w-full text-left px-4 py-2 text-sm rounded-md hover:bg-hover ${
                              currentLang === lang ? 'text-nav-active bg-hover font-medium' : 'text-nav bg-transparent'
                            }`}
                          >
                            {lang === 'en-US' && '🇺🇸 English'}
                            {lang === 'zh-CN' && '🇨🇳 简体中文'}
                            {lang === 'zh-TW' && '🇹🇼 繁體中文'}
                            {lang === 'zh-HK' && '🇭🇰 廣東話'}
                            {lang === 'ja-JP' && '🇯🇵 日本語'}
                          </button>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
