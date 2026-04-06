'use client'

import { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useApi } from '@/lib/swr'

interface UserInfo {
  name: string
  avatarUrl: string | null
}

interface TopBarProps {
  title: string
  subtitle?: string
  backHref?: string
  variant?: 'light' | 'dark'
  children?: React.ReactNode
}

export const TopBar = memo(function TopBar({
  title,
  subtitle,
  backHref,
  variant = 'light',
  children,
}: TopBarProps) {
  const isDark = variant === 'dark'
  const router = useRouter()
  const { data: me } = useApi<{ name: string; avatarUrl: string | null }>('/api/auth/me')
  const user = useMemo<UserInfo | null>(() => me ? { name: me.name, avatarUrl: me.avatarUrl ?? null } : null, [me])
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClickOutside])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className={`${isDark ? 'bg-slate-900/80 border-b border-white/[0.06]' : 'bg-white/70 border-b border-slate-200/50'} backdrop-blur-xl px-4 pt-safe-top sticky top-0 z-30`}>
      <div className="flex items-center gap-3 py-3 max-w-[1100px] min-[900px]:px-8 mx-auto">
        {/* Back button */}
        <button
          onClick={() => backHref ? router.push(backHref) : router.back()}
          className={`w-11 h-11 flex items-center justify-center rounded-xl active:scale-95 transition-all flex-shrink-0 no-btn-fx ${isDark ? 'bg-white/[0.06] hover:bg-white/[0.1]' : 'bg-primary-50 hover:bg-primary-100'}`}
          aria-label="ย้อนกลับ"
        >
          <svg className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-primary-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className={`text-[15px] font-bold leading-tight truncate ${isDark ? 'text-[#f0f0ff]' : 'text-slate-800'}`}>{title}</h1>
          {subtitle && <p className={`text-[12px] truncate mt-0.5 ${isDark ? 'text-white/[0.45]' : 'text-slate-400'}`}>{subtitle}</p>}
        </div>

        {/* Extra slot */}
        {children}

        {/* Avatar */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center no-btn-fx hover:ring-2 transition-all ${isDark ? 'bg-white/[0.06] hover:ring-white/20' : 'bg-primary-50 hover:ring-primary-200'}`}
            aria-label="เมนูผู้ใช้"
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={36}
                height={36}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
                unoptimized
              />
            ) : null}
            <span className={`${isDark ? 'text-primary-300' : 'text-primary-600'} font-bold text-sm ${user?.avatarUrl ? 'hidden' : ''}`}>{user?.name?.[0] ?? '?'}</span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-[14rem] bg-white/80 backdrop-blur-2xl rounded-2xl shadow-lg border border-slate-200/40 overflow-hidden z-50">
                <a href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-primary-50/50 transition-colors border-b border-slate-100/60">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-primary-100/50">
                    {user?.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" width={32} height={32} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                    ) : (
                      <span className="text-primary-600 font-bold text-xs">{user?.name?.[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[10px] text-primary-500">ดูโปรไฟล์</p>
                  </div>
                </a>
                <button
                  onClick={logout}
                  className="w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/50 transition-colors text-left font-medium"
                >
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})
