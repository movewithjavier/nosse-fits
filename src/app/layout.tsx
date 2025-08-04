import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nosse Fits',
  description: 'Manage your little one\'s wardrobe with ease',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}