import { ExternalLinkIcon } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Copyright */}
          <div className="text-sm text-gray-600">© {currentYear} XKit Tools. Built with ❤️ by rxliuli.</div>

          {/* Right side - Links */}
          <div className="flex items-center space-x-6">
            <a
              href="https://rxliuli.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-1 group"
            >
              <span>Visit Main Site</span>
              <ExternalLinkIcon className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <a
              href="https://github.com/rxliuli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-1 group"
            >
              <span>GitHub</span>
              <ExternalLinkIcon className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Bottom divider and additional info */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              XKit Tools - A collection of social media analysis and productivity tools
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
