import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bruno Test Management Platform',
  description: 'Manage and execute Bruno API tests with AI-powered generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="min-h-screen bg-gray-950">
          {children}
        </div>
      </body>
    </html>
  )
}
