'use client'

import { createClient } from '@/lib/supabase/client'

export function GoogleLoginButton() {
  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white rounded-2xl text-gray-700 font-semibold text-sm hover:bg-gray-50 active:scale-[0.97] transition-all touch-target shadow-lg shadow-black/10"
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 13.9-5.3l-6.4-5.4C29.5 34.9 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.1C9.4 35.6 16.2 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.4 5.4C41.7 36.1 44 30.4 44 24c0-1.3-.1-2.7-.4-3.9z"/>
      </svg>
      เข้าสู่ระบบด้วย Google
    </button>
  )
}
