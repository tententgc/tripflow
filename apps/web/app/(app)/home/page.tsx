import { Metadata } from 'next'

export const metadata: Metadata = { title: 'ทริปของฉัน — TripFlow' }

// Mock data for demonstration
const mockTours = [
  {
    id: 'tour-1',
    title: 'ทัวร์จีน ปักกิ่ง-กำแพงเมืองจีน 6 วัน',
    countries: ['CN'],
    cities: ['ปักกิ่ง', 'กำแพงเมืองจีน'],
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-06'),
    memberCount: 24,
    coverImageUrl: null,
    isChina: true,
    isOfflineCached: false,
    status: 'upcoming' as const,
    daysUntil: 16,
  },
  {
    id: 'tour-2',
    title: 'ทัวร์ญี่ปุ่น โตเกียว-โอซาก้า 7 วัน',
    countries: ['JP'],
    cities: ['โตเกียว', 'โอซาก้า', 'เกียวโต'],
    startDate: new Date('2026-05-10'),
    endDate: new Date('2026-05-16'),
    memberCount: 18,
    coverImageUrl: null,
    isChina: false,
    isOfflineCached: false,
    status: 'upcoming' as const,
    daysUntil: 55,
  },
]

function CountryFlag({ iso2 }: { iso2: string }) {
  const flags: Record<string, string> = {
    CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭',
    FR: '🇫🇷', IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪',
    SG: '🇸🇬', AU: '🇦🇺', US: '🇺🇸', MY: '🇲🇾',
  }
  return <span className="text-xl">{flags[iso2] ?? '🌍'}</span>
}

function TourCard({ tour }: { tour: typeof mockTours[0] }) {
  return (
    <a href={`/tour/${tour.id}/today`} className="block">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform">
        {/* Cover image placeholder */}
        <div className="h-36 bg-gradient-to-br from-primary-400 to-primary-600 relative">
          <div className="absolute inset-0 flex items-end p-4">
            <div className="flex gap-1">
              {tour.countries.map((c) => (
                <CountryFlag key={c} iso2={c} />
              ))}
            </div>
          </div>
          {tour.isChina && (
            <div className="absolute top-3 right-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${tour.isOfflineCached ? 'bg-green-500 text-white' : 'bg-white/80 text-gray-600'}`}>
                {tour.isOfflineCached ? '✓ ออฟไลน์พร้อม' : '🇨🇳 จีน'}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h2 className="font-semibold text-gray-900 text-base leading-snug">{tour.title}</h2>
          <p className="text-gray-500 text-sm mt-1">{tour.cities.join(' • ')}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>👥</span>
              <span>{tour.memberCount} คน</span>
            </div>
            <div>
              {tour.status === 'upcoming' && (
                <span className="text-sm font-medium text-primary-600">
                  ออกเดินทางใน {tour.daysUntil} วัน
                </span>
              )}
              {tour.status === 'active' && (
                <span className="text-sm font-medium text-green-600">
                  กำลังเดินทาง
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 pt-safe-top pb-6">
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-primary-200 text-sm">สวัสดี,</p>
            <h1 className="text-xl font-bold">สมชาย ใจดี</h1>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">ส</span>
          </div>
        </div>
      </div>

      {/* Tours */}
      <div className="px-4 py-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">ทริปของฉัน</h2>
        {mockTours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </div>
  )
}
