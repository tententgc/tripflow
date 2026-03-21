import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'
import AdminSidebar from '@/components/AdminSidebar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Upsert DB user
  let dbUser = await db.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0] ?? 'Admin',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
    })
  }

  // Check admin rights: SUPER_ADMIN or OperatorStaff
  let staffRole: string | undefined
  if (dbUser.systemRole !== 'SUPER_ADMIN') {
    const staff = await db.operatorStaff.findFirst({ where: { userId: dbUser.id } })
    if (!staff) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-indigo-50/20">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-8 text-center max-w-sm">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
            <p className="text-gray-500 text-sm mb-6">บัญชีนี้ยังไม่ได้รับสิทธิ์ Admin Portal</p>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                กลับไปหน้า Login
              </button>
            </form>
          </div>
        </div>
      )
    }
    staffRole = staff.role
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 flex">
      <AdminSidebar
        user={{
          name: dbUser.name,
          email: dbUser.email,
          avatarUrl: dbUser.avatarUrl,
          ...(staffRole != null && { staffRole }),
        }}
      />
      <main className="lg:ml-64 flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
