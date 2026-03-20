'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'password' | 'magic'

export default function AdminLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/me')
    if (!res.ok) {
      await supabase.auth.signOut()
      setError('บัญชีนี้ไม่มีสิทธิ์เข้าถึง Admin Portal')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (otpError) {
      setError('ส่ง Magic Link ไม่ได้ กรุณาลองใหม่')
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TripFlow Admin</h1>
          <p className="text-gray-500 text-sm mt-1">พอร์ทัลสำหรับผู้ประกอบการทัวร์</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Magic link sent state */}
          {magicSent ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-3">📧</p>
              <h2 className="font-bold text-gray-900 mb-1">ตรวจสอบอีเมลของคุณ</h2>
              <p className="text-sm text-gray-500 mb-4">
                ส่ง Magic Link ไปที่ <span className="font-medium text-gray-800">{email}</span> แล้ว<br />
                กดลิงก์ในอีเมลเพื่อเข้าสู่ระบบ
              </p>
              <button
                onClick={() => { setMagicSent(false); setEmail('') }}
                className="text-blue-600 text-sm hover:underline"
              >
                ส่งอีกครั้ง
              </button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                <button
                  onClick={() => { setMode('password'); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  รหัสผ่าน
                </button>
                <button
                  onClick={() => { setMode('magic'); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'magic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  Magic Link
                </button>
              </div>

              {mode === 'password' ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">อีเมล</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="admin@company.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">รหัสผ่าน</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                  </button>
                  <p className="text-center text-xs text-gray-400">
                    ยังไม่มีรหัสผ่าน?{' '}
                    <button type="button" onClick={() => setMode('magic')} className="text-blue-600 hover:underline">
                      ใช้ Magic Link แทน
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <p className="text-sm text-gray-500">
                    กรอกอีเมลแล้วระบบจะส่งลิงก์เข้าสู่ระบบให้ทันที ไม่ต้องใช้รหัสผ่าน
                  </p>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">อีเมล</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="admin@company.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'กำลังส่ง...' : '📧 ส่ง Magic Link'}
                  </button>
                </form>
              )}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">หรือ</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                เข้าสู่ระบบด้วย Google
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          สำหรับผู้ประกอบการทัวร์และเจ้าหน้าที่เท่านั้น
        </p>
      </div>
    </div>
  )
}
