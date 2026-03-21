'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserInfo {
  name: string
  avatarUrl: string | null
}

interface TopBarProps {
  title: string
  subtitle?: string
  backHref?: string
  gradient?: string
  children?: React.ReactNode
}

export function TopBar({
  title,
  subtitle,
  backHref,
  children,
}: TopBarProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser({ name: d.name, avatarUrl: d.avatarUrl ?? null }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 pt-safe-top sticky top-0 z-30">
      <div className="flex items-center gap-3 py-3">
        {/* Back button */}
        <button
          onClick={() => backHref ? router.push(backHref) : router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all flex-shrink-0 no-btn-fx"
          aria-label="ย้อนกลับ"
        >
          <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-gray-900 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-gray-400 truncate mt-0.5">{subtitle}</p>}
        </div>

        {/* Extra slot */}
        {children}

        {/* Avatar */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-50 flex items-center justify-center no-btn-fx hover:ring-2 hover:ring-indigo-200 transition-all"
            aria-label="เมนูผู้ใช้"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
              />
            ) : null}
            <span className={`text-indigo-600 font-bold text-sm ${user?.avatarUrl ? 'hidden' : ''}`}>{user?.name?.[0] ?? '?'}</span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">บัญชีของฉัน</p>
                  <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{user?.name}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left font-medium"
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
}
