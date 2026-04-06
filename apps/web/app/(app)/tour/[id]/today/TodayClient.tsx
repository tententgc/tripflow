'use client'

import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { Phone, MessageCircle, Hotel, Siren, Plane, Bus, UtensilsCrossed, Shield, User, MapPin, Globe, Landmark, Banknote, Clock, Languages, PhoneCall } from 'lucide-react'

/* ═══ Types ═══ */
interface Activity { id: string; time: string | null; title: string; titleEn: string | null; titleLocal: string | null; description: string | null; category: string; locationName: string | null; address: string | null; addressLocal: string | null; googleMapUrl: string | null; durationMins: number | null; cost: number | null; costCurrency: string | null; costTHB: number | null; tips: string | null; imageUrls: string[] }
interface Transport { id: string; type: string; from: string; fromLocal: string | null; to: string; toLocal: string | null; departTime: string | null; arriveTime: string | null; duration: string | null; lineName: string | null; lineNameLocal: string | null; notes: string | null }
interface Accommodation { name: string; nameLocal: string | null; phone: string | null; checkIn: string | null; checkOut: string | null; wifiName: string | null; wifiPassword: string | null; imageUrl: string | null }
interface Flight { id: string; flightNo: string; airline: string; airlineIata: string | null; fromAirport: string; fromIata: string; toAirport: string; toIata: string; departAt: string; arriveAt: string; departTz: string; arriveTz: string; terminal: string | null; gate: string | null }
interface Announcement { id: string; title: string; content: string; imageUrls: string[]; order: number; isPinned: boolean; createdAt: string }
interface TourData {
  id: string; title: string; startDate: string; endDate: string; isChina: boolean; countries: string[]; primaryCountry: string
  days: Array<{ id: string; dayNumber: number; date: string; title: string; city: string | null; country: string | null; summary: string | null; weatherLat: number | null; weatherLon: number | null; mealBreakfast: boolean; mealLunch: boolean; mealDinner: boolean; activities: Activity[]; transports: Transport[]; accommodation: Accommodation | null }>
  flights: Flight[]
  contacts: Array<{ id: string; name: string; nameLocal: string | null; phone: string | null; wechat: string | null; line: string | null; whatsapp: string | null; type: string; notes: string | null }>
  members: Array<{ user: { name: string } }>
}
interface WeatherDay { date: string; maxTemp: number; minTemp: number; icon: string; desc: string }

/* ═══ Constants ═══ */
const F: Record<string, string> = { CN:'🇨🇳', JP:'🇯🇵', KR:'🇰🇷', TH:'🇹🇭', FR:'🇫🇷', VN:'🇻🇳', IT:'🇮🇹', GB:'🇬🇧', DE:'🇩🇪', SG:'🇸🇬', AU:'🇦🇺', US:'🇺🇸', MY:'🇲🇾', TW:'🇹🇼', HK:'🇭🇰', AE:'🇦🇪', ES:'🇪🇸', CH:'🇨🇭' }
const CN: Record<string, string> = { CN:'จีน', JP:'ญี่ปุ่น', KR:'เกาหลีใต้', FR:'ฝรั่งเศส', VN:'เวียดนาม', IT:'อิตาลี', GB:'สหราชอาณาจักร', DE:'เยอรมนี', SG:'สิงคโปร์', AU:'ออสเตรเลีย', US:'สหรัฐอเมริกา', MY:'มาเลเซีย', AE:'UAE', ES:'สเปน', CH:'สวิตเซอร์แลนด์' }
const CC: Record<string, string> = { CN:'ปักกิ่ง', JP:'โตเกียว', KR:'โซล', FR:'ปารีส', VN:'ฮานอย', IT:'โรม', GB:'ลอนดอน', DE:'เบอร์ลิน', SG:'สิงคโปร์', AU:'แคนเบอร์รา', US:'วอชิงตัน', MY:'กัวลาลัมเปอร์', AE:'อาบูดาบี', ES:'มาดริด', CH:'เบิร์น' }
const CU: Record<string, string> = { CN:'CNY (หยวน)', JP:'JPY (เยน)', KR:'KRW (วอน)', FR:'EUR (ยูโร)', VN:'VND (ด่อง)', IT:'EUR (ยูโร)', GB:'GBP (ปอนด์)', DE:'EUR (ยูโร)', SG:'SGD', AU:'AUD', US:'USD', MY:'MYR', AE:'AED', ES:'EUR (ยูโร)', CH:'CHF (ฟรังก์)' }
const TZ: Record<string, string> = { CN:'UTC+8', JP:'UTC+9', KR:'UTC+9', FR:'UTC+1', VN:'UTC+7', IT:'UTC+1', GB:'UTC+0', DE:'UTC+1', SG:'UTC+8', AU:'UTC+11', US:'UTC-5', MY:'UTC+8', AE:'UTC+4', ES:'UTC+1', CH:'UTC+1' }
const CL: Record<string, string> = { CN:'จีน (普通话)', JP:'ญี่ปุ่น (日本語)', KR:'เกาหลี (한국어)', FR:'ฝรั่งเศส', VN:'เวียดนาม', IT:'อิตาลี', GB:'อังกฤษ', DE:'เยอรมัน', SG:'อังกฤษ/จีน', AU:'อังกฤษ', US:'อังกฤษ', MY:'มาเลย์/อังกฤษ', AE:'อาหรับ/อังกฤษ', ES:'สเปน', CH:'เยอรมัน/ฝรั่งเศส' }
const CE: Record<string, string> = { CN:'110/120', JP:'110/119', KR:'112/119', FR:'112', VN:'113/115', IT:'112', GB:'999', DE:'112', SG:'999', AU:'000', US:'911', MY:'999', AE:'999', ES:'112', CH:'112' }
const catI: Record<string, string> = { SIGHTSEEING:'🏛️', FOOD:'🍜', TRANSPORT:'🚌', ACCOMMODATION:'🏨', SHOPPING:'🛍️', TEMPLE:'⛩️', NATURE:'🌿', NIGHTLIFE:'🌃', PHOTOGRAPHY:'📷', OTHER:'📍' }
const catC: Record<string, string> = { SIGHTSEEING:'#4f46e5', FOOD:'#f97066', TRANSPORT:'#64748b', ACCOMMODATION:'#a855f7', SHOPPING:'#ec4899', TEMPLE:'#f59e0b', NATURE:'#10b981', NIGHTLIFE:'#8b5cf6' }
const catBg: Record<string, string> = { SIGHTSEEING:'#eef2ff', FOOD:'#fff1f0', TRANSPORT:'#f1f5f9', ACCOMMODATION:'#faf5ff', SHOPPING:'#fdf2f8', TEMPLE:'#fffbeb', NATURE:'#ecfdf5', NIGHTLIFE:'#f5f3ff' }
const trI: Record<string, string> = { FLIGHT:'✈️', TRAIN:'🚂', HIGHSPEED_TRAIN:'🚄', SUBWAY:'🚇', BUS:'🚌', TAXI:'🚕', FERRY:'⛴️', CABLE_CAR:'🚡', WALK:'🚶', OTHER:'🚗' }
const wI: Record<string, string> = { Clear:'☀️', Sunny:'☀️', 'Partly cloudy':'⛅', Cloudy:'☁️', Overcast:'☁️', Mist:'🌫️', Fog:'🌫️', 'Light rain':'🌦️', Rain:'🌧️', 'Heavy rain':'🌧️', 'Light drizzle':'🌦️', 'Patchy rain possible':'🌦️', 'Moderate rain':'🌧️', Snow:'🌨️' }
function gw(d: string) { return wI[d] ?? (d.includes('rain') ? '🌧️' : d.includes('cloud') ? '☁️' : '🌤️') }
const owmE: Record<string, string> = { '01d':'☀️', '01n':'🌙', '02d':'⛅', '02n':'⛅', '03d':'☁️', '03n':'☁️', '04d':'☁️', '04n':'☁️', '09d':'🌧️', '09n':'🌧️', '10d':'🌦️', '10n':'🌦️', '11d':'⛈️', '11n':'⛈️', '13d':'🌨️', '13n':'🌨️', '50d':'🌫️', '50n':'🌫️' }
const COUNTRY_EN: Record<string, string> = { CN:'China', JP:'Japan', KR:'South Korea', VN:'Vietnam', FR:'France', IT:'Italy', GB:'UK', DE:'Germany', SG:'Singapore', AU:'Australia', US:'USA', MY:'Malaysia', AE:'UAE', ES:'Spain', CH:'Switzerland', TW:'Taiwan', HK:'Hong Kong', TH:'Thailand', ID:'Indonesia', NZ:'New Zealand' }

/* ═══ Hooks ═══ */
function useCountUp(target: number, dur = 800) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (target <= 0) { setV(0); return }
    let cancelled = false
    const t0 = performance.now()
    const tick = (now: number) => { if (cancelled) return; const p = Math.min((now - t0) / dur, 1); setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick) }
    requestAnimationFrame(tick); return () => { cancelled = true }
  }, [target, dur]); return v
}
function useInView(th = 0.1) { const ref = useRef<HTMLDivElement>(null); const [v, setV] = useState(false); useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setV(true); o.disconnect() } }, { threshold: th }); o.observe(el); return () => o.disconnect() }, [th]); return { ref, v } }
function useWeather(day: TourData['days'][0] | null | undefined, tourStart: string, isChina: boolean) {
  const [days, setDays] = useState<WeatherDay[]>([]); const [loading, setLoading] = useState(false); const [far, setFar] = useState(false)
  const city = day?.city ?? null; const country = day?.country ?? null
  const lat = day?.weatherLat ?? null; const lon = day?.weatherLon ?? null
  useEffect(() => {
    if (!city) return
    const td = new Date(); td.setHours(0,0,0,0); const sd = new Date(tourStart); sd.setHours(0,0,0,0)
    const daysUntil = Math.ceil((sd.getTime() - td.getTime()) / 86400000)
    if (daysUntil > 7) { setFar(true); setDays([]); return }
    setFar(false); setLoading(true)

    if (lat && lon) {
      // Use proper weather API with coordinates (supports China via Caiyun)
      fetch(`/api/weather?lat=${lat}&lon=${lon}&region=${isChina ? 'CHINA' : 'GLOBAL'}`)
        .then(r => { if (!r.ok) throw new Error('api'); return r.json() })
        .then((d: { daily?: Array<{ date: string; tempMax: number; tempMin: number; description: string; icon: string }> }) => {
          setDays((d.daily ?? []).slice(0, 3).map(x => ({ date: x.date, maxTemp: Math.round(x.tempMax), minTemp: Math.round(x.tempMin), icon: owmE[x.icon] ?? '🌤️', desc: x.description })))
        })
        .catch(() => fetchWttr(city, country, setDays))
        .finally(() => setLoading(false))
    } else {
      fetchWttr(city, country, setDays).finally(() => setLoading(false))
    }
  }, [city, country, lat, lon, isChina, tourStart]); return { days, loading, far }
}

function fetchWttr(city: string, country: string | null, setDays: (d: WeatherDay[]) => void) {
  const q = country && COUNTRY_EN[country] ? `${city},${COUNTRY_EN[country]}` : city
  return fetch(`https://wttr.in/${encodeURIComponent(q)}?format=j1`)
    .then(r => r.json())
    .then((d: { weather?: Array<{ date: string; maxtempC: string; mintempC: string; hourly: Array<{ weatherDesc: Array<{ value: string }> }> }> }) => {
      setDays((d.weather ?? []).slice(0, 3).map(x => ({ date: x.date, maxTemp: parseInt(x.maxtempC), minTemp: parseInt(x.mintempC), icon: gw(x.hourly?.[4]?.weatherDesc?.[0]?.value ?? ''), desc: x.hourly?.[4]?.weatherDesc?.[0]?.value ?? '' })))
    })
    .catch(() => {})
}

/* ═══ Playful Primitives ═══ */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, v } = useInView(0.08)
  return <div ref={ref} className={className} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)', transition: `all 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms` }}>{children}</div>
}

function Bubble({ children, className = '', color = 'white' }: { children: React.ReactNode; className?: string; color?: string }) {
  const bg: Record<string, string> = {
    white: 'bg-white', orange: 'bg-white', green: 'bg-white',
    amber: 'bg-amber-50/60', blue: 'bg-white', pink: 'bg-white',
  }
  return (
    <div className={`rounded-2xl overflow-hidden ${bg[color] ?? 'bg-white'} ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
      {children}
    </div>
  )
}

function Tag({ children, emoji, bg, color }: { children: React.ReactNode; emoji?: string; bg: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold"
      style={{ background: bg, color }}>
      {emoji && <span className="text-sm">{emoji}</span>}{children}
    </span>
  )
}

function SectionTitle({ emoji, icon, children }: { emoji?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon ? <span className="text-gray-400">{icon}</span> : <span className="text-xl">{emoji}</span>}
      <h2 className="text-[15px] font-bold" style={{ color: '#1e293b' }}>{children}</h2>
    </div>
  )
}

/* ═══ Main ═══ */
export default function TodayClient({ initialTour, initialAnnouncements, tourId }: {
  initialTour: TourData
  initialAnnouncements: Announcement[]
  tourId: string
}) {
  const tour = initialTour
  const anns = initialAnnouncements
  const [lb, setLb] = useState<string | null>(null)
  // Find current day early so weather uses the right city
  const weatherDay = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    return tour.days.find(d => { const x = new Date(d.date); x.setHours(0, 0, 0, 0); return x.getTime() === now.getTime() }) ?? tour.days[0]
  }, [tour.days])
  const { days: wDays, loading: wLoad, far: wFar } = useWeather(weatherDay, tour.startDate, tour.isChina)

  const { pre, du, cd, td, tn, pc } = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const ts = new Date(tour.startDate); ts.setHours(0, 0, 0, 0)
    const nowMs = now.getTime()
    const isPre = nowMs < ts.getTime()
    const daysUntil = isPre ? Math.ceil((ts.getTime() - nowMs) / 86400000) : 0
    const currentDay = tour.days.find(d => {
      const x = new Date(d.date); x.setHours(0, 0, 0, 0)
      return x.getTime() === nowMs
    }) ?? tour.days[0]
    return {
      pre: isPre,
      du: daysUntil,
      cd: currentDay,
      td: tour.days.length,
      tn: Math.max(0, tour.days.length - 1),
      pc: tour.primaryCountry,
    }
  }, [tour.startDate, tour.days, tour.primaryCountry])

  if (!cd) return <div className="min-h-screen pb-24" style={{ background: '#f8fafc' }}><TopBar title={tour.title} subtitle="ยังไม่มีกำหนดการ" backHref="/home" /><BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} /></div>

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f3f4f6' }}>
      <TopBar
        title={cd.title}
        subtitle={`${F[cd.country ?? ''] ?? '🌍'} ${cd.city ?? ''} · ${new Date(cd.date).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' })}`}
        backHref="/home"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        {/* Full-width: Countdown + Meals */}
        <div className="max-w-3xl mx-auto lg:max-w-none">
          <Reveal>
            <CountdownBubble tour={tour} pre={pre} du={du} cd={cd} td={td} tn={tn} />
          </Reveal>
          {!pre && (cd.mealBreakfast || cd.mealLunch || cd.mealDinner) && (
            <Reveal delay={60}>
              <div className="mt-4"><MealStrip b={cd.mealBreakfast} l={cd.mealLunch} d={cd.mealDinner} /></div>
            </Reveal>
          )}
        </div>

        {/* 2-column grid on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 items-start">

          {/* ═ LEFT ═ */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Flights */}
            {tour.flights.length > 0 && (
              <Reveal delay={80}>
                <SectionTitle emoji="✈️">เที่ยวบิน</SectionTitle>
                <div className="space-y-3">
                  {tour.flights.map(f => <FlightBubble key={f.id} flight={f} />)}
                </div>
              </Reveal>
            )}

            {/* Weather */}
            <Reveal delay={120}>
              <SectionTitle emoji="🌤️">พยากรณ์อากาศ · {cd.city ?? ''}</SectionTitle>
              <WeatherBubble ld={wLoad} far={wFar} days={wDays} tour={tour} />
            </Reveal>

            {/* Announcements */}
            {anns.length > 0 && (
              <Reveal delay={160}>
                <AnnRotator anns={anns} onImg={setLb} tourId={tourId} />
              </Reveal>
            )}

            {/* Plan / Activities */}
            <Reveal delay={200}>
              <PlanSection tour={tour} pre={pre} cd={cd} tourId={tourId} td={td} tn={tn} />
            </Reveal>
          </div>

          {/* ═ RIGHT ═ */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Country */}
            <Reveal delay={100}>
              <SectionTitle emoji="🌏">ข้อมูลประเทศ</SectionTitle>
              <CountryBubble c={pc} china={tour.isChina} />
            </Reveal>

            {/* Contacts */}
            {tour.contacts.length > 0 && (
              <Reveal delay={140}>
                <SectionTitle emoji="📞">ผู้ติดต่อ</SectionTitle>
                <ContactsBubble contacts={tour.contacts} />
              </Reveal>
            )}
          </div>
        </div>
      </div>

      {lb && <Lightbox src={lb} onClose={() => setLb(null)} />}
      <BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}

/* ═══ Countdown ═══ */
function CountdownBubble({ tour, pre, du, cd, td, tn }: { tour: TourData; pre: boolean; du: number; cd: TourData['days'][0]; td: number; tn: number }) {
  const av = useCountUp(du)

  if (!pre) return (
    <Bubble color="green">
      <div className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
          {F[tour.countries[0] ?? ''] ?? '🌍'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">{tour.title}</p>
          <p className="text-[13px] text-emerald-600 font-semibold mt-0.5">{td} วัน {tn} คืน · {tour.members.length} คน</p>
        </div>
        <Tag emoji="🟢" bg="#d1fae5" color="#065f46">Day {cd.dayNumber}</Tag>
      </div>
    </Bubble>
  )

  return (
    <Bubble>
      <div className="p-6 relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #c7d2fe, #a5b4fc)' }}>
              {F[tour.countries[0] ?? ''] ?? '🌍'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-800 truncate text-[15px]">{tour.title}</p>
              <p className="text-[12px] text-primary-600/70 font-semibold">{td} วัน {tn} คืน · {tour.members.length} คน</p>
            </div>
            <Tag emoji="✨" bg="#eef2ff" color="#4338ca">เตรียมตัว</Tag>
          </div>

          <div className="flex items-end gap-3 mt-2">
            <div>
              <p className="text-[12px] font-bold text-primary-400 uppercase tracking-wider mb-1">ออกเดินทางอีก</p>
              <div className="flex items-end gap-1.5">
                <span className="text-[72px] font-black leading-none tabular-nums"
                  style={{ color: '#4f46e5', letterSpacing: '-0.04em' }}>
                  {av}
                </span>
                <span className="text-[22px] font-bold text-primary-300 pb-2">วัน</span>
              </div>
            </div>
            <div className="flex-1 pb-3">
              <div className="text-right text-[12px] font-medium text-primary-400 mb-1">
                {new Date(tour.startDate).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' })}
              </div>
              <div className="h-3 bg-primary-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-[2s]"
                  style={{
                    width: `${Math.min(100, Math.max(8, ((30 - du) / 30) * 100))}%`,
                    background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
                  }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Bubble>
  )
}

/* ═══ Meal Strip ═══ */
function MealStrip({ b, l, d }: { b: boolean; l: boolean; d: boolean }) {
  const meals = [
    b && { emoji: '🌅', label: 'เช้า', accent: '#4f46e5' },
    l && { emoji: '🍱', label: 'กลางวัน', accent: '#10b981' },
    d && { emoji: '🌙', label: 'เย็น', accent: '#f97066' },
  ].filter(Boolean) as { emoji: string; label: string; accent: string }[]

  return (
    <div className="flex gap-2.5">
      {meals.map(m => (
        <div key={m.label} className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', borderLeft: `3px solid ${m.accent}` }}>
          <span className="text-xl">{m.emoji}</span>
          <span className="text-[13px] font-bold text-gray-700">{m.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ═══ Flight ═══ */
const FlightBubble = memo(function FlightBubble({ flight: f }: { flight: Flight }) {
  const { dp, ar, h, m } = useMemo(() => {
    const dep = new Date(f.departAt), arr = new Date(f.arriveAt)
    const ms = arr.getTime() - dep.getTime()
    return { dp: dep, ar: arr, h: Math.floor(ms / 3600000), m: Math.floor((ms % 3600000) / 60000) }
  }, [f.departAt, f.arriveAt])
  const uz = useCallback((tz: string) => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName:'shortOffset' }).formatToParts(new Date())
    return (p.find(x => x.type === 'timeZoneName')?.value ?? '').replace('GMT','UTC')
  }, [])
  return (
    <Bubble color="blue">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-sky-100 flex items-center justify-center p-1.5">
            {f.airlineIata ? <Image src={`https://pics.avs.io/80/80/${f.airlineIata}.png`} alt={f.airline} width={32} height={32} className="object-contain" onError={e => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-lg">✈️</span>' }} unoptimized /> : <span className="text-lg">✈️</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-sky-700">{f.flightNo}</p>
            <p className="text-[12px] text-gray-500">{f.airline}</p>
          </div>
          <Tag bg="#e0f2fe" color="#0369a1">{h}h {m}m</Tag>
        </div>

        <div className="flex items-center">
          <div>
            <p className="text-[28px] font-bold text-gray-800 tabular-nums leading-none">{dp.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', timeZone: f.departTz })}</p>
            <p className="text-[13px] font-bold text-sky-500 mt-1">{f.fromIata}</p>
          </div>
          <div className="flex-1 mx-4 flex items-center">
            <div className="h-0.5 flex-1 bg-sky-200 rounded-full" />
            <span className="mx-2 text-xl">✈️</span>
            <div className="h-0.5 flex-1 bg-sky-200 rounded-full" />
          </div>
          <div className="text-right">
            <p className="text-[28px] font-bold text-gray-800 tabular-nums leading-none">{ar.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', timeZone: f.arriveTz })}</p>
            <p className="text-[13px] font-bold text-sky-500 mt-1">{f.toIata}</p>
          </div>
        </div>

        <div className="mt-4 pt-3 flex flex-wrap items-center gap-2 text-[12px] text-gray-400 font-medium" style={{ borderTop: '1px dashed #e0e7ff' }}>
          <span>{dp.toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</span>
          {f.terminal && <Tag bg="#f1f5f9" color="#475569">Terminal {f.terminal}</Tag>}
          {f.gate && <Tag bg="#f1f5f9" color="#475569">Gate {f.gate}</Tag>}
          <span className="ml-auto tabular-nums">{uz(f.departTz)} → {uz(f.arriveTz)}</span>
        </div>
      </div>
    </Bubble>
  )
})

/* ═══ Weather ═══ */
function WeatherBubble({ ld, far, days, tour }: { ld: boolean; far: boolean; days: WeatherDay[]; tour: TourData }) {
  if (ld) return <Bubble><div className="p-8 flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /><span className="text-[13px] text-gray-400 font-medium">กำลังโหลด...</span></div></Bubble>
  if (far) return (
    <Bubble color="amber">
      <div className="p-5 flex items-center gap-4">
        <span className="text-4xl">🌤️</span>
        <div>
          <p className="text-[14px] font-bold text-amber-800">พยากรณ์จะพร้อมเมื่อใกล้วันเดินทาง</p>
          <p className="text-[12px] text-amber-600 mt-0.5 font-medium">ข้อมูลจะแสดงใน 3 วันก่อนวันที่ {new Date(tour.startDate).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</p>
        </div>
      </div>
    </Bubble>
  )
  if (!days.length) return null
  return (
    <div className="flex gap-2.5">
      {days.slice(0,3).map((w, i) => {
        const md = tour.days.find(d => { const a = new Date(d.date); a.setHours(0,0,0,0); const b = new Date(w.date); b.setHours(0,0,0,0); return a.getTime() === b.getTime() })
        return (
          <Bubble key={w.date} className="flex-1 text-center" color={i === 0 ? 'orange' : 'white'}>
            <div className="p-4">
              <p className="text-[12px] font-bold" style={{ color: i === 0 ? '#4338ca' : '#6b7280' }}>
                {md ? `วันที่ ${md.dayNumber}` : new Date(w.date).toLocaleDateString('th-TH', { weekday:'short' })}
              </p>
              <p className="text-4xl my-2.5">{w.icon}</p>
              <p className="text-[11px] text-gray-500 truncate font-medium mb-2">{w.desc}</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[16px] font-bold text-gray-800">{w.maxTemp}°</span>
                <span className="text-gray-300">/</span>
                <span className="text-[14px] font-bold text-gray-400">{w.minTemp}°</span>
              </div>
            </div>
          </Bubble>
        )
      })}
    </div>
  )
}

/* ═══ Country ═══ */
function CountryBubble({ c, china }: { c: string; china: boolean }) {
  const rows: { icon: React.ReactNode; label: string; val: string }[] = [
    { icon: <Globe size={16} />, label:'ชื่อประเทศ', val:`${F[c] ?? '🌍'} ${CN[c] ?? c}` },
    { icon: <Landmark size={16} />, label:'เมืองหลวง', val: CC[c] ?? '-' },
    { icon: <Banknote size={16} />, label:'สกุลเงิน', val: CU[c] ?? '-' },
    { icon: <Clock size={16} />, label:'เขตเวลา', val: TZ[c] ?? '-' },
    { icon: <Languages size={16} />, label:'ภาษาหลัก', val: CL[c] ?? '-' },
    { icon: <Siren size={16} />, label:'เบอร์ฉุกเฉิน', val: CE[c] ?? '-' },
  ]
  return (
    <Bubble>
      <div className="divide-y divide-gray-100/80">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-gray-500 font-semibold flex items-center gap-2.5">
              <span className="text-gray-400">{r.icon}</span>{r.label}
            </span>
            <span className="text-[14px] font-bold text-gray-700">{r.val}</span>
          </div>
        ))}
        {china && (
          <div className="px-5 py-4" style={{ background: '#fef2f2' }}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇨🇳</span>
              <div>
                <p className="text-[13px] font-bold text-red-700">China Mode เปิดใช้งาน</p>
                <p className="text-[11px] text-red-500 mt-0.5 font-medium">Amap · Qwen · JPush · ไม่ต้อง VPN</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Bubble>
  )
}

/* ═══ Contacts ═══ */
function ContactsBubble({ contacts }: { contacts: TourData['contacts'] }) {
  const tl: Record<string, string> = { THAI_GUIDE:'ไกด์ไทย', LOCAL_GUIDE:'ไกด์ท้องถิ่น', HOTEL:'โรงแรม', EMERGENCY:'ฉุกเฉิน', AIRLINE:'สายการบิน', BUS_OPERATOR:'รถบัส', RESTAURANT:'ร้านอาหาร', INSURANCE:'ประกัน' }
  const typeIcon: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
    THAI_GUIDE:   { icon: <User size={18} />,               bg: '#eef2ff', color: '#4f46e5' },
    LOCAL_GUIDE:  { icon: <MapPin size={18} />,              bg: '#eff6ff', color: '#2563eb' },
    HOTEL:        { icon: <Hotel size={18} />,               bg: '#f5f3ff', color: '#7c3aed' },
    EMERGENCY:    { icon: <Siren size={18} />,               bg: '#fef2f2', color: '#dc2626' },
    AIRLINE:      { icon: <Plane size={18} />,               bg: '#eff6ff', color: '#2563eb' },
    BUS_OPERATOR: { icon: <Bus size={18} />,                 bg: '#f3f4f6', color: '#4b5563' },
    RESTAURANT:   { icon: <UtensilsCrossed size={18} />,     bg: '#eef2ff', color: '#4f46e5' },
    INSURANCE:    { icon: <Shield size={18} />,              bg: '#f0fdf4', color: '#16a34a' },
  }
  const fallback = { icon: <User size={18} />, bg: '#f3f4f6', color: '#6b7280' }

  return (
    <Bubble>
      <div className="divide-y divide-gray-100/80">
        {contacts.map(c => {
          const ti = typeIcon[c.type] ?? fallback
          return (
            <div key={c.id} className="flex items-center gap-3.5 px-5 py-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: ti.bg, color: ti.color }}>
                {ti.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-800 truncate">{c.name}</p>
                <p className="text-[12px] text-gray-500 truncate font-medium">{tl[c.type] ?? 'ติดต่อ'}{c.phone ? ` · ${c.phone}` : ''}</p>
              </div>
              <div className="flex gap-1.5">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                    style={{ background: '#f3f4f6' }}>
                    <PhoneCall size={16} className="text-gray-600" />
                  </a>
                )}
                {c.line && (
                  <a href={`line://ti/p/~${c.line}`} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                    style={{ background: '#06C7551a' }}>
                    <MessageCircle size={16} style={{ color: '#06C755' }} />
                  </a>
                )}
                {c.wechat && (
                  <button onClick={() => navigator.clipboard.writeText(c.wechat!)} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                    style={{ background: '#07C1601a' }}>
                    <MessageCircle size={16} style={{ color: '#07C160' }} />
                  </button>
                )}
                {c.whatsapp && (
                  <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9+]/g,'')}`} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                    style={{ background: '#25D3661a' }}>
                    <Phone size={16} style={{ color: '#25D366' }} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Bubble>
  )
}

/* ═══ Plan ═══ */
function PlanSection({ tour, pre, cd, tourId, td, tn }: { tour: TourData; pre: boolean; cd: TourData['days'][0]; tourId: string; td: number; tn: number }) {
  if (pre) return (
    <>
      <SectionTitle emoji="🗓️">แพลนการเดินทาง ({td} วัน {tn} คืน)</SectionTitle>
      <Bubble>
        <div className="divide-y divide-gray-100/80">
          {tour.days.map(day => (
            <a key={day.id} href={`/tour/${tourId}/day/${day.dayNumber}`}
              className="flex items-center gap-3.5 px-5 py-4 hover:bg-primary-50/40 transition-colors no-btn-fx opacity-100 hover:opacity-100">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[13px] font-black"
                style={{ background: 'linear-gradient(135deg, #eef2ff, #c7d2fe)', color: '#4338ca' }}>
                D{day.dayNumber}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-800 truncate">{day.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[12px] text-gray-500 font-medium">
                  {day.city && <span>{F[day.country ?? ''] ?? '📍'} {day.city}</span>}
                  <span>{new Date(day.date).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex gap-1">{day.mealBreakfast && <span>🌅</span>}{day.mealLunch && <span>🍱</span>}{day.mealDinner && <span>🌙</span>}</div>
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </div>
            </a>
          ))}
        </div>
      </Bubble>
    </>
  )

  return (
    <>
      <SectionTitle emoji="📋">แพลนวันที่ {cd.dayNumber} — {cd.city ?? ''}</SectionTitle>
      <Bubble>
        {/* Day header with meals */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <div>
            <p className="font-bold text-gray-800 text-[15px]">{cd.title}</p>
            <p className="text-[12px] text-gray-500 mt-0.5 font-medium">{new Date(cd.date).toLocaleDateString('th-TH', { weekday:'long', day:'numeric', month:'long' })}</p>
          </div>
          <div className="flex gap-1.5">
            {cd.mealBreakfast && <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm" style={{ background: '#eef2ff' }}>🌅</span>}
            {cd.mealLunch && <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm" style={{ background: '#f0fdf4' }}>🍱</span>}
            {cd.mealDinner && <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm" style={{ background: '#fef3c7' }}>🌙</span>}
          </div>
        </div>

        {/* Activities timeline */}
        {cd.activities.length === 0 ? (
          <div className="py-12 text-center">
            <span className="text-4xl">🏖️</span>
            <p className="text-[14px] text-gray-400 mt-3 font-medium">วันอิสระ ไม่มีกิจกรรม</p>
          </div>
        ) : (
          <div className="p-5">
            {cd.activities.map((a, i) => (
              <div key={a.id} className="flex gap-3.5 group/i">
                {/* Timeline */}
                <div className="flex flex-col items-center pt-1.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover/i:scale-110"
                    style={{ background: catBg[a.category] ?? '#f3f4f6' }}>
                    {catI[a.category] ?? '📍'}
                  </div>
                  {i < cd.activities.length - 1 && <div className="w-0.5 flex-1 mt-1.5 min-h-[12px] rounded-full" style={{ background: `${catC[a.category] ?? '#d1d5db'}33` }} />}
                </div>
                {/* Content */}
                <div className="pb-5 flex-1 min-w-0">
                  {a.time && <p className="text-[12px] font-bold tabular-nums mb-0.5" style={{ color: catC[a.category] ?? '#6b7280' }}>{a.time}</p>}
                  <p className="text-[14px] font-bold text-gray-800">{a.title}</p>
                  {a.titleLocal && <p className="text-[12px] text-gray-500 mt-0.5 font-medium">{a.titleLocal}</p>}
                  {a.locationName && (
                    a.googleMapUrl ? (
                      <a href={a.googleMapUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[12px] text-blue-600 mt-1 font-medium flex items-center gap-1 hover:underline">
                        📍 {a.locationName} <span className="text-[10px]">↗</span>
                      </a>
                    ) : (
                      <p className="text-[12px] text-gray-500 mt-1 font-medium flex items-center gap-1">📍 {a.locationName}</p>
                    )
                  )}
                  {a.cost != null && a.cost > 0 && (
                    <Tag bg="#fef3c7" color="#92400e">
                      💰 {a.costCurrency ?? ''} {a.cost}{a.costTHB ? ` (≈฿${a.costTHB})` : ''}
                    </Tag>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transports */}
        {cd.transports.length > 0 && (
          <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider pt-4 mb-3">🚌 การเดินทาง</p>
            {cd.transports.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3.5 rounded-2xl mb-2"
                style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.04)' }}>
                <span className="text-xl">{trI[t.type] ?? '🚗'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-800 truncate">{t.from} → {t.to}</p>
                  <div className="flex gap-3 mt-0.5 text-[12px] text-gray-500 font-medium">
                    {t.departTime && <span>ออก {t.departTime}</span>}
                    {t.duration && <span>{t.duration}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Accommodation */}
        {cd.accommodation && (
          <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider pt-4 mb-3">🏨 ที่พักคืนนี้</p>
            <div className="flex items-start gap-3">
              {cd.accommodation.imageUrl && (
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 relative">
                  <Image src={cd.accommodation.imageUrl} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-gray-800">{cd.accommodation.name}</p>
                {cd.accommodation.nameLocal && <p className="text-[12px] text-gray-500">{cd.accommodation.nameLocal}</p>}
                {(cd.accommodation.checkIn || cd.accommodation.checkOut) && (
                  <p className="text-[12px] text-gray-500 mt-1 font-medium">
                    {cd.accommodation.checkIn && `Check-in: ${cd.accommodation.checkIn}`}
                    {cd.accommodation.checkIn && cd.accommodation.checkOut && ' · '}
                    {cd.accommodation.checkOut && `Check-out: ${cd.accommodation.checkOut}`}
                  </p>
                )}
                {cd.accommodation.wifiName && (
                  <div className="mt-2 inline-flex items-center gap-2 text-[12px] text-blue-700 font-bold bg-blue-50 px-3 py-2 rounded-xl">
                    📶 {cd.accommodation.wifiName}
                    {cd.accommodation.wifiPassword && <span className="text-blue-500 font-medium">| {cd.accommodation.wifiPassword}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="p-5 pt-0">
          <a href={`/tour/${tourId}/day/${cd.dayNumber}`}
            className="flex items-center justify-center w-full h-12 rounded-2xl text-[14px] font-bold transition-all active:scale-[0.98] no-btn-fx opacity-100 hover:opacity-100"
            style={{ background: 'linear-gradient(135deg, #f97316, #4f46e5)', color: '#fff', boxShadow: '0 4px 14px rgba(249,115,22,0.25)' }}>
            ดูรายละเอียดเต็ม วันที่ {cd.dayNumber} →
          </a>
        </div>
      </Bubble>
    </>
  )
}

/* ═══ Announcements ═══ */
function AnnRotator({ anns, onImg, tourId }: { anns: Announcement[]; onImg: (s: string) => void; tourId: string }) {
  const [idx, setIdx] = useState(0), [fade, setFade] = useState(true), [all, setAll] = useState(false)
  const total = anns.length
  useEffect(() => { if (total <= 1) return; const t = setInterval(() => { setFade(false); setTimeout(() => { setIdx(p => (p + 1) % total); setFade(true) }, 200) }, 10000); return () => clearInterval(t) }, [total])
  const go = useCallback((i: number) => { setFade(false); setTimeout(() => { setIdx(i); setFade(true) }, 200) }, [])
  const a = anns[idx]; if (!a) return null
  return (
    <div>
      <SectionTitle emoji="📢">ประกาศจากผู้จัดทัวร์ ({total})</SectionTitle>
      <div style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(6px)', transition: 'all 0.3s ease' }}>
        <AnnCard a={a} onImg={onImg} />
      </div>
      <div className="flex items-center justify-between mt-3">
        {total > 1 ? <div className="flex gap-1.5">{anns.map((_, i) => <button key={i} onClick={() => go(i)} className="no-btn-fx rounded-full transition-all duration-300" style={{ width: i === idx ? 24 : 8, height: 8, background: i === idx ? '#f97316' : '#e5e7eb', borderRadius: 4 }} />)}</div> : <div />}
        <button onClick={() => setAll(true)} className="text-[12px] font-bold text-primary-600 hover:text-primary-800 no-btn-fx flex items-center gap-1">
          ดูทั้งหมด <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>
      {all && typeof document !== 'undefined' && createPortal(<AnnModal anns={anns} onClose={() => setAll(false)} onImg={onImg} />, document.body)}
    </div>
  )
}

function AnnCard({ a, onImg }: { a: Announcement; onImg: (s: string) => void }) {
  const [exp, setExp] = useState(false); const ref = useRef<HTMLParagraphElement>(null); const [cl, setCl] = useState(false)
  useEffect(() => { const el = ref.current; if (el) setCl(el.scrollHeight > el.clientHeight + 2) }, [a.content, exp])
  return (
    <Bubble color={a.isPinned ? 'amber' : 'white'}>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{a.isPinned ? '📌' : '📋'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-bold text-gray-800 truncate">{a.title}</h3>
              {a.isPinned && <Tag bg="#fef3c7" color="#92400e">📌</Tag>}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{new Date(a.createdAt).toLocaleDateString('th-TH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
          </div>
        </div>
        <p ref={ref} className="text-[14px] text-gray-700 whitespace-pre-line leading-relaxed font-medium" style={!exp ? { display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' as const, overflow:'hidden' } : {}}>{a.content}</p>
        {(cl || exp) && <button onClick={() => setExp(v => !v)} className="text-[12px] font-bold text-primary-600 mt-2 no-btn-fx">{exp ? 'ย่อ' : 'ดูเพิ่มเติม'}</button>}
        {a.imageUrls.length > 0 && <div className="flex gap-2 mt-3 overflow-x-auto pb-1">{a.imageUrls.map((u, i) => <button key={i} onClick={() => onImg(u)} className="flex-shrink-0 w-28 h-20 rounded-2xl overflow-hidden no-btn-fx"><img src={u} alt="" className="w-full h-full object-cover" /></button>)}</div>}
      </div>
    </Bubble>
  )
}

function AnnModal({ anns, onClose, onImg }: { anns: Announcement[]; onClose: () => void; onImg: (s: string) => void }) {
  const [closing, setCl] = useState(false); const close = useCallback(() => { setCl(true); setTimeout(onClose, 250) }, [onClose])
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [close])
  return (
    <><style>{`@keyframes mdIn { from{opacity:0} to{opacity:1} } @keyframes mdOut { from{opacity:1} to{opacity:0} } @keyframes mdPop { from{opacity:0;transform:translate(-50%,-50%) scale(.92)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} } @keyframes mdPopOut { from{opacity:1;transform:translate(-50%,-50%) scale(1)} to{opacity:0;transform:translate(-50%,-50%) scale(.92)} }`}</style>
    <div onClick={close} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', animation:`${closing?'mdOut':'mdIn'} .25s ease both` }} />
    <div onClick={e => e.stopPropagation()} style={{ position:'fixed', zIndex:201, top:'50%', left:'50%', width:'92vw', maxWidth:'480px', maxHeight:'75vh', borderRadius:'24px', overflow:'hidden', background:'#fff', boxShadow:'0 32px 80px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column' as const, animation:`${closing?'mdPopOut':'mdPop'} .3s cubic-bezier(.34,1.56,.64,1) both` }}>
      <div className="flex-shrink-0 px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#eef2ff' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">📢</span>
          <div>
            <h2 className="text-[16px] font-bold text-gray-800">ประกาศทั้งหมด</h2>
            <p className="text-[12px] text-primary-600 font-bold mt-0.5">{anns.length} ประกาศ</p>
          </div>
        </div>
        <button onClick={close} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center no-btn-fx text-gray-500 hover:text-gray-800 transition-colors active:scale-95" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-3">
        {anns.map(a => (
          <Bubble key={a.id} color={a.isPinned ? 'amber' : 'white'}>
            <div className="p-4">
              <div className="flex items-start gap-2.5 mb-2">
                <span className="text-lg">{a.isPinned ? '📌' : '📋'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-gray-800">{a.title}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{new Date(a.createdAt).toLocaleDateString('th-TH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                </div>
              </div>
              <p className="text-[13px] text-gray-700 whitespace-pre-line leading-relaxed font-medium">{a.content}</p>
              {a.imageUrls.length > 0 && <div className="flex gap-2 mt-3 overflow-x-auto pb-1">{a.imageUrls.map((u, j) => <button key={j} onClick={() => onImg(u)} className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden no-btn-fx"><img src={u} alt="" className="w-full h-full object-cover" /></button>)}</div>}
            </div>
          </Bubble>
        ))}
      </div>
    </div></>
  )
}

/* ═══ Lightbox ═══ */
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [cl, setCl] = useState(false); const close = useCallback(() => { setCl(true); setTimeout(onClose, 150) }, [onClose])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [close])
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={close} style={{ animation: cl ? 'mdOut .15s ease forwards' : 'mdIn .2s ease forwards' }}>
      <button onClick={e => { e.stopPropagation(); close() }} className="absolute top-4 right-4 w-11 h-11 rounded-full text-white text-xl hover:bg-white/10 transition-colors no-btn-fx flex items-center justify-center">✕</button>
      <img src={src} alt="" onClick={e => e.stopPropagation()} className="rounded-2xl max-w-[90vw] max-h-[85vh] object-contain" style={{ animation: cl ? 'mdPopOut .15s ease forwards' : 'mdPop .2s ease forwards' }} />
    </div>
  )
}
