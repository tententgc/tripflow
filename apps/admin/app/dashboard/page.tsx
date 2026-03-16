import { Metadata } from 'next'

export const metadata: Metadata = { title: 'แดชบอร์ด — TripFlow Admin' }

const mockStats = {
  activeTours: 3,
  totalTravelers: 67,
  toursThisMonth: 5,
  upcomingDepartures: [
    { id: 't1', title: 'ทัวร์จีน ปักกิ่ง', departDate: '2026-04-01', countries: ['CN'], memberCount: 24 },
    { id: 't2', title: 'ทัวร์ญี่ปุ่น โตเกียว', departDate: '2026-05-10', countries: ['JP'], memberCount: 18 },
    { id: 't3', title: 'ทัวร์เกาหลี โซล', departDate: '2026-05-22', countries: ['KR'], memberCount: 25 },
  ],
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷', IT: '🇮🇹',
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar + main layout */}
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
              { href: '/dashboard', label: 'แดชบอร์ด', icon: '📊' },
              { href: '/tours', label: 'จัดการทัวร์', icon: '🗺️' },
              { href: '/travelers', label: 'นักเดินทาง', icon: '👥' },
              { href: '/notifications', label: 'การแจ้งเตือน', icon: '🔔' },
              { href: '/settings', label: 'ตั้งค่า', icon: '⚙️' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
            <p className="text-gray-500 text-sm mt-1">ภาพรวมการดำเนินงาน</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { label: 'ทัวร์ที่กำลังดำเนินการ', value: mockStats.activeTours, icon: '🗺️', color: 'bg-blue-50 text-blue-700' },
              { label: 'นักเดินทางทั้งหมด', value: mockStats.totalTravelers, icon: '👥', color: 'bg-green-50 text-green-700' },
              { label: 'ทัวร์เดือนนี้', value: mockStats.toursThisMonth, icon: '📅', color: 'bg-purple-50 text-purple-700' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Upcoming departures */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">ทริปที่กำลังจะออกเดินทาง</h2>
              <a href="/tours/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                + สร้างทัวร์ใหม่
              </a>
            </div>
            <div className="divide-y divide-gray-50">
              {mockStats.upcomingDepartures.map((tour) => (
                <div key={tour.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      {tour.countries.map((c) => (
                        <span key={c} className="text-xl">{countryFlags[c] ?? '🌍'}</span>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tour.title}</p>
                      <p className="text-sm text-gray-500">ออกเดินทาง {tour.departDate} · {tour.memberCount} คน</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/tours/${tour.id}`}
                      className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      จัดการ
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
