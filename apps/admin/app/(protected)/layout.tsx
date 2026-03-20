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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-6xl mb-4">🚫</p>
            <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
            <p className="text-gray-500 text-sm mb-6">บัญชีนี้ยังไม่ได้รับสิทธิ์ Admin Portal</p>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
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
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        user={{
          name: dbUser.name,
          email: dbUser.email,
          avatarUrl: dbUser.avatarUrl,
          ...(staffRole != null && { staffRole }),
        }}
      />
      <main className="ml-64 flex-1">
        {children}
      </main>
    </div>
  )
}
