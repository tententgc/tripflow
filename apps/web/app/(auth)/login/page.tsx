import { Metadata } from 'next'
import { GoogleLoginButton } from './GoogleLoginButton'

export const metadata: Metadata = { title: 'เข้าสู่ระบบ — TripFlow' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/30 shadow-xl">
            <span className="text-white text-2xl font-bold">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-white">TripFlow</h1>
          <p className="text-indigo-200 text-sm mt-1">เข้าสู่ระบบเพื่อดูทริปของคุณ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <GoogleLoginButton />
        </div>

        <p className="text-center text-indigo-200/70 text-xs mt-6">
          จัดการทริปกลุ่มได้ทั่วโลก · ใช้งานได้แม้ในจีน
        </p>
      </div>
    </div>
  )
}
