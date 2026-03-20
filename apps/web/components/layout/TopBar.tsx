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
  backHref?: string          // explicit URL; omit to use router.back()
  gradient?: string          // tailwind classes for background
  children?: React.ReactNode // extra right-side slot
}

export function TopBar({
  title,
  subtitle,
  backHref,
  gradient = 'bg-gradient-to-br from-indigo-600 to-violet-700',
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

  // close on outside click
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
    <div className={`${gradient} text-white px-4 pt-safe-top pb-5 relative overflow-hidden`}>
      {/* Decorative blobs */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute top-2 right-16 w-16 h-16 rounded-full bg-white/8 blur-xl pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-black/10 blur-2xl pointer-events-none" />
      {/* Dot grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      <div className="relative flex items-center gap-3 pt-4">
        {/* Back button */}
        <button
          onClick={() => backHref ? router.push(backHref) : router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors flex-shrink-0 border border-white/20"
          aria-label="ย้อนกลับ"
        >
          <span className="text-white text-sm leading-none">←</span>
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold leading-tight truncate drop-shadow-sm">{title}</h1>
          {subtitle && <p className="text-white/65 text-xs truncate mt-0.5">{subtitle}</p>}
        </div>

        {/* Extra slot */}
        {children}

        {/* Avatar + dropdown */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/40 hover:ring-white/70 transition-all flex items-center justify-center bg-white/20 shadow-lg"
            aria-label="เมนูผู้ใช้"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-semibold text-sm">{user?.name?.[0] ?? '?'}</span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              </div>
              <button
                onClick={() => { setOpen(false); router.push('/profile') }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <span>👤</span> โปรไฟล์
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
              >
                <span>🚪</span> ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
