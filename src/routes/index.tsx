import { createFileRoute, Link } from '@tanstack/react-router'
import logo from '../logo.png'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <img
            src={logo}
            className="h-24 sm:h-32 mx-auto mb-6 sm:mb-8 animate-[spin_20s_linear_infinite]"
            alt="XKit Logo"
          />

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4">XKit Tools</h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            A powerful suite of social media analysis tools to help you understand your network interaction data
          </p>

          {/* Tools Grid */}
          <div className="max-w-4xl mx-auto px-4">
            {/* Twitter Circle Tool */}
            <Link
              to="/interaction-circle"
              className="group bg-white rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block max-w-2xl mx-auto mb-6 sm:mb-8"
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🐦</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
                Twitter Interaction Circle
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Analyze your Twitter interaction data and generate personalized interaction circle visualizations.
                Discover which users you interact with most frequently and uncover your core social network.
              </p>
              <div className="mt-6 inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                Start Analysis
                <svg
                  className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>

            {/* More Features Coming Soon */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 sm:p-8 border-2 border-dashed border-purple-200 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚀</div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
                  More Features Coming Soon
                </h3>
                <p className="text-gray-600">
                  We're working hard to develop more useful Twitter analysis tools, including tweet sentiment analysis, topic trend tracking, user influence assessment, and more. Stay tuned!
                </p>
                <div className="mt-6 inline-flex items-center text-purple-600 font-medium">
                  Coming Soon
                  <svg
                    className="ml-2 w-4 h-4 animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 sm:mt-16 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8">Core Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white/70 rounded-lg p-4 sm:p-6">
                <div className="text-xl sm:text-2xl mb-2 sm:mb-3">📊</div>
                <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Data Visualization</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Create interactive data visualization charts using D3.js
                </p>
              </div>
              <div className="bg-white/70 rounded-lg p-4 sm:p-6">
                <div className="text-xl sm:text-2xl mb-2 sm:mb-3">🔒</div>
                <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Privacy Protection</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  All data processing is done locally to protect your privacy
                </p>
              </div>
              <div className="bg-white/70 rounded-lg p-4 sm:p-6">
                <div className="text-xl sm:text-2xl mb-2 sm:mb-3">⚡</div>
                <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Real-time Analysis</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Quickly analyze large amounts of data and generate real-time results
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
