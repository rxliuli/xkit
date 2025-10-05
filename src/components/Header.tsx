import { Link } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={'/logo192.png'} alt="XKit Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">XKit Tools</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              activeProps={{
                className: 'text-blue-600 hover:text-blue-700',
              }}
            >
              Home
            </Link>
            <Link
              to="/interaction-circle"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              activeProps={{
                className: 'text-blue-600 hover:text-blue-700',
              }}
            >
              Twitter Circle
            </Link>
          </nav>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2"
                >
                  <span className="sr-only">Open main menu</span>
                  <MenuIcon className="h-6 w-6" />
                </button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <div className="flex items-center space-x-3 mb-6">
                    <img src={'/logo192.png'} alt="XKit Logo" className="h-8 w-8" />
                    <SheetTitle className="text-xl font-bold text-gray-900">XKit Tools</SheetTitle>
                  </div>
                </SheetHeader>

                <nav className="flex flex-col space-y-4">
                  <SheetClose asChild>
                    <Link
                      to="/"
                      className="text-gray-600 hover:text-gray-900 px-4 py-3 rounded-md text-base font-medium transition-colors border border-gray-200 hover:bg-gray-50"
                      activeProps={{
                        className: 'text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-200',
                      }}
                    >
                      🏠 Home
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/interaction-circle"
                      className="text-gray-600 hover:text-gray-900 px-4 py-3 rounded-md text-base font-medium transition-colors border border-gray-200 hover:bg-gray-50"
                      activeProps={{
                        className: 'text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-200',
                      }}
                    >
                      🐦 Twitter Circle
                    </Link>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
