import { Metadata } from 'next'

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

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 touch-target"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 touch-target"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 touch-target transition-colors"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">
            ยังไม่มีบัญชี?{' '}
            <a href="/register" className="text-primary-600 font-medium">
              สมัครสมาชิก
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
