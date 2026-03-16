import { Metadata } from 'next'
import { GoogleLoginButton } from './GoogleLoginButton'

export const metadata: Metadata = { title: 'เข้าสู่ระบบ — TripFlow' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-600 to-primary-700 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TripFlow</h1>
          <p className="text-gray-500 text-sm mt-1">เข้าสู่ระบบเพื่อดูทริปของคุณ</p>
        </div>

        <GoogleLoginButton />
      </div>
    </div>
  )
}
