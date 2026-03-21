import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TripFlow — ทริปของคุณ',
  description: 'แพลตฟอร์มบริหารทัวร์กลุ่มสำหรับนักเดินทางชาวไทย',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.svg' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TripFlow',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    title: 'TripFlow',
    description: 'แพลตฟอร์มบริหารทัวร์กลุ่มสำหรับนักเดินทางชาวไทย',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#6366F1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={inter.variable}>
      <body className="bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  )
}
