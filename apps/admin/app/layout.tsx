import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TripFlow Admin — ระบบจัดการทัวร์',
  description: 'พอร์ทัลสำหรับผู้ประกอบการทัวร์ไทย',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={inter.variable}>
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  )
}
