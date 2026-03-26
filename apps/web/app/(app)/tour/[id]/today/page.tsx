'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi } from '@/lib/swr'

/* ═══ Types ═══ */
interface Activity { id: string; time: string | null; title: string; titleEn: string | null; titleLocal: string | null; description: string | null; category: string; locationName: string | null; address: string | null; addressLocal: string | null; durationMins: number | null; cost: number | null; costCurrency: string | null; costTHB: number | null; tips: string | null; imageUrls: string[] }
interface Transport { id: string; type: string; from: string; fromLocal: string | null; to: string; toLocal: string | null; departTime: string | null; arriveTime: string | null; duration: string | null; lineName: string | null; lineNameLocal: string | null; notes: string | null }
interface Accommodation { name: string; nameLocal: string | null; phone: string | null; checkIn: string | null; checkOut: string | null; wifiName: string | null; wifiPassword: string | null; imageUrl: string | null }
interface Flight { id: string; flightNo: string; airline: string; airlineIata: string | null; fromAirport: string; fromIata: string; toAirport: string; toIata: string; departAt: string; arriveAt: string; departTz: string; arriveTz: string; terminal: string | null; gate: string | null }
interface Announcement { id: string; title: string; content: string; imageUrls: string[]; order: number; isPinned: boolean; createdAt: string }
interface TourData {
  id: string; title: string; startDate: string; endDate: string; isChina: boolean; countries: string[]; primaryCountry: string
  days: Array<{ id: string; dayNumber: number; date: string; title: string; city: string | null; country: string | null; summary: string | null; mealBreakfast: boolean; mealLunch: boolean; mealDinner: boolean; activities: Activity[]; transports: Transport[]; accommodation: Accommodation | null }>
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
const catC: Record<string, string> = { SIGHTSEEING:'#2563eb', FOOD:'#ea580c', TRANSPORT:'#6b7280', ACCOMMODATION:'#7c3aed', SHOPPING:'#db2777', TEMPLE:'#ca8a04', NATURE:'#16a34a', NIGHTLIFE:'#9333ea' }
const trI: Record<string, string> = { FLIGHT:'✈️', TRAIN:'🚂', HIGHSPEED_TRAIN:'🚄', SUBWAY:'🚇', BUS:'🚌', TAXI:'🚕', FERRY:'⛴️', CABLE_CAR:'🚡', WALK:'🚶', OTHER:'🚗' }
const wI: Record<string, string> = { Clear:'☀️', Sunny:'☀️', 'Partly cloudy':'⛅', Cloudy:'☁️', Overcast:'☁️', Mist:'🌫️', Fog:'🌫️', 'Light rain':'🌦️', Rain:'🌧️', 'Heavy rain':'🌧️', 'Light drizzle':'🌦️', 'Patchy rain possible':'🌦️', 'Moderate rain':'🌧️', Snow:'🌨️' }
function gw(d: string) { return wI[d] ?? (d.includes('rain') ? '🌧️' : d.includes('cloud') ? '☁️' : '🌤️') }

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
function useWeather(city: string | null, start: string | null) {
  const [days, setDays] = useState<WeatherDay[]>([]); const [loading, setLoading] = useState(false); const [far, setFar] = useState(false)
  useEffect(() => {
    if (!city || !start) return; const td = new Date(); td.setHours(0,0,0,0); const sd = new Date(start); sd.setHours(0,0,0,0)
    if (Math.ceil((sd.getTime() - td.getTime()) / 86400000) > 3) { setFar(true); setDays([]); return }
    setFar(false); setLoading(true)
    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`).then(r => r.json()).then((d: { weather?: Array<{ date: string; maxtempC: string; mintempC: string; hourly: Array<{ weatherDesc: Array<{ value: string }> }> }> }) => {
      setDays((d.weather ?? []).map(x => ({ date: x.date, maxTemp: parseInt(x.maxtempC), minTemp: parseInt(x.mintempC), icon: gw(x.hourly?.[4]?.weatherDesc?.[0]?.value ?? ''), desc: x.hourly?.[4]?.weatherDesc?.[0]?.value ?? '' })).filter(x => new Date(x.date).getTime() >= sd.getTime()))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [city, start]); return { days, loading, far }
}

/* ═══ UI Primitives ═══ */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, v } = useInView(0.08)
  return <div ref={ref} className={className} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(28px)', transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>{children}</div>
}
function Card({ children, className = '', accent }: { children: React.ReactNode; className?: string; accent?: string }) {
  const ac: Record<string, string> = { indigo: 'from-indigo-500 to-violet-500', emerald: 'from-emerald-500 to-teal-500', amber: 'from-amber-500 to-orange-500', violet: 'from-violet-500 to-purple-500' }
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 ${className}`}>
      {accent && <div className={`h-1 bg-gradient-to-r ${ac[accent] ?? ''}`} />}
      {children}
    </div>
  )
}
function Sec({ children, color = 'indigo' }: { children: React.ReactNode; color?: string }) {
  const dc: Record<string, string> = { indigo:'bg-indigo-600', emerald:'bg-emerald-600', amber:'bg-amber-500', violet:'bg-violet-600', red:'bg-red-500' }
  const lc: Record<string, string> = { indigo:'from-indigo-300', emerald:'from-emerald-300', amber:'from-amber-300', violet:'from-violet-300', red:'from-red-300' }
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-2.5 h-2.5 rounded-full ${dc[color] ?? 'bg-gray-500'} shadow-md`} />
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{children}</h2>
      <div className={`flex-1 h-0.5 bg-gradient-to-r ${lc[color] ?? 'from-gray-300'} to-transparent rounded-full`} />
    </div>
  )
}

/* ═══ Main ═══ */
export default function TodayPage() {
  const { id: tourId } = useParams() as { id: string }
  const { data: tour, isLoading } = useApi<TourData>(`/api/tours/${tourId}`)
  const { data: annRaw } = useApi<Announcement[]>(`/api/tours/${tourId}/announcements`)
  const anns = Array.isArray(annRaw) ? annRaw : []
  const [lb, setLb] = useState<string | null>(null)
  const wCity = tour?.days?.[0]?.city ?? null, wStart = tour?.startDate ?? null
  const { days: wDays, loading: wLoad, far: wFar } = useWeather(wCity, wStart)

  if (isLoading) return <div className="min-h-screen bg-gray-50 animate-pulse"><div className="bg-white border-b-2 border-gray-200 px-4 py-4"><div className="h-5 w-48 bg-gray-200 rounded" /></div><div className="p-5 space-y-4"><div className="h-36 bg-white rounded-2xl border border-gray-200" /><div className="h-48 bg-white rounded-2xl border border-gray-200" /></div></div>
  if (!tour) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">ไม่พบทริปนี้</p></div>

  const now = new Date(); now.setHours(0,0,0,0)
  const ts = new Date(tour.startDate); ts.setHours(0,0,0,0)
  const pre = now < ts
  const du = pre ? Math.ceil((ts.getTime() - now.getTime()) / 86400000) : 0
  const cd = tour.days.find(d => { const x = new Date(d.date); x.setHours(0,0,0,0); return x.getTime() === now.getTime() }) ?? tour.days[0]
  if (!cd) return <div className="min-h-screen bg-gray-50 pb-24"><TopBar title={tour.title} subtitle="ยังไม่มีกำหนดการ" backHref="/home" /><BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} /></div>
  const td = tour.days.length, tn = Math.max(0, td - 1), pc = tour.primaryCountry

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 pb-24">
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }`}</style>
      <TopBar title={cd.title} subtitle={`${F[cd.country ?? ''] ?? '🌍'} ${cd.city ?? ''} · ${new Date(cd.date).toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' })}`} backHref="/home" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ═ LEFT ═ */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1 Countdown */}
            <Reveal><CountdownCard tour={tour} pre={pre} du={du} cd={cd} td={td} tn={tn} /></Reveal>
            {/* 2 Flights */}
            {tour.flights.length > 0 && <Reveal delay={80}><Sec color="violet">เที่ยวบิน ({tour.flights.length})</Sec><div className="space-y-4">{tour.flights.map(f => <FlightCard key={f.id} flight={f} />)}</div></Reveal>}
            {/* 3 Weather */}
            <Reveal delay={160}><Sec color="amber">พยากรณ์อากาศ · {cd.city ?? ''}</Sec><WeatherCard ld={wLoad} far={wFar} days={wDays} tour={tour} /></Reveal>
            {/* 4 Announcements */}
            {anns.length > 0 && <Reveal delay={240}><AnnRotator anns={anns} onImg={setLb} tourId={tourId} /></Reveal>}
          </div>

          {/* ═ RIGHT ═ */}
          <div className="lg:col-span-5 space-y-6">
            {/* 5 Country */}
            <Reveal delay={100}><Sec color="emerald">ข้อมูลประเทศ</Sec><CountryCard c={pc} china={tour.isChina} /></Reveal>
            {/* 6 Contacts */}
            {tour.contacts.length > 0 && <Reveal delay={140}><Sec color="indigo">ผู้ติดต่อ ({tour.contacts.length})</Sec><ContactsCard contacts={tour.contacts} /></Reveal>}
            {/* 7 Plan */}
            <Reveal delay={200}><PlanSection tour={tour} pre={pre} cd={cd} tourId={tourId} td={td} tn={tn} /></Reveal>
          </div>
        </div>
      </div>
      {lb && <Lightbox src={lb} onClose={() => setLb(null)} />}
      <BottomNav activeTab="today" tourId={tourId} isChina={tour.isChina} />
    </div>
  )
}

/* ═══ Countdown ═══ */
function CountdownCard({ tour, pre, du, cd, td, tn }: { tour: TourData; pre: boolean; du: number; cd: TourData['days'][0]; td: number; tn: number }) {
  const av = useCountUp(du)
  const pct = Math.min(100, Math.max(5, ((30 - du) / 30) * 100))
  if (!pre) return (
    <Card accent="emerald">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xl">{F[tour.countries[0] ?? ''] ?? '🌍'}</div>
          <div className="min-w-0"><p className="font-medium text-gray-700 truncate">{tour.title}</p><p className="text-xs text-gray-500 mt-0.5 font-medium">{td} วัน {tn} คืน · {tour.members.length} คน</p></div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />Day {cd.dayNumber}/{td}</span>
      </div>
    </Card>
  )
  return (
    <Card accent="indigo">
      <div className="p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(99,102,241,0.08), transparent 70%)' }} />
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-lg">{F[tour.countries[0] ?? ''] ?? '🌍'}</div>
            <div className="min-w-0"><p className="font-medium text-gray-700 truncate text-sm">{tour.title}</p><p className="text-xs text-gray-500 mt-0.5 font-medium">{td} วัน {tn} คืน · {tour.members.length} คน · {new Date(tour.startDate).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</p></div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300"><span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />เตรียมตัว</span>
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">ออกเดินทางอีก</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-7xl sm:text-8xl font-black tabular-nums leading-none" style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', filter:'drop-shadow(0 4px 20px rgba(99,102,241,0.25))' }}>{av}</span>
          <span className="text-lg text-gray-400 pb-2 font-bold">วัน</span>
        </div>
        <div className="mt-5 h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 transition-all duration-[2s] relative" style={{ width: `${pct}%` }}>
            <div className="absolute inset-0 rounded-full" style={{ background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', backgroundSize:'200% 100%', animation:'shimmer 2s linear infinite' }} />
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ═══ Flight ═══ */
function FlightCard({ flight: f }: { flight: Flight }) {
  const dp = new Date(f.departAt), ar = new Date(f.arriveAt), ms = ar.getTime() - dp.getTime()
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  const uz = (tz: string) => { const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName:'shortOffset' }).formatToParts(new Date()); return (p.find(x => x.type === 'timeZoneName')?.value ?? '').replace('GMT','UTC') }
  return (
    <Card accent="indigo">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center p-1.5">
            {f.airlineIata ? <Image src={`https://pics.avs.io/80/80/${f.airlineIata}.png`} alt={f.airline} width={32} height={32} className="object-contain" onError={e => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-lg">✈️</span>' }} unoptimized /> : <span className="text-lg">✈️</span>}
          </div>
          <div className="flex-1 min-w-0"><p className="text-base font-semibold text-indigo-700">{f.flightNo}</p><p className="text-xs text-gray-400">{f.airline}</p></div>
          <span className="text-xs font-medium text-gray-400 tabular-nums bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">{h}h {m}m</span>
        </div>
        <div className="flex items-center">
          <div><p className="text-2xl font-semibold text-gray-800 tabular-nums">{dp.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', timeZone: f.departTz })}</p><p className="text-xs font-medium text-gray-400 mt-0.5">{f.fromIata}</p></div>
          <div className="flex-1 mx-4 h-10"><svg viewBox="0 0 200 40" className="w-full h-full"><path d="M 10 30 Q 100 6 190 30" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5 4" opacity="0.4" /><g transform="translate(93,10) rotate(-8,7,7)"><path d="M7 1L9.5 5.5H14L7 9L0 5.5H4.5L7 1Z" fill="#6366f1" opacity="0.7" /><path d="M4 10L7 8.5L10 10L7 12Z" fill="#6366f1" opacity="0.5" /></g><circle cx="10" cy="30" r="3.5" fill="#6366f1" opacity="0.35" /><circle cx="190" cy="30" r="3.5" fill="#6366f1" opacity="0.35" /></svg></div>
          <div className="text-right"><p className="text-2xl font-semibold text-gray-800 tabular-nums">{ar.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', timeZone: f.arriveTz })}</p><p className="text-xs font-medium text-gray-400 mt-0.5">{f.toIata}</p></div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
          <span>{dp.toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</span>
          {f.terminal && <><span>·</span><span>Terminal {f.terminal}</span></>}
          {f.gate && <><span>·</span><span>Gate {f.gate}</span></>}
          <span className="ml-auto tabular-nums">{uz(f.departTz)} → {uz(f.arriveTz)}</span>
        </div>
      </div>
    </Card>
  )
}

/* ═══ Weather ═══ */
function WeatherCard({ ld, far, days, tour }: { ld: boolean; far: boolean; days: WeatherDay[]; tour: TourData }) {
  if (ld) return <Card><div className="p-6 flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm text-gray-400">กำลังโหลด...</span></div></Card>
  if (far) return <Card><div className="p-5 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl">🌤️</div><div><p className="text-sm font-semibold text-gray-800">พยากรณ์จะพร้อมเมื่อใกล้วันเดินทาง</p><p className="text-xs text-gray-500 mt-1 font-medium">ข้อมูลจะแสดงใน 3 วันก่อนวันที่ {new Date(tour.startDate).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</p></div></div></Card>
  if (!days.length) return null
  return (
    <Card>
      <div className={`grid ${days.length === 1 ? 'grid-cols-1' : days.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {days.slice(0,3).map((w, i) => {
          const md = tour.days.find(d => { const a = new Date(d.date); a.setHours(0,0,0,0); const b = new Date(w.date); b.setHours(0,0,0,0); return a.getTime() === b.getTime() })
          return (
            <div key={w.date} className={`p-5 text-center ${i > 0 ? 'border-l-2 border-gray-100' : ''} hover:bg-indigo-50/30 transition-colors`}>
              <p className={`text-xs font-semibold ${i === 0 ? 'text-indigo-600' : 'text-gray-500'}`}>{md ? `วันที่ ${md.dayNumber}` : new Date(w.date).toLocaleDateString('th-TH', { weekday:'short', day:'numeric' })}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{new Date(w.date).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</p>
              <p className="text-3xl my-2">{w.icon}</p>
              <p className="text-[11px] text-gray-500 truncate mb-2 font-medium">{w.desc}</p>
              <div className="flex items-center justify-center gap-1"><span className="text-sm font-semibold text-gray-800">{w.maxTemp}°</span><span className="text-xs text-gray-300 font-bold">/</span><span className="text-sm font-bold text-gray-400">{w.minTemp}°</span></div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ═══ Country ═══ */
function CountryCard({ c, china }: { c: string; china: boolean }) {
  const rows = [
    { icon:'🌏', label:'ชื่อประเทศ', val:`${F[c] ?? '🌍'} ${CN[c] ?? c}` },
    { icon:'🏛️', label:'เมืองหลวง', val: CC[c] ?? '-' },
    { icon:'💰', label:'สกุลเงิน', val: CU[c] ?? '-' },
    { icon:'🕐', label:'เขตเวลา', val: TZ[c] ?? '-' },
    { icon:'💬', label:'ภาษาหลัก', val: CL[c] ?? '-' },
    { icon:'🚨', label:'เบอร์ฉุกเฉิน', val: CE[c] ?? '-' },
  ]
  return (
    <Card accent="emerald">
      <div className="divide-y divide-gray-100">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between px-5 py-3.5 hover:bg-emerald-50/30 transition-colors">
            <span className="text-xs text-gray-500 font-bold flex items-center gap-2"><span className="text-sm">{r.icon}</span>{r.label}</span>
            <span className="text-sm font-medium text-gray-700">{r.val}</span>
          </div>
        ))}
        {china && <div className="px-5 py-3.5 bg-red-50"><div className="flex items-center gap-2"><span>🇨🇳</span><span className="text-xs font-semibold text-red-700">China Mode เปิดใช้งาน</span></div><p className="text-[11px] text-red-500 mt-1 font-medium">Amap · Qwen · JPush · ไม่ต้อง VPN</p></div>}
      </div>
    </Card>
  )
}

/* ═══ Contacts ═══ */
function ContactsCard({ contacts }: { contacts: TourData['contacts'] }) {
  const ti: Record<string, string> = { THAI_GUIDE:'🇹🇭', LOCAL_GUIDE:'🗺️', HOTEL:'🏨', EMERGENCY:'🚨', AIRLINE:'✈️', BUS_OPERATOR:'🚌', RESTAURANT:'🍽️', INSURANCE:'🛡️' }
  const tl: Record<string, string> = { THAI_GUIDE:'ไกด์ไทย', LOCAL_GUIDE:'ไกด์ท้องถิ่น', HOTEL:'โรงแรม', EMERGENCY:'ฉุกเฉิน', AIRLINE:'สายการบิน', BUS_OPERATOR:'รถบัส', RESTAURANT:'ร้านอาหาร', INSURANCE:'ประกัน' }
  const b = 'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all no-btn-fx active:scale-110 border'
  return (
    <Card>
      <div className="divide-y divide-gray-100">
        {contacts.map(c => (
          <div key={c.id} className="flex items-center gap-3.5 px-5 py-4 hover:bg-indigo-50/30 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-lg">{ti[c.type] ?? '👤'}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p><p className="text-xs text-gray-400 truncate">{tl[c.type] ?? 'ติดต่อ'}{c.phone ? ` · ${c.phone}` : ''}</p></div>
            <div className="flex gap-1.5">
              {c.phone && <a href={`tel:${c.phone}`} className={`${b} bg-gray-100 border-gray-300 hover:bg-gray-200`}><svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg></a>}
              {c.line && <a href={`line://ti/p/~${c.line}`} className={`${b} bg-[#06C755]/15 border-[#06C755]/40 hover:bg-[#06C755]/25`}><span className="text-xs font-black text-[#06C755]">L</span></a>}
              {c.wechat && <button onClick={() => navigator.clipboard.writeText(c.wechat!)} className={`${b} bg-[#07C160]/15 border-[#07C160]/40 hover:bg-[#07C160]/25`}><span className="text-[10px] font-black text-[#07C160]">微</span></button>}
              {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9+]/g,'')}`} className={`${b} bg-[#25D366]/15 border-[#25D366]/40 hover:bg-[#25D366]/25`}><span className="text-xs font-black text-[#25D366]">W</span></a>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ═══ Plan Section ═══ */
function PlanSection({ tour, pre, cd, tourId, td, tn }: { tour: TourData; pre: boolean; cd: TourData['days'][0]; tourId: string; td: number; tn: number }) {
  if (pre) return (
    <><Sec color="violet">แพลนการเดินทาง ({td} วัน {tn} คืน)</Sec>
    <Card accent="violet">
      <div className="divide-y divide-gray-100">
        {tour.days.map(day => (
          <a key={day.id} href={`/tour/${tourId}/day/${day.dayNumber}`} className="flex items-center gap-4 px-5 py-4 hover:bg-violet-50/40 transition-colors no-btn-fx no-card-fx opacity-100 hover:opacity-100">
            <div className="w-11 h-11 rounded-xl bg-violet-100 border border-violet-300 flex items-center justify-center text-xs font-black text-violet-700">D{day.dayNumber}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{day.title}</p><div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">{day.city && <span>{F[day.country ?? ''] ?? '📍'} {day.city}</span>}<span>{new Date(day.date).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}</span></div></div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-0.5">{day.mealBreakfast && <span className="text-xs">🌅</span>}{day.mealLunch && <span className="text-xs">🍱</span>}{day.mealDinner && <span className="text-xs">🌙</span>}</div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </div>
          </a>
        ))}
      </div>
    </Card></>
  )
  return (
    <><Sec color="violet">แพลนวันที่ {cd.dayNumber} — {cd.city ?? ''}</Sec>
    <Card>
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div><p className="font-medium text-gray-700 text-sm">{cd.title}</p><p className="text-xs text-gray-500 mt-0.5 font-medium">{new Date(cd.date).toLocaleDateString('th-TH', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p></div>
        <div className="flex gap-1.5">{cd.mealBreakfast && <span className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-xs">🌅</span>}{cd.mealLunch && <span className="w-8 h-8 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center text-xs">🍱</span>}{cd.mealDinner && <span className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-300 flex items-center justify-center text-xs">🌙</span>}</div>
      </div>
      {cd.activities.length === 0 ? <p className="text-sm text-gray-400 text-center py-10 font-medium">ยังไม่มีกิจกรรม</p> : (
        <div className="p-4">{cd.activities.map((a, i) => (
          <div key={a.id} className="flex gap-3 group/i">
            <div className="flex flex-col items-center pt-1"><div className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-white shadow-md transition-transform group-hover/i:scale-125" style={{ background: catC[a.category] ?? '#9ca3af' }} />{i < cd.activities.length - 1 && <div className="w-0.5 flex-1 mt-1 min-h-[16px] bg-gray-200" />}</div>
            <div className="pb-4 flex-1 min-w-0">
              {a.time && <p className="text-xs font-semibold text-indigo-600 mb-0.5 tabular-nums">{a.time}</p>}
              <p className="text-sm font-semibold text-gray-800">{catI[a.category]} {a.title}</p>
              {a.titleLocal && <p className="text-xs text-gray-500 mt-0.5 font-medium">{a.titleLocal}</p>}
              {a.locationName && <p className="text-xs text-gray-500 mt-1 font-medium">📍 {a.locationName}</p>}
            </div>
          </div>
        ))}</div>
      )}
      {cd.transports.length > 0 && <div className="border-t border-gray-100 p-4"><p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">การเดินทาง</p>{cd.transports.map(t => <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 border border-gray-200 hover:bg-gray-50 transition-colors mb-2"><span className="text-lg">{trI[t.type] ?? '🚗'}</span><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{t.from} → {t.to}</p><div className="flex gap-3 mt-0.5 text-xs text-gray-400">{t.departTime && <span>ออก {t.departTime}</span>}{t.duration && <span>{t.duration}</span>}</div></div></div>)}</div>}
      {cd.accommodation && <div className="border-t border-gray-100 p-4"><p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">🏨 ที่พักคืนนี้</p><div className="flex items-start gap-3">{cd.accommodation.imageUrl && <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative border border-gray-200"><Image src={cd.accommodation.imageUrl} alt="" fill className="object-cover" unoptimized /></div>}<div className="min-w-0"><p className="text-sm font-semibold text-gray-800">{cd.accommodation.name}</p>{cd.accommodation.nameLocal && <p className="text-xs text-gray-400">{cd.accommodation.nameLocal}</p>}{(cd.accommodation.checkIn || cd.accommodation.checkOut) && <p className="text-xs text-gray-500 mt-1 font-medium">{cd.accommodation.checkIn && `Check-in: ${cd.accommodation.checkIn}`}{cd.accommodation.checkIn && cd.accommodation.checkOut && ' · '}{cd.accommodation.checkOut && `Check-out: ${cd.accommodation.checkOut}`}</p>}{cd.accommodation.wifiName && <div className="mt-2 flex items-center gap-2 text-xs text-blue-700 font-bold bg-blue-100 px-3 py-2 rounded-lg border border-blue-300 w-fit">📶 {cd.accommodation.wifiName}{cd.accommodation.wifiPassword && <span className="text-blue-500 font-medium">| {cd.accommodation.wifiPassword}</span>}</div>}</div></div></div>}
      <div className="p-4 pt-0"><a href={`/tour/${tourId}/day/${cd.dayNumber}`} className="flex items-center justify-center w-full h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 text-sm font-semibold text-indigo-600 transition-all group/cta no-btn-fx no-card-fx opacity-100 hover:opacity-100">ดูรายละเอียดเต็ม วันที่ {cd.dayNumber}<span className="ml-2 transition-transform group-hover/cta:translate-x-1">→</span></a></div>
    </Card></>
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
      <Sec color="amber">ประกาศจากผู้จัดทัวร์ ({total})</Sec>
      <div style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.3s ease' }}>
        <AnnCard a={a} onImg={onImg} />
      </div>
      <div className="flex items-center justify-between mt-3">
        {total > 1 ? <div className="flex gap-1.5">{anns.map((_, i) => <button key={i} onClick={() => go(i)} className="no-btn-fx rounded-full transition-all duration-300" style={{ width: i === idx ? 24 : 8, height: 8, background: i === idx ? '#f59e0b' : '#d1d5db' }} />)}</div> : <div />}
        <button onClick={() => setAll(true)} className="text-xs font-medium text-amber-600 hover:text-amber-800 no-btn-fx flex items-center gap-1">ดูประกาศทั้งหมด <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>
      </div>
      {all && typeof document !== 'undefined' && createPortal(<AnnModal anns={anns} onClose={() => setAll(false)} onImg={onImg} />, document.body)}
    </div>
  )
}
function AnnCard({ a, onImg }: { a: Announcement; onImg: (s: string) => void }) {
  const [exp, setExp] = useState(false); const ref = useRef<HTMLParagraphElement>(null); const [cl, setCl] = useState(false)
  useEffect(() => { const el = ref.current; if (el) setCl(el.scrollHeight > el.clientHeight + 2) }, [a.content, exp])
  return (
    <Card className={a.isPinned ? 'ring-2 ring-amber-400' : ''}>
      {a.isPinned && <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />}
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-base">📢</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><h3 className="text-sm font-medium text-gray-700 truncate">{a.title}</h3>{a.isPinned && <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300">📌 ปักหมุด</span>}</div>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{new Date(a.createdAt).toLocaleDateString('th-TH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
          </div>
        </div>
        <p ref={ref} className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-medium" style={!exp ? { display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' as const, overflow:'hidden' } : {}}>{a.content}</p>
        {(cl || exp) && <button onClick={() => setExp(v => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 mt-2 no-btn-fx">{exp ? 'ย่อ' : 'ดูเพิ่มเติม'}</button>}
        {a.imageUrls.length > 0 && <div className="flex gap-2 mt-3 overflow-x-auto pb-1">{a.imageUrls.map((u, i) => <button key={i} onClick={() => onImg(u)} className="flex-shrink-0 w-32 h-20 rounded-xl overflow-hidden no-btn-fx border border-gray-200 hover:border-gray-400 transition-colors"><img src={u} alt="" className="w-full h-full object-cover" /></button>)}</div>}
      </div>
    </Card>
  )
}
function AnnModal({ anns, onClose, onImg }: { anns: Announcement[]; onClose: () => void; onImg: (s: string) => void }) {
  const [closing, setCl] = useState(false); const close = useCallback(() => { setCl(true); setTimeout(onClose, 250) }, [onClose])
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [close])
  return (
    <><style>{`@keyframes mdIn { from{opacity:0} to{opacity:1} } @keyframes mdOut { from{opacity:1} to{opacity:0} } @keyframes mdPop { from{opacity:0;transform:translate(-50%,-50%) scale(.92)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} } @keyframes mdPopOut { from{opacity:1;transform:translate(-50%,-50%) scale(1)} to{opacity:0;transform:translate(-50%,-50%) scale(.92)} }`}</style>
    <div onClick={close} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', animation:`${closing?'mdOut':'mdIn'} .25s ease both` }} />
    <div onClick={e => e.stopPropagation()} style={{ position:'fixed', zIndex:201, top:'50%', left:'50%', width:'92vw', maxWidth:'520px', maxHeight:'75vh', borderRadius:'20px', overflow:'hidden', background:'#fff', border:'1px solid #e5e7eb', boxShadow:'0 32px 80px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column' as const, animation:`${closing?'mdPopOut':'mdPop'} .3s cubic-bezier(.16,1,.3,1) both` }}>
      <div className="flex-shrink-0 px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-amber-200 border border-amber-400 flex items-center justify-center text-xl">📢</div><div><h2 className="text-base font-medium text-gray-700">ประกาศจากผู้จัดทัวร์</h2><p className="text-xs text-gray-500 font-bold mt-0.5">{anns.length} ประกาศ</p></div></div>
        <button onClick={close} className="w-10 h-10 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center no-btn-fx text-gray-500 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
        {anns.map(a => {
          const pin = a.isPinned
          return (
            <div key={a.id} className={`rounded-2xl border p-5 transition-colors ${pin ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="flex items-start gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm border ${pin ? 'bg-amber-200 border-amber-400' : 'bg-gray-100 border-gray-300'}`}>{pin ? '📌' : '📋'}</div>
                <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><h3 className="text-[15px] font-medium text-gray-700">{a.title}</h3>{pin && <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300">ปักหมุด</span>}</div><p className="text-[11px] text-gray-500 mt-0.5 font-medium">{new Date(a.createdAt).toLocaleDateString('th-TH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p></div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-medium">{a.content}</p>
              {a.imageUrls.length > 0 && <div className="flex gap-2 mt-3 overflow-x-auto pb-1">{a.imageUrls.map((u, j) => <button key={j} onClick={() => onImg(u)} className="flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden no-btn-fx border border-gray-200 hover:border-gray-400 transition-colors"><img src={u} alt="" className="w-full h-full object-cover" /></button>)}</div>}
            </div>
          )
        })}
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={close} style={{ animation: cl ? 'mdOut .15s ease forwards' : 'mdIn .2s ease forwards' }}>
      <button onClick={e => { e.stopPropagation(); close() }} className="absolute top-4 right-4 w-10 h-10 rounded-full text-white text-xl hover:bg-white/10 transition-colors no-btn-fx flex items-center justify-center">✕</button>
      <img src={src} alt="" onClick={e => e.stopPropagation()} className="rounded-xl max-w-[90vw] max-h-[85vh] object-contain" style={{ animation: cl ? 'mdPopOut .15s ease forwards' : 'mdPop .2s ease forwards' }} />
    </div>
  )
}
