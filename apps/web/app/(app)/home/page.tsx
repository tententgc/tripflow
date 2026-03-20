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
      tour: { include: { _count: { select: { members: true } }, days: { select: { id: true } } } },
    },
    orderBy: { tour: { startDate: 'asc' } },
  })

  const tours = tourMembers.map((tm) => tm.tour)

  const now = new Date()
  const upcoming = tours.filter(t => new Date(t.endDate) >= now)
  const past = tours.filter(t => new Date(t.endDate) < now)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white px-4 pt-safe-top pb-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none animate-float" />
        <div className="absolute top-4 right-28 w-20 h-20 rounded-full bg-violet-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-purple-900/30 blur-3xl pointer-events-none animate-float-reverse" />
        <div className="absolute bottom-4 right-12 w-16 h-16 rounded-full bg-indigo-300/20 blur-xl pointer-events-none" />

        {/* Sparkles */}
        <div className="absolute top-8 right-20 w-1.5 h-1.5 animate-sparkle" style={{ animationDelay: '0s' }}>
          <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-200" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"/>
          </svg>
        </div>
        <div className="absolute top-16 right-8 w-1 h-1 animate-sparkle" style={{ animationDelay: '1.2s' }}>
          <svg viewBox="0 0 24 24" className="w-full h-full text-pink-200" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"/>
          </svg>
        </div>

        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="homedots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#homedots)" />
        </svg>

        <div className="relative flex items-center justify-between pt-6 max-w-5xl mx-auto animate-fade-in">
          <div>
            <p className="text-indigo-200 text-sm font-medium">สวัสดี,</p>
            <h1 className="text-2xl font-bold drop-shadow-sm mt-0.5">{dbUser.name}</h1>
            <p className="text-white/50 text-xs mt-1">{tours.length} ทริป · {upcoming.length} กำลังจะมาถึง</p>
          </div>
          <a href="/profile" className="group">
            {dbUser.avatarUrl ? (
              <img src={dbUser.avatarUrl} alt="" className="w-12 h-12 rounded-2xl ring-2 ring-white/40 shadow-lg group-hover:ring-white/70 transition-all duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center ring-2 ring-white/30 shadow-lg border border-white/20 group-hover:ring-white/60 transition-all duration-300">
                <span className="text-white font-bold text-lg">{dbUser.name[0]}</span>
              </div>
            )}
          </a>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 pb-8 max-w-5xl mx-auto w-full">
        {/* Section title */}
        <div className="flex items-center justify-between mb-4 animate-slide-up delay-1">
          <h2 className="font-bold text-gray-900 text-lg">ทริปของฉัน</h2>
          {tours.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{tours.length} ทริป</span>
          )}
        </div>

        {tours.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🗺️</span>
            </div>
            <p className="text-gray-900 font-bold text-lg">ยังไม่มีทริป</p>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">รอรับคำเชิญจากผู้จัดทัวร์ หรือขอให้ admin เพิ่มคุณเข้าทริป</p>
            {process.env.NODE_ENV === 'development' && <DevSetupButton />}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {upcoming.map((tour, i) => {
              const countdown = getTripCountdown(tour.startDate, tour.endDate)
              const daysCount = tour.days.length
              return (
                <a
                  key={tour.id}
                  href={`/tour/${tour.id}/today`}
                  className={`flex group animate-slide-up`}
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col w-full
                    transition-all duration-300 ease-out shadow-sm
                    group-hover:shadow-[0_12px_40px_-8px_rgba(99,102,241,0.35)]
                    group-hover:-translate-y-2
                    group-hover:border-indigo-200">
                    {/* Cover image */}
                    <div className="aspect-[16/10] bg-gradient-to-br from-indigo-500 to-violet-600 relative flex-shrink-0 overflow-hidden">
                      {tour.coverImageUrl && (
                        <img
                          src={tour.coverImageUrl}
                          alt=""
                          className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      {/* Country badge */}
                      {tour.isChina && (
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/80 text-white backdrop-blur-md font-bold shadow-sm">🇨🇳 China Mode</span>
                        </div>
                      )}

                      {/* Bottom overlay info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-end justify-between">
                          <div className="flex gap-1.5">
                            {tour.countries.map((c) => (
                              <span key={c} className="text-2xl leading-none drop-shadow-lg">{countryFlags[c] ?? '🌍'}</span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 text-white/90">
                            <span className="text-xs font-medium bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">{daysCount} วัน</span>
                            <span className="text-xs font-medium bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">{tour._count.members} คน</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-gray-900 font-bold text-sm leading-snug line-clamp-2 flex-1 group-hover:text-indigo-700 transition-colors duration-300">
                        {tour.title}
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <p className="text-gray-400 text-xs truncate flex items-center gap-1">
                          <span className="text-gray-300">📍</span>
                          {tour.cities.slice(0, 3).join(' · ')}
                        </p>
                        <span className={`text-[11px] font-bold shrink-0 px-2.5 py-1 rounded-full ${
                          countdown.status === 'active'
                            ? 'bg-green-50 text-green-600'
                            : countdown.status === 'completed'
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {countdown.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}

            {/* Past trips — dimmed */}
            {past.map((tour, i) => {
              const countdown = getTripCountdown(tour.startDate, tour.endDate)
              return (
                <a
                  key={tour.id}
                  href={`/tour/${tour.id}/today`}
                  className="flex group animate-slide-up"
                  style={{ animationDelay: `${0.1 + (upcoming.length + i) * 0.08}s` }}
                >
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col w-full
                    transition-all duration-300 ease-out shadow-sm opacity-60 group-hover:opacity-100
                    group-hover:shadow-md group-hover:-translate-y-1">
                    <div className="aspect-[16/10] bg-gray-200 relative flex-shrink-0 overflow-hidden">
                      {tour.coverImageUrl && (
                        <img src={tour.coverImageUrl} alt="" className="w-full h-full object-cover absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-500" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        {tour.countries.map((c) => (
                          <span key={c} className="text-xl leading-none drop-shadow-md">{countryFlags[c] ?? '🌍'}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-gray-900 font-bold text-sm leading-snug line-clamp-2 flex-1">{tour.title}</p>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <p className="text-gray-400 text-xs truncate">{tour.cities.slice(0, 2).join(' · ')}</p>
                        <span className="text-[11px] font-bold shrink-0 px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
                          {countdown.label}
                        </span>
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
