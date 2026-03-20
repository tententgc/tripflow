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

  const tourMembers = await db.tourMember.findMany({
    where: { userId: dbUser.id },
    include: {
      tour: { include: { _count: { select: { members: true } } } },
    },
    orderBy: { tour: { startDate: 'asc' } },
  })

  const tours = tourMembers.map((tm) => tm.tour)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white px-4 pt-safe-top pb-8 relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-24 w-20 h-20 rounded-full bg-violet-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-purple-900/30 blur-2xl pointer-events-none" />
        <div className="absolute bottom-2 right-8 w-16 h-16 rounded-full bg-indigo-300/20 blur-xl pointer-events-none" />
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="homedots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#homedots)" />
        </svg>

        <div className="relative flex items-center justify-between pt-4 max-w-5xl mx-auto">
          <div>
            <p className="text-indigo-200 text-sm">สวัสดี,</p>
            <h1 className="text-xl font-bold drop-shadow-sm">{dbUser.name}</h1>
          </div>
          <a href="/profile">
            {dbUser.avatarUrl ? (
              <img src={dbUser.avatarUrl} alt="" className="w-10 h-10 rounded-full ring-2 ring-white/40 shadow-lg" />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30 shadow-lg border border-white/20">
                <span className="text-white font-semibold">{dbUser.name[0]}</span>
              </div>
            )}
          </a>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4 max-w-5xl mx-auto w-full">
        <h2 className="font-semibold text-gray-900 text-lg">ทริปของฉัน</h2>

        {tours.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-gray-900 font-semibold">ยังไม่มีทริป</p>
            <p className="text-gray-500 text-sm mt-1">รอรับคำเชิญจากผู้จัดทัวร์</p>
            {process.env.NODE_ENV === 'development' && <DevSetupButton />}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {tours.map((tour) => {
              const countdown = getTripCountdown(tour.startDate, tour.endDate)
              return (
                <a key={tour.id} href={`/tour/${tour.id}/today`} className="flex group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col w-full
                    transition-all duration-300 ease-out
                    shadow-sm
                    group-hover:shadow-[0_8px_40px_-4px_rgba(99,102,241,0.45),0_0_0_1px_rgba(99,102,241,0.15)]
                    group-hover:-translate-y-1.5
                    group-hover:border-indigo-200">
                    {/* Cover image */}
                    <div className="aspect-[16/10] bg-gradient-to-br from-indigo-500 to-violet-600 relative flex-shrink-0 overflow-hidden">
                      {tour.coverImageUrl && (
                        <img
                          src={tour.coverImageUrl}
                          alt=""
                          className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                      {tour.isChina && (
                        <div className="absolute top-3 right-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm font-medium">🇨🇳 CN</span>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        {tour.countries.map((c) => (
                          <span key={c} className="text-xl leading-none drop-shadow-md">{countryFlags[c] ?? '🌍'}</span>
                        ))}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-gray-900 font-semibold text-sm leading-snug line-clamp-2 flex-1">{tour.title}</p>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <p className="text-gray-400 text-xs truncate">{tour.cities.slice(0, 2).join(' · ')}</p>
                        <p className={`text-xs font-semibold shrink-0 ${
                          countdown.status === 'active' ? 'text-green-600' :
                          countdown.status === 'completed' ? 'text-gray-400' :
                          'text-indigo-600'
                        }`}>
                          {countdown.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
