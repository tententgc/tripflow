import { db } from '@tripflow/database'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'แดชบอร์ด — TripFlow Admin' }

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
  IT: '🇮🇹', GB: '🇬🇧', SG: '🇸🇬', AU: '🇦🇺', DE: '🇩🇪',
}

export default async function DashboardPage() {
  const [tourCount, travelerCount, upcomingTours] = await Promise.all([
    db.tour.count({ where: { status: { in: ['PUBLISHED', 'ACTIVE'] } } }),
    db.user.count(),
    db.tour.findMany({
      where: { startDate: { gte: new Date() }, status: { in: ['PUBLISHED', 'ACTIVE', 'DRAFT'] } },
      include: { _count: { select: { members: true } } },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white border-r border-gray-200 fixed left-0 top-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">TripFlow</p>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {[
              { href: '/dashboard', label: 'แดชบอร์ด', icon: '📊', active: true },
              { href: '/tours', label: 'จัดการทัวร์', icon: '🗺️' },
              { href: '/travelers', label: 'นักเดินทาง', icon: '👥' },
              { href: '/notifications', label: 'การแจ้งเตือน', icon: '🔔' },
              { href: '/settings', label: 'ตั้งค่า', icon: '⚙️' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
            <p className="text-gray-500 text-sm mt-1">ภาพรวมระบบจัดการทัวร์</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">ทัวร์ที่กำลังดำเนินการ</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{tourCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">ผู้ใช้งานทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{travelerCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">ทัวร์ที่กำลังจะมาถึง</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingTours.length}</p>
            </div>
          </div>

          {/* Upcoming tours */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">ทัวร์ที่กำลังจะออกเดินทาง</h2>
              <a href="/tours" className="text-blue-600 text-sm">ดูทั้งหมด →</a>
            </div>
            {upcomingTours.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-3xl mb-2">🗺️</p>
                <p>ยังไม่มีทัวร์</p>
                <a href="/tours/new" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
                  + สร้างทัวร์แรก
                </a>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ทัวร์</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">วันที่</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">สมาชิก</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {upcomingTours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{countryFlags[tour.primaryCountry] ?? '🌍'}</span>
                          <span className="font-medium text-gray-900 text-sm">{tour.title}</span>
                          {tour.isChina && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">CN Mode</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tour.startDate).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tour._count.members}/{tour.maxMembers ?? '∞'} คน
                      </td>
                      <td className="px-6 py-4">
                        <a href={`/tours/${tour.id}`} className="text-blue-600 text-sm hover:underline">
                          จัดการ →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
