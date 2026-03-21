import { db } from '@tripflow/database'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import SettingsClient from './SettingsClient'
import StaffManager from './StaffManager'

export const metadata: Metadata = { title: 'ตั้งค่า — TripFlow Admin' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await db.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) redirect('/login')

  const operator = await db.operator.findFirst({
    include: {
      staff: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  const tourCount = await db.tour.count()
  const userCount = await db.user.count()

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า</h1>
        <p className="text-gray-400 text-sm mt-1">จัดการข้อมูลระบบและผู้ดูแล</p>
      </div>

      <div className="space-y-6">
        {/* Profile — gradient hero */}
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 blur-xl" />
          <div className="relative flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-lg">
              {dbUser.avatarUrl ? (
                <img src={dbUser.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-3xl font-bold">{dbUser.name[0]}</span>
              )}
            </div>
            <div>
              <p className="text-xl font-bold">{dbUser.name}</p>
              <p className="text-white/60 text-sm mt-0.5">{dbUser.email}</p>
              <span className="inline-block mt-2 text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
                {dbUser.systemRole === 'SUPER_ADMIN' ? '⭐ Super Admin' : '👤 Staff'}
              </span>
            </div>
          </div>
        </div>

        {/* Operator info */}
        {operator && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">🏢</div>
              <h2 className="font-bold text-gray-900 text-sm">ข้อมูลบริษัท</h2>
            </div>
            <div className="p-6">
              <SettingsClient operator={{
                id: operator.id,
                name: operator.name,
                nameEn: operator.nameEn,
                email: operator.email,
                phone: operator.phone,
                lineId: operator.lineId,
                website: operator.website,
              }} />
            </div>
          </div>
        )}

        {/* Staff management */}
        {operator && (
          <StaffManager initialStaff={operator.staff.map(s => ({
            id: s.id,
            role: s.role,
            userName: s.user.name,
            userEmail: s.user.email,
          }))} />
        )}

        {/* System stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm">📊</div>
            <h2 className="font-bold text-gray-900 text-sm">ข้อมูลระบบ</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'ทัวร์', value: tourCount, color: 'bg-indigo-50 text-indigo-700', icon: '🗺️' },
                { label: 'ผู้ใช้', value: userCount, color: 'bg-emerald-50 text-emerald-700', icon: '👤' },
                { label: 'แพลตฟอร์ม', value: 'TripFlow', color: 'bg-violet-50 text-violet-700', icon: '✨' },
                { label: 'เวอร์ชัน', value: 'v1.0.0', color: 'bg-amber-50 text-amber-700', icon: '🏷️' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-lg font-black mt-1">{s.value}</p>
                  <p className="text-[10px] opacity-60 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-sm">⚠️</div>
            <h2 className="font-bold text-red-600 text-sm">โซนอันตราย</h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-xs text-gray-500">การดำเนินการในส่วนนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex gap-3">
              <button disabled className="px-4 py-2 border border-red-200 text-red-500 rounded-xl text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                🗑️ ล้างข้อมูล Activity Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
