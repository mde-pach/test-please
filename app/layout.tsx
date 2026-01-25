import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bruno Test Platform',
  description: 'Modern API testing platform powered by Bruno',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-950 text-gray-100">
        <div className="min-h-screen flex flex-col">
          {/* Compact Navigation */}
          <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
            <div className="mx-auto px-6">
              <div className="flex items-center justify-between h-14">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="flex items-center space-x-2">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="text-lg font-semibold text-gray-100">
                      Bruno Test Platform
                    </span>
                  </Link>
                  <div className="flex space-x-1">
                    <Link
                      href="/"
                      className="text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                      New Project
                    </Link>
                    <Link
                      href="/projects"
                      className="text-gray-400 hover:text-gray-100 hover:bg-gray-800 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                      Projects
                    </Link>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-md">
                    Powered by Bruno
                  </span>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
