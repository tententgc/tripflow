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

  const inputCls = 'w-full px-4 py-3 border border-white/10 rounded-xl text-sm bg-white/[0.04] text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/30 transition-colors'

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/20 via-violet-600/10 to-gray-950" />
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 30px rgba(99,102,241,.25)' }}>
            <svg width="64" height="64" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="logoBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop stopColor="#6366F1"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs>
              <rect width="512" height="512" rx="112" fill="url(#logoBg)"/>
              <circle cx="256" cy="256" r="160" stroke="white" strokeWidth="12" opacity="0.25"/>
              <ellipse cx="256" cy="256" rx="70" ry="160" stroke="white" strokeWidth="8" opacity="0.15"/>
              <line x1="96" y1="256" x2="416" y2="256" stroke="white" strokeWidth="8" opacity="0.15"/>
              <path d="M120 370L220 256L120 210L380 120L300 400L256 300L120 370Z" fill="white" fillOpacity="0.95"/>
              <path d="M380 120L256 300" stroke="white" strokeWidth="6" opacity="0.3" strokeDasharray="12 8"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">TripFlow Admin</h1>
          <p className="text-white/40 text-sm mt-1">พอร์ทัลสำหรับผู้ประกอบการทัวร์</p>
        </div>

        {/* Glass card */}
        <div className="bg-white/[0.05] backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-7">

          {/* Magic link sent state */}
          {magicSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="font-bold text-white mb-1">ตรวจสอบอีเมลของคุณ</h2>
              <p className="text-sm text-white/40 mb-4">
                ส่ง Magic Link ไปที่ <span className="font-medium text-white/70">{email}</span> แล้ว<br />
                กดลิงก์ในอีเมลเพื่อเข้าสู่ระบบ
              </p>
              <button
                onClick={() => { setMagicSent(false); setEmail('') }}
                className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
              >
                ส่งอีกครั้ง
              </button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="flex bg-white/[0.04] rounded-xl p-1 mb-6 border border-white/[0.06]">
                <button
                  onClick={() => { setMode('password'); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'password' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-white/35 hover:text-white/60'}`}
                >
                  รหัสผ่าน
                </button>
                <button
                  onClick={() => { setMode('magic'); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'magic' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-white/35 hover:text-white/60'}`}
                >
                  Magic Link
                </button>
              </div>

              {mode === 'password' ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="text-[11px] text-white/40 font-medium mb-1.5 block">อีเมล</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="admin@company.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/40 font-medium mb-1.5 block">รหัสผ่าน</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.98] hover:brightness-110"
                  >
                    {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                  </button>
                  <p className="text-center text-xs text-white/25">
                    ยังไม่มีรหัสผ่าน?{' '}
                    <button type="button" onClick={() => setMode('magic')} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                      ใช้ Magic Link แทน
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <p className="text-sm text-white/35">
                    กรอกอีเมลแล้วระบบจะส่งลิงก์เข้าสู่ระบบให้ทันที ไม่ต้องใช้รหัสผ่าน
                  </p>
                  <div>
                    <label className="text-[11px] text-white/40 font-medium mb-1.5 block">อีเมล</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="admin@company.com"
                      className={inputCls}
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.98] hover:brightness-110"
                  >
                    {loading ? 'กำลังส่ง...' : 'ส่ง Magic Link'}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-white/20">หรือ</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-lg shadow-black/10"
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

        <p className="text-center text-xs text-white/15 mt-6">
          สำหรับผู้ประกอบการทัวร์และเจ้าหน้าที่เท่านั้น
        </p>
      </div>
    </div>
  )
}
