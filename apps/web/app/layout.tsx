import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Thai, Noto_Sans } from 'next/font/google'
import './globals.css'

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  variable: '--font-noto-sans-thai',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TripFlow — ทริปของคุณ',
  description: 'แพลตฟอร์มบริหารทัวร์กลุ่มสำหรับนักเดินทางชาวไทย',
  manifest: '/manifest.json',
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
  themeColor: '#2563EB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${notoSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-thai bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  )
}
