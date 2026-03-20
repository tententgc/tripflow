import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'
import { getTripCountdown } from '@tripflow/utils'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import DevSetupButton from './DevSetupButton'

export const metadata: Metadata = { title: 'ทริปของฉัน — TripFlow' }

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭',
  FR: '🇫🇷', IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪',
  SG: '🇸🇬', AU: '🇦🇺', US: '🇺🇸', MY: '🇲🇾',
  TW: '🇹🇼', VN: '🇻🇳', HK: '🇭🇰',
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find or create user in DB
  let dbUser = await db.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0] ?? 'ผู้ใช้',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
    })
  }

  // Get tours for this user
  const tourMembers = await db.tourMember.findMany({
    where: { userId: dbUser.id },
    include: {
      tour: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { tour: { startDate: 'asc' } },
  })

  const tours = tourMembers.map((tm) => tm.tour)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 pt-safe-top pb-6">
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-primary-200 text-sm">สวัสดี,</p>
            <h1 className="text-xl font-bold">{dbUser.name}</h1>
          </div>
          <a href="/profile">
            {dbUser.avatarUrl ? (
              <img src={dbUser.avatarUrl} alt="" className="w-10 h-10 rounded-full ring-2 ring-white/40" />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/40">
                <span className="text-white font-semibold">{dbUser.name[0]}</span>
              </div>
            )}
          </a>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">ทริปของฉัน</h2>

        {tours.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-gray-900 font-semibold">ยังไม่มีทริป</p>
            <p className="text-gray-500 text-sm mt-1">รอรับคำเชิญจากผู้จัดทัวร์</p>
            {process.env.NODE_ENV === 'development' && (
              <DevSetupButton />
            )}
          </div>
        ) : (
          tours.map((tour) => {
            const countdown = getTripCountdown(tour.startDate, tour.endDate)
            return (
              <a key={tour.id} href={`/tour/${tour.id}/today`} className="block">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform">
                  <div className="h-28 bg-gradient-to-br from-primary-400 to-primary-600 relative">
                    {tour.coverImageUrl && (
                      <img src={tour.coverImageUrl} alt="" className="w-full h-full object-cover absolute inset-0" />
                    )}
                    <div className="absolute inset-0 flex items-end p-3">
                      <div className="flex gap-1">
                        {tour.countries.map((c) => (
                          <span key={c} className="text-2xl">{countryFlags[c] ?? '🌍'}</span>
                        ))}
                      </div>
                    </div>
                    {tour.isChina && (
                      <div className="absolute top-2 right-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-white/80 text-gray-600">🇨🇳 China Mode</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-gray-900 text-sm leading-snug">{tour.title}</h2>
                    <p className="text-gray-500 text-xs mt-1">{tour.cities.join(' • ')}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">👥 {tour._count.members} คน</span>
                      <span className={`text-xs font-medium ${countdown.status === 'active' ? 'text-green-600' : countdown.status === 'completed' ? 'text-gray-400' : 'text-primary-600'}`}>
                        {countdown.label}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            )
          })
        )}
      </div>
    </div>
  )
}
