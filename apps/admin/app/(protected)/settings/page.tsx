import { db } from '@tripflow/database'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import SettingsClient from './SettingsClient'

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
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">👤</div>
            <h2 className="font-bold text-gray-900 text-sm">ข้อมูลผู้ดูแลระบบ</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center overflow-hidden">
                {dbUser.avatarUrl ? (
                  <img src={dbUser.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-2xl font-bold text-indigo-600">{dbUser.name[0]}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">{dbUser.name}</p>
                <p className="text-sm text-gray-400">{dbUser.email}</p>
                <p className="text-xs text-indigo-600 font-medium mt-0.5">{dbUser.systemRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff'}</p>
              </div>
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

        {/* Staff list */}
        {operator && operator.staff.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-sm">👥</div>
              <h2 className="font-bold text-gray-900 text-sm">ทีมผู้ดูแล ({operator.staff.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {operator.staff.map(s => (
                <div key={s.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {s.user.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{s.user.name}</p>
                    <p className="text-xs text-gray-400">{s.user.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.role === 'OWNER' ? 'bg-amber-100 text-amber-700' :
                    s.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {s.role === 'OWNER' ? 'เจ้าของ' : s.role === 'MANAGER' ? 'ผู้จัดการ' : 'เจ้าหน้าที่'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm">📊</div>
            <h2 className="font-bold text-gray-900 text-sm">ข้อมูลระบบ</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'ทัวร์ทั้งหมด', value: tourCount, icon: '🗺️' },
                { label: 'ผู้ใช้ทั้งหมด', value: userCount, icon: '👤' },
                { label: 'แพลตฟอร์ม', value: 'TripFlow', icon: '✨' },
                { label: 'เวอร์ชัน', value: 'v1.0.0', icon: '🏷️' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="text-sm font-bold text-gray-800">{s.value}</p>
                  </div>
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
