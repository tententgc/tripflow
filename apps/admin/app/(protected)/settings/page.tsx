import { db } from '@tripflow/database'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import SettingsClient from './SettingsClient'
import StaffManager from './StaffManager'
import Image from 'next/image'

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
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า</h1>
        <p className="text-gray-400 text-sm mt-1">จัดการข้อมูลระบบและผู้ดูแล</p>
      </div>

      <div className="space-y-6">
        {/* Profile — gradient hero */}
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 blur-xl" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
              {dbUser.avatarUrl ? (
                <Image src={dbUser.avatarUrl} alt="" width={80} height={80} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
              ) : (
                <span className="text-3xl font-bold">{dbUser.name[0]}</span>
              )}
            </div>
            <div>
              <p className="text-xl font-bold">{dbUser.name}</p>
              <p className="text-white/60 text-sm mt-0.5">{dbUser.email}</p>
              <span className="inline-block mt-2 text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
                {dbUser.systemRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff'}
              </span>
            </div>
          </div>
        </div>

        {/* Operator info */}
        {operator && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-indigo-100/30 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
              </div>
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
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-100/30 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
            </div>
            <h2 className="font-bold text-gray-900 text-sm">ข้อมูลระบบ</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'ทัวร์', value: tourCount, color: 'bg-indigo-50 text-indigo-700' },
                { label: 'ผู้ใช้', value: userCount, color: 'bg-emerald-50 text-emerald-700' },
                { label: 'แพลตฟอร์ม', value: 'TripFlow', color: 'bg-violet-50 text-violet-700' },
                { label: 'เวอร์ชัน', value: 'v1.0.0', color: 'bg-amber-50 text-amber-700' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                  <p className="text-lg font-black mt-1">{s.value}</p>
                  <p className="text-[10px] opacity-60 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h2 className="font-bold text-red-600 text-sm">โซนอันตราย</h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-xs text-gray-500">การดำเนินการในส่วนนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex gap-3">
              <button disabled className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 rounded-xl text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                ล้างข้อมูล Activity Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
