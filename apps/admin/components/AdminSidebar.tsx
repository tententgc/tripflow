'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: '📊' },
  { href: '/tours', label: 'จัดการทัวร์', icon: '🗺️' },
  { href: '/travelers', label: 'นักเดินทาง', icon: '👥' },
  { href: '/notifications', label: 'การแจ้งเตือน', icon: '🔔' },
  { href: '/settings', label: 'ตั้งค่า', icon: '⚙️' },
]

interface Props {
  user: {
    name: string
    email: string
    avatarUrl: string | null
    staffRole?: string
  }
}

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Globe */}
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" opacity="0.4"/>
              <ellipse cx="12" cy="12" rx="4" ry="9" stroke="white" strokeWidth="1.2" opacity="0.3"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="white" strokeWidth="1" opacity="0.3"/>
              {/* Plane */}
              <path d="M5 17L10 12L5 10L18 6L14 19L12 14L5 17Z" fill="white" fillOpacity="0.95"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm tracking-tight">TripFlow</p>
            <p className="text-[10px] text-gray-400 font-medium">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
              />
            ) : null}
            <span className={`text-blue-600 font-semibold text-sm ${user.avatarUrl ? 'hidden' : ''}`}>{user.name[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>🚪</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  )
}
