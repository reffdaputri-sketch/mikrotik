import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Purnama WiFi — Internet Pantas & Menyeronokkan',
  description: 'Platform billing internet hotspot dan PPPoE terbaik. Sambungan internet paling hebat!',
  applicationName: 'Purnama WiFi',
  keywords: ['wifi', 'internet', 'hotspot', 'pppoe', 'purnama', 'malaysia'],
  authors: [{ name: 'Purnama WiFi' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Purnama WiFi',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Purnama WiFi',
    title: 'Purnama WiFi — Internet Pantas & Menyeronokkan',
    description: 'Sambungan internet paling hebat untuk streaming, gaming, dan belajar!',
  },
  twitter: {
    card: 'summary',
    title: 'Purnama WiFi',
    description: 'Sambungan internet paling hebat!',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ms">
      <head>
        {/* PWA - Apple / iOS specific */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Purnama WiFi" />
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
