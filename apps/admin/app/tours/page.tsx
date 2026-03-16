import { Metadata } from 'next'

export const metadata: Metadata = { title: 'จัดการทัวร์ — TripFlow Admin' }

const mockTours = [
  {
    id: 't1',
    title: 'ทัวร์จีน ปักกิ่ง-กำแพงเมืองจีน 6 วัน',
    titleEn: 'Beijing Great Wall China Tour 6 Days',
    countries: ['CN'],
    cities: ['ปักกิ่ง'],
    startDate: '2026-04-01',
    endDate: '2026-04-06',
    status: 'PUBLISHED',
    memberCount: 24,
    maxMembers: 30,
    isChina: true,
    tourCode: 'CN2026-04',
  },
  {
    id: 't2',
    title: 'ทัวร์ญี่ปุ่น โตเกียว-โอซาก้า 7 วัน',
    titleEn: 'Tokyo Osaka Japan Tour 7 Days',
    countries: ['JP'],
    cities: ['โตเกียว', 'โอซาก้า'],
    startDate: '2026-05-10',
    endDate: '2026-05-16',
    status: 'DRAFT',
    memberCount: 0,
    maxMembers: 25,
    isChina: false,
    tourCode: null,
  },
]

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'ฉบับร่าง', color: 'bg-gray-100 text-gray-600' },
  PUBLISHED: { label: 'เผยแพร่แล้ว', color: 'bg-green-100 text-green-700' },
  ACTIVE: { label: 'กำลังเดินทาง', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'เสร็จสิ้น', color: 'bg-purple-100 text-purple-700' },
  CANCELLED: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭',
}

export default function ToursPage() {
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
              { href: '/dashboard', label: 'แดชบอร์ด', icon: '📊' },
              { href: '/tours', label: 'จัดการทัวร์', icon: '🗺️', active: true },
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการทัวร์</h1>
              <p className="text-gray-500 text-sm mt-1">{mockTours.length} ทัวร์ทั้งหมด</p>
            </div>
            <a
              href="/tours/new"
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              + สร้างทัวร์ใหม่
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">ทัวร์</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">วันที่</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">สมาชิก</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockTours.map((tour) => {
                  const status = statusLabels[tour.status] ?? { label: tour.status, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {tour.countries.map((c) => (
                              <span key={c} className="text-lg">{countryFlags[c] ?? '🌍'}</span>
                            ))}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{tour.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {tour.isChina && <span className="text-red-500 mr-1">🇨🇳</span>}
                              {tour.tourCode ?? tour.cities.join(', ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tour.startDate} — {tour.endDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tour.memberCount}/{tour.maxMembers ?? '∞'} คน
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/tours/${tour.id}`}
                          className="text-blue-600 text-sm font-medium hover:underline"
                        >
                          จัดการ →
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
