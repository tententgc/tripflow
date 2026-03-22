import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'
import { getTripCountdown } from '@tripflow/utils'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import DevSetupButton from './DevSetupButton'

export const metadata: Metadata = { title: 'ทริปของฉัน — TripFlow' }
export const dynamic = 'force-dynamic'

const countryFlags: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', TH: '🇹🇭',
  FR: '🇫🇷', IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪',
  SG: '🇸🇬', AU: '🇦🇺', US: '🇺🇸', MY: '🇲🇾',
  TW: '🇹🇼', VN: '🇻🇳', HK: '🇭🇰',
}

export default async function HomePage() {
  const supabase = await createClient()
  const w = console.warn; console.warn = () => {}
  const { data: { session } } = await supabase.auth.getSession()
  console.warn = w
  const user = session?.user
  if (!user) redirect('/login')

  let dbUser = await db.user.findUnique({
    where: { email: user.email! },
    select: { id: true, name: true, email: true, avatarUrl: true },
  })
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0] ?? 'ผู้ใช้',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
      select: { id: true, name: true, email: true, avatarUrl: true },
    })
  }

  const tourMembers = await db.tourMember.findMany({
    where: {
      userId: dbUser.id,
      tour: { status: { in: ['PUBLISHED', 'ACTIVE', 'COMPLETED'] } },
    },
    select: {
      tour: {
        select: {
          id: true, title: true, coverImageUrl: true, countries: true,
          primaryCountry: true, cities: true, startDate: true, endDate: true,
          isChina: true, status: true,
          _count: { select: { members: true } },
          days: { select: { id: true } },
        },
      },
    },
    orderBy: { tour: { startDate: 'asc' } },
    take: 50,
  })

  const tours = tourMembers.map((tm) => tm.tour)

  const now = new Date()
  const upcoming = tours.filter(t => new Date(t.endDate) >= now)
  const past = tours.filter(t => new Date(t.endDate) < now)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 pt-safe-top">
          <div className="flex items-center justify-between py-5 max-w-5xl mx-auto">
            <div>
              <p className="text-gray-400 text-xs font-medium">สวัสดี,</p>
              <h1 className="text-xl font-bold text-gray-900 mt-0.5">{dbUser.name}</h1>
            </div>
            <Link href="/profile">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-50 flex items-center justify-center border border-indigo-100">
                {dbUser.avatarUrl ? (
                  <Image src={dbUser.avatarUrl} alt="" width={40} height={40} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                ) : (
                  <span className="text-indigo-600 font-bold text-sm">{dbUser.name[0]}</span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 pb-8 max-w-5xl mx-auto w-full">
        {/* Quick stats */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-100/60">
            <p className="text-3xl font-black text-indigo-600">{upcoming.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">ทริปที่กำลังจะมาถึง</p>
          </div>
          <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-100/60">
            <p className="text-3xl font-black text-gray-900">{tours.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">ทริปทั้งหมด</p>
          </div>
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-[15px]">ทริปของฉัน</h2>
          <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-indigo-200 via-violet-200 to-transparent" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {upcoming.map((tour, i) => {
              const countdown = getTripCountdown(tour.startDate, tour.endDate)
              const daysCount = tour.days.length
              return (
                <Link
                  key={tour.id}
                  href={`/tour/${tour.id}/today`}
                  className="flex group"
                >
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100/60 overflow-hidden flex flex-col w-full
                    transition-all duration-200 hover:shadow-md hover:border-indigo-200/60 ring-1 ring-transparent hover:ring-indigo-100">
                    {/* Cover */}
                    <div className="aspect-[16/9] bg-gradient-to-br from-indigo-100 to-violet-100 relative flex-shrink-0 overflow-hidden">
                      {tour.coverImageUrl && (
                        <Image src={tour.coverImageUrl} alt="" fill className="object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" unoptimized />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        {tour.countries.map((c) => (
                          <span key={c} className="text-lg drop-shadow-md">{countryFlags[c] ?? '🌍'}</span>
                        ))}
                      </div>
                      {tour.isChina && (
                        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-red-600 font-semibold border border-white/50">CN</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-gray-900 font-semibold text-sm leading-snug line-clamp-2 flex-1 group-hover:text-indigo-600 transition-colors">
                        {tour.title}
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-100/60 flex items-center justify-between gap-2">
                        <p className="text-gray-400 text-xs truncate">
                          {tour.cities.slice(0, 2).join(' · ')} · {daysCount} วัน
                        </p>
                        <span className={`text-[11px] font-semibold shrink-0 ${
                          countdown.status === 'active' ? 'text-emerald-600'
                            : countdown.status === 'completed' ? 'text-gray-400'
                            : 'text-indigo-600'
                        }`}>
                          {countdown.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Past trips */}
            {past.map((tour) => {
              const countdown = getTripCountdown(tour.startDate, tour.endDate)
              return (
                <Link key={tour.id} href={`/tour/${tour.id}/today`} className="flex group">
                  <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-100/40 overflow-hidden flex flex-col w-full
                    transition-all duration-200 opacity-50 group-hover:opacity-80">
                    <div className="aspect-[16/9] bg-gray-100 relative flex-shrink-0 overflow-hidden">
                      {tour.coverImageUrl && (
                        <Image src={tour.coverImageUrl} alt="" fill className="object-cover absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-500" unoptimized />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700 font-semibold text-sm truncate">{tour.title}</p>
                      <p className="text-gray-400 text-xs mt-1">{countdown.label}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
