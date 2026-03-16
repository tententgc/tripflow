import type { Metadata } from 'next'
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
  title: 'TripFlow Admin — ระบบจัดการทัวร์',
  description: 'พอร์ทัลสำหรับผู้ประกอบการทัวร์ไทย',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${notoSans.variable}`}>
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  )
}
