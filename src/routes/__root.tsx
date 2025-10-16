import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'

import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'XKit Tools - Social Media Analysis Suite',
      },
      {
        name: 'description',
        content:
          'A powerful suite of social media analysis tools to help you understand your network interaction data. Create Twitter interaction circles, analyze user engagement, and visualize your social media presence.',
      },
      {
        name: 'keywords',
        content:
          'social media analysis, twitter tools, interaction circle, data visualization, network analysis, twitter analytics, social media insights, user engagement analysis',
      },
      {
        name: 'author',
        content: 'XKit Tools',
      },
      {
        name: 'robots',
        content: 'index, follow',
      },
      // Open Graph tags
      {
        property: 'og:title',
        content: 'XKit Tools - Social Media Analysis Suite',
      },
      {
        property: 'og:description',
        content:
          'A powerful suite of social media analysis tools to help you understand your network interaction data. Create Twitter interaction circles and analyze user engagement.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: 'https://xkit.rxliuli.com',
      },
      {
        property: 'og:image',
        content: 'https://xkit.rxliuli.com/logo512.png',
      },
      {
        property: 'og:image:width',
        content: '512',
      },
      {
        property: 'og:image:height',
        content: '512',
      },
      {
        property: 'og:image:alt',
        content: 'XKit Tools Logo - Social Media Analysis Suite',
      },
      {
        property: 'og:site_name',
        content: 'XKit Tools',
      },
      // Twitter Card tags
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'XKit Tools - Social Media Analysis Suite',
      },
      {
        name: 'twitter:description',
        content:
          'A powerful suite of social media analysis tools. Create Twitter interaction circles and analyze your social media network data.',
      },
      {
        name: 'twitter:image',
        content: 'https://xkit.rxliuli.com/logo512.png',
      },
      {
        name: 'twitter:image:alt',
        content: 'XKit Tools Logo - Social Media Analysis Suite',
      },
      {
        name: 'twitter:creator',
        content: '@moeruri',
      },
      {
        name: 'twitter:site',
        content: '@moeruri',
      },
      // Additional SEO tags
      {
        name: 'theme-color',
        content: '#2563eb',
      },
      {
        name: 'application-name',
        content: 'XKit Tools',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: '/logo192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        href: '/logo512.png',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo192.png',
      },
      {
        rel: 'canonical',
        href: 'https://xkit.rxliuli.com',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  // Use i18n.language, defaulting to 'en-US' if not set
  const htmlLang = i18n.language || 'en-US'
  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Apply theme immediately to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var themeMode = localStorage.getItem('themeMode') || 'auto';
                  var theme = themeMode;
                  
                  if (themeMode === 'auto') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'XKit Tools',
              description:
                'A powerful suite of social media analysis tools to help you understand your network interaction data. Create Twitter interaction circles, analyze user engagement, and visualize your social media presence.',
              url: 'https://xkit.rxliuli.com',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              author: {
                '@type': 'Person',
                name: 'rxliuli',
                url: 'https://rxliuli.com',
              },
              publisher: {
                '@type': 'Organization',
                name: 'XKit Tools',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://xkit.rxliuli.com/logo512.png',
                },
              },
              featureList: [
                'Twitter Interaction Circle Generator',
                'Social Media Data Visualization',
                'Network Analysis Tools',
                'Privacy-Protected Local Processing',
                'Real-time Analysis',
              ],
            }),
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
