'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi, useApiStatic } from '@/lib/swr'

const CURRENCIES: Record<string, { name: string; symbol: string; flag: string }> = {
  CNY: { name: 'หยวนจีน',           symbol: '¥',    flag: '🇨🇳' },
  JPY: { name: 'เยนญี่ปุ่น',         symbol: '¥',    flag: '🇯🇵' },
  KRW: { name: 'วอนเกาหลี',         symbol: '₩',    flag: '🇰🇷' },
  VND: { name: 'ด่องเวียดนาม',       symbol: '₫',    flag: '🇻🇳' },
  SGD: { name: 'ดอลลาร์สิงคโปร์',    symbol: 'S$',   flag: '🇸🇬' },
  MYR: { name: 'ริงกิตมาเลเซีย',     symbol: 'RM',   flag: '🇲🇾' },
  IDR: { name: 'รูเปียห์อินโดนีเซีย', symbol: 'Rp',   flag: '🇮🇩' },
  PHP: { name: 'เปโซฟิลิปปินส์',     symbol: '₱',    flag: '🇵🇭' },
  INR: { name: 'รูปีอินเดีย',        symbol: '₹',    flag: '🇮🇳' },
  TWD: { name: 'ดอลลาร์ไต้หวัน',     symbol: 'NT$',  flag: '🇹🇼' },
  HKD: { name: 'ดอลลาร์ฮ่องกง',      symbol: 'HK$',  flag: '🇭🇰' },
  MMK: { name: 'จ๊าตพม่า',           symbol: 'K',    flag: '🇲🇲' },
  LAK: { name: 'กีบลาว',             symbol: '₭',    flag: '🇱🇦' },
  KHR: { name: 'เรียลกัมพูชา',       symbol: '៛',    flag: '🇰🇭' },
  BDT: { name: 'ตากาบังคลาเทศ',      symbol: '৳',    flag: '🇧🇩' },
  NPR: { name: 'รูปีเนปาล',          symbol: 'Rs',   flag: '🇳🇵' },
  LKR: { name: 'รูปีศรีลังกา',       symbol: 'Rs',   flag: '🇱🇰' },
  EUR: { name: 'ยูโร',               symbol: '€',    flag: '🇪🇺' },
  GBP: { name: 'ปอนด์อังกฤษ',        symbol: '£',    flag: '🇬🇧' },
  CHF: { name: 'ฟรังก์สวิส',          symbol: 'CHF',  flag: '🇨🇭' },
  SEK: { name: 'โครนาสวีเดน',         symbol: 'kr',   flag: '🇸🇪' },
  NOK: { name: 'โครนนอร์เวย์',        symbol: 'kr',   flag: '🇳🇴' },
  DKK: { name: 'โครนเดนมาร์ก',        symbol: 'kr',   flag: '🇩🇰' },
  CZK: { name: 'โครูนาเช็ก',          symbol: 'Kč',   flag: '🇨🇿' },
  PLN: { name: 'ซลอตีโปแลนด์',        symbol: 'zł',   flag: '🇵🇱' },
  HUF: { name: 'ฟอรินต์ฮังการี',      symbol: 'Ft',   flag: '🇭🇺' },
  TRY: { name: 'ลีราตุรกี',           symbol: '₺',    flag: '🇹🇷' },
  RUB: { name: 'รูเบิลรัสเซีย',       symbol: '₽',    flag: '🇷🇺' },
  USD: { name: 'ดอลลาร์สหรัฐ',       symbol: '$',    flag: '🇺🇸' },
  CAD: { name: 'ดอลลาร์แคนาดา',      symbol: 'C$',   flag: '🇨🇦' },
  AUD: { name: 'ดอลลาร์ออสเตรเลีย',  symbol: 'A$',   flag: '🇦🇺' },
  NZD: { name: 'ดอลลาร์นิวซีแลนด์',  symbol: 'NZ$',  flag: '🇳🇿' },
  AED: { name: 'เดอร์แฮม UAE',       symbol: 'د.إ',  flag: '🇦🇪' },
  SAR: { name: 'ริยาลซาอุดีอาระเบีย', symbol: '﷼',    flag: '🇸🇦' },
  QAR: { name: 'ริยาลกาตาร์',        symbol: '﷼',    flag: '🇶🇦' },
  EGP: { name: 'ปอนด์อียิปต์',        symbol: 'E£',   flag: '🇪🇬' },
  ZAR: { name: 'แรนด์แอฟริกาใต้',     symbol: 'R',    flag: '🇿🇦' },
}

const glass = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 20px rgba(0,0,0,0.05)',
} as const

function useCountUp(target: number, duration = 400) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    prev.current = target
    if (target === 0) { setVal(0); return }
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

export default function CalculatorPage() {
  const params = useParams()
  const tourId = params.id as string

  const { data: tourData } = useApi<{ isChina: boolean; destCurrency: string | null }>(`/api/tours/${tourId}?fields=basic`)
  const { data: ratesData, isLoading: loadingRates } = useApiStatic<{ rates: Record<string, number> }>(
    'https://api.exchangerate-api.com/v4/latest/THB',
    { dedupingInterval: 60000 }
  )

  const isChina = tourData?.isChina ?? false
  const [destCurrency, setDestCurrency] = useState('CNY')
  const [destCurrencySet, setDestCurrencySet] = useState(false)

  if (tourData?.destCurrency && !destCurrencySet) {
    setDestCurrency(tourData.destCurrency)
    setDestCurrencySet(true)
  }

  const rates = ratesData?.rates ?? {}
  const [direction, setDirection] = useState<'thb-to-dest' | 'dest-to-thb'>('thb-to-dest')
  const [input, setInput] = useState('')

  const rate = rates[destCurrency] ?? 0
  const inputNum = parseFloat(input.replace(/,/g, '')) || 0

  let result = 0
  let fromLabel = ''
  let toLabel = ''
  const cur = CURRENCIES[destCurrency]

  if (direction === 'thb-to-dest') {
    result = rate > 0 ? inputNum * rate : 0
    fromLabel = 'บาท (THB)'
    toLabel = `${cur?.name ?? destCurrency} (${destCurrency})`
  } else {
    result = rate > 0 ? inputNum / rate : 0
    fromLabel = `${cur?.name ?? destCurrency} (${destCurrency})`
    toLabel = 'บาท (THB)'
  }

  const formatNum = (n: number) =>
    n >= 1 ? n.toLocaleString('th-TH', { maximumFractionDigits: 2 }) : n.toFixed(4)

  const animatedResult = useCountUp(result)
  const quick = [100, 500, 1000, 5000, 10000]
  let cardIdx = 0
  const delay = () => `${(cardIdx++) * 0.06}s`

  return (
    <div className="min-h-screen bg-[#f0f2f8] relative overflow-hidden" style={{ paddingBottom: '100px' }}>
      <style>{`
        @keyframes calcCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)' }} />
      </div>

      <TopBar title="แปลงค่าเงิน" subtitle="อัตราแลกเปลี่ยนวันนี้" />

      <div className="relative z-10 px-4 pt-4 max-w-[680px] mx-auto space-y-3">
        {/* Currency selector */}
        <div className="rounded-[20px] p-4" style={{ ...glass, animation: `calcCardIn 0.3s ease-out ${delay()} both` }}>
          <p className="text-[11px] font-bold uppercase mb-3" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.08em' }}>สกุลเงินปลายทาง</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CURRENCIES).map(([code, info]) => {
              const active = destCurrency === code
              return (
                <button
                  key={code}
                  onClick={() => setDestCurrency(code)}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[20px] text-[12px] font-semibold no-btn-fx transition-all duration-150"
                  style={active ? {
                    background: 'rgba(124,92,252,0.12)',
                    border: '1px solid rgba(124,92,252,0.35)',
                    color: '#7c5cfc',
                    boxShadow: '0 2px 8px rgba(124,92,252,0.15)',
                  } : {
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    color: 'rgba(30,30,60,0.6)',
                  }}
                >
                  <span className="text-[14px]">{info.flag}</span>
                  {code}
                </button>
              )
            })}
          </div>
        </div>

        {/* Direction toggle */}
        <div className="rounded-2xl p-1.5" style={{ ...glass, padding: '6px', animation: `calcCardIn 0.3s ease-out ${delay()} both` }}>
          <div className="flex gap-1.5" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '2px' }}>
            {(['thb-to-dest', 'dest-to-thb'] as const).map((dir) => {
              const active = direction === dir
              const label = dir === 'thb-to-dest' ? `THB → ${destCurrency}` : `${destCurrency} → THB`
              return (
                <button
                  key={dir}
                  onClick={() => setDirection(dir)}
                  className="flex-1 h-10 rounded-xl text-[14px] font-semibold no-btn-fx transition-all duration-200 flex items-center justify-center gap-1.5"
                  style={active ? {
                    background: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    color: '#3d3a5c',
                  } : {
                    background: 'transparent',
                    color: 'rgba(30,30,60,0.35)',
                  }}
                >
                  {dir === 'thb-to-dest' ? 'THB' : destCurrency}
                  <span style={{ color: active ? '#7c5cfc' : 'rgba(30,30,60,0.25)' }}>→</span>
                  {dir === 'thb-to-dest' ? destCurrency : 'THB'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Input */}
        <div className="rounded-[20px] p-5" style={{ ...glass, animation: `calcCardIn 0.3s ease-out ${delay()} both` }}>
          <p className="text-[11px] font-bold uppercase mb-2" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.08em' }}>{fromLabel}</p>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="0"
              className="w-full text-[48px] font-extrabold text-[#1a1a2e] focus:outline-none bg-transparent placeholder:text-[rgba(30,30,60,0.15)]"
              style={{ letterSpacing: '-0.02em', lineHeight: '1.1' }}
            />
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            {quick.map(v => (
              <button
                key={v}
                onClick={() => setInput(String(v))}
                className="h-[34px] px-3.5 rounded-[20px] text-[13px] font-semibold no-btn-fx active:scale-[0.96] transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.85)',
                  color: '#3d3a5c',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.background = 'rgba(124,92,252,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(124,92,252,0.3)'
                  e.currentTarget.style.color = '#7c5cfc'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.6)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.85)'
                  e.currentTarget.style.color = '#3d3a5c'
                }}
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="rounded-[20px] relative overflow-hidden" style={{ ...glass, animation: `calcCardIn 0.3s ease-out ${delay()} both` }}>
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]" style={{ background: 'linear-gradient(to bottom, #10b981, rgba(16,185,129,0.25))' }} />
          <div className="p-5">
            <p className="text-[11px] font-bold uppercase mb-1.5" style={{ color: '#10b981', letterSpacing: '0.08em' }}>{toLabel}</p>
            {loadingRates ? (
              <p className="text-[rgba(30,30,60,0.3)] text-2xl font-bold">กำลังโหลด...</p>
            ) : rate === 0 ? (
              <p className="text-[rgba(30,30,60,0.3)] text-2xl font-bold">ไม่พบอัตรา</p>
            ) : (
              <>
                <p className="text-[48px] font-extrabold text-[#10b981]" style={{ letterSpacing: '-0.02em', lineHeight: '1.1', textShadow: '0 0 24px rgba(16,185,129,0.2)' }}>
                  {direction === 'thb-to-dest' ? cur?.symbol : '฿'}{formatNum(animatedResult)}
                </p>
                <p className="text-[12px] mt-2" style={{ color: 'rgba(30,30,60,0.4)' }}>
                  1 {direction === 'thb-to-dest' ? 'THB' : destCurrency} = {formatNum(direction === 'thb-to-dest' ? rate : 1 / rate)} {direction === 'thb-to-dest' ? destCurrency : 'THB'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Reference table */}
        <div className="rounded-[20px] overflow-hidden" style={{ ...glass, padding: 0, animation: `calcCardIn 0.3s ease-out ${delay()} both` }}>
          <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
            <p className="text-[11px] font-bold uppercase" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.08em' }}>
              ตารางอ้างอิงด่วน (THB → {destCurrency})
            </p>
          </div>
          {[100, 500, 1000, 2000, 5000].map((v, i, arr) => (
            <div
              key={v}
              className="flex justify-between items-center transition-colors duration-150 hover:bg-[rgba(255,255,255,0.4)]"
              style={{
                padding: '12px 20px',
                borderBottom: i < arr.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <span className="text-[14px] font-medium" style={{ color: 'rgba(30,30,60,0.6)' }}>฿{v.toLocaleString()}</span>
              <span className="text-[14px] font-bold text-[#10b981]">{cur?.symbol}{formatNum(v * rate)}</span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav activeTab="calculator" tourId={tourId} isChina={isChina} />
    </div>
  )
}
