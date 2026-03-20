import { db } from '@tripflow/database'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'จัดการทัวร์ — TripFlow Admin' }

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'ฉบับร่าง', color: 'bg-gray-100 text-gray-600' },
  PUBLISHED: { label: 'เผยแพร่แล้ว', color: 'bg-green-100 text-green-700' },
  ACTIVE: { label: 'กำลังเดินทาง', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'เสร็จสิ้น', color: 'bg-purple-100 text-purple-700' },
  CANCELLED: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
}

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭', FR: '🇫🇷',
  IT: '🇮🇹', GB: '🇬🇧', SG: '🇸🇬', AU: '🇦🇺', DE: '🇩🇪',
}

export default async function ToursPage() {
  const tours = await db.tour.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { startDate: 'asc' },
  })

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการทัวร์</h1>
          <p className="text-gray-500 text-sm mt-1">{tours.length} ทัวร์ทั้งหมด</p>
        </div>
        <a
          href="/tours/new"
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          + สร้างทัวร์ใหม่
        </a>
      </div>

      {tours.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-5xl mb-4">🗺️</p>
          <p className="font-semibold text-gray-900 text-lg">ยังไม่มีทัวร์</p>
          <p className="text-gray-500 text-sm mt-2 mb-6">เริ่มสร้างทัวร์แรกของคุณได้เลย</p>
          <a href="/tours/new" className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700">
            + สร้างทัวร์ใหม่
          </a>
        </div>
      ) : (
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
              {tours.map((tour) => {
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
                            {tour.isChina && <span className="text-red-500 mr-1">CN Mode</span>}
                            {tour.tourCode ?? tour.cities.join(', ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tour.startDate).toLocaleDateString('th-TH')} — {new Date(tour.endDate).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tour._count.members}/{tour.maxMembers ?? '∞'} คน
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`/tours/${tour.id}`} className="text-blue-600 text-sm font-medium hover:underline">
                        จัดการ →
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
