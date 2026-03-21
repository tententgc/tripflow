import type { Metadata } from 'next'
import { Inter, Noto_Sans_Thai } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  variable: '--font-noto-thai',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'TripFlow Admin — ระบบจัดการทัวร์',
  description: 'พอร์ทัลสำหรับผู้ประกอบการทัวร์ไทย',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${inter.variable} ${notoSansThai.variable}`}>
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  )
}
