import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { MenuIcon, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { languages, type AvailableLanguages } from '../i18n'

export function Header() {
  const { t, i18n } = useTranslation()
  const params = useParams({ strict: false }) as { lang?: string }
  const navigate = useNavigate()

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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link
            to={currentLang === 'en-US' ? '/' : '/{-$lang}'}
            params={currentLang === 'en-US' ? {} : { lang: currentLang }}
            className="flex items-center space-x-3"
          >
            <img src={'/logo192.png'} alt="XKit Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">{t('header.brand')}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link
              to={currentLang === 'en-US' ? '/' : '/{-$lang}'}
              params={currentLang === 'en-US' ? {} : { lang: currentLang }}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              activeProps={{
                className: 'text-blue-600 hover:text-blue-700',
              }}
            >
              {t('header.home')}
            </Link>
            <Link
              to={currentLang === 'en-US' ? '/interaction-circle' : '/{-$lang}/interaction-circle'}
              params={currentLang === 'en-US' ? {} : { lang: currentLang }}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              activeProps={{
                className: 'text-blue-600 hover:text-blue-700',
              }}
            >
              {t('header.twitterCircle')}
            </Link>

            <Link
              to={currentLang === 'en-US' ? '/family-tree' : '/{-$lang}/family-tree'}
              params={currentLang === 'en-US' ? {} : { lang: currentLang }}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              activeProps={{
                className: 'text-blue-600 hover:text-blue-700',
              }}
            >
              {t('header.familyTree')}
            </Link>

            {/* Language Switcher */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <Languages className="h-4 w-4" />
                <span className="uppercase">{currentLang.split('-')[0]}</span>
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => changeLanguage(lang)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        currentLang === lang ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {lang === 'en-US' && 'English'}
                      {lang === 'zh-CN' && '简体中文'}
                      {lang === 'zh-TW' && '繁體中文'}
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
                  className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2"
                >
                  <span className="sr-only">{t('header.menu')}</span>
                  <MenuIcon className="h-6 w-6" />
                </button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <div className="flex items-center space-x-3 mb-6">
                    <img src={'/logo192.png'} alt="XKit Logo" className="h-8 w-8" />
                    <SheetTitle className="text-xl font-bold text-gray-900">{t('header.brand')}</SheetTitle>
                  </div>
                </SheetHeader>

                <nav className="flex flex-col space-y-4">
                  <SheetClose asChild>
                    <Link
                      to={currentLang === 'en-US' ? '/' : '/{-$lang}'}
                      params={currentLang === 'en-US' ? {} : { lang: currentLang }}
                      className="text-gray-600 hover:text-gray-900 px-4 py-3 rounded-md text-base font-medium transition-colors border border-gray-200 hover:bg-gray-50"
                      activeProps={{
                        className: 'text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-200',
                      }}
                    >
                      🏠 {t('header.home')}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to={currentLang === 'en-US' ? '/interaction-circle' : '/{-$lang}/interaction-circle'}
                      params={currentLang === 'en-US' ? {} : { lang: currentLang }}
                      className="text-gray-600 hover:text-gray-900 px-4 py-3 rounded-md text-base font-medium transition-colors border border-gray-200 hover:bg-gray-50"
                      activeProps={{
                        className: 'text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-200',
                      }}
                    >
                      🐦 {t('header.twitterCircle')}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to={currentLang === 'en-US' ? '/family-tree' : '/{-$lang}/family-tree'}
                      params={currentLang === 'en-US' ? {} : { lang: currentLang }}
                      className="text-gray-600 hover:text-gray-900 px-4 py-3 rounded-md text-base font-medium transition-colors border border-gray-200 hover:bg-gray-50"
                      activeProps={{
                        className: 'text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-200',
                      }}
                    >
                      🌳 {t('header.familyTree')}
                    </Link>
                  </SheetClose>

                  {/* Mobile Language Switcher */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="px-4 py-2 text-sm font-semibold text-gray-500">Language</p>
                    <div className="space-y-2">
                      {languages.map((lang) => (
                        <SheetClose key={lang} asChild>
                          <button
                            onClick={() => changeLanguage(lang)}
                            className={`block w-full text-left px-4 py-2 text-sm rounded-md ${
                              currentLang === lang
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {lang === 'en-US' && '🇺🇸 English'}
                            {lang === 'zh-CN' && '🇨🇳 简体中文'}
                            {lang === 'zh-TW' && '🇹🇼 繁體中文'}
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
