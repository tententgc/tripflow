import { Metadata } from 'next'
import { GoogleLoginButton } from './GoogleLoginButton'

export const metadata: Metadata = { title: 'เข้าสู่ระบบ — TripFlow' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 relative overflow-hidden">
      {/* Gradient background — full screen */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-600 via-violet-600/60 to-gray-950" />
      {/* Subtle glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/25 rounded-full blur-[120px]" />

      {/* Content — centered */}
      <div className="relative z-10 w-full max-w-sm px-5">
        {/* Logo + branding */}
        <div className="text-center mb-8">
          {/* Inline logo SVG */}
          <div className="w-20 h-20 mx-auto mb-5">
            <svg width="80" height="80" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="512" height="512" rx="112" fill="white" fillOpacity="0.15"/>
              <rect x="4" y="4" width="504" height="504" rx="108" stroke="white" strokeOpacity="0.2" strokeWidth="8"/>
              <circle cx="256" cy="256" r="160" stroke="white" strokeWidth="12" opacity="0.3"/>
              <ellipse cx="256" cy="256" rx="70" ry="160" stroke="white" strokeWidth="8" opacity="0.2"/>
              <line x1="96" y1="256" x2="416" y2="256" stroke="white" strokeWidth="8" opacity="0.2"/>
              <path d="M120 370L220 256L120 210L380 120L300 400L256 300L120 370Z" fill="white" fillOpacity="0.95"/>
              <path d="M380 120L256 300" stroke="white" strokeWidth="6" opacity="0.3" strokeDasharray="12 8"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">TripFlow</h1>
          <p className="text-indigo-200/80 text-sm mt-1.5">จัดการทริปกลุ่มได้ทั่วโลก</p>
        </div>

        {/* Glass card */}
        <div className="bg-white/[0.07] backdrop-blur-2xl rounded-3xl border border-white/10 p-8">
          <p className="text-center text-white/60 text-sm mb-6">เข้าสู่ระบบเพื่อดูทริปของคุณ</p>
          <GoogleLoginButton />
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          ใช้งานได้ทั่วโลก · รองรับการใช้งานในจีน
        </p>
      </div>
    </div>
  )
}
