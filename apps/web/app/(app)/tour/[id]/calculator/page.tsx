'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi, useApiStatic } from '@/lib/swr'

const CURRENCIES: Record<string, { name: string; symbol: string; flag: string }> = {
  CNY: { name: 'หยวนจีน',      symbol: '¥',  flag: '🇨🇳' },
  JPY: { name: 'เยนญี่ปุ่น',    symbol: '¥',  flag: '🇯🇵' },
  KRW: { name: 'วอนเกาหลี',    symbol: '₩',  flag: '🇰🇷' },
  EUR: { name: 'ยูโร',          symbol: '€',  flag: '🇪🇺' },
  USD: { name: 'ดอลลาร์สหรัฐ', symbol: '$',  flag: '🇺🇸' },
  GBP: { name: 'ปอนด์อังกฤษ',  symbol: '£',  flag: '🇬🇧' },
  SGD: { name: 'ดอลลาร์สิงคโปร์', symbol: '$', flag: '🇸🇬' },
  HKD: { name: 'ดอลลาร์ฮ่องกง', symbol: '$',  flag: '🇭🇰' },
  AUD: { name: 'ดอลลาร์ออสเตรเลีย', symbol: '$', flag: '🇦🇺' },
  TWD: { name: 'ดอลลาร์ไต้หวัน', symbol: 'NT$', flag: '🇹🇼' },
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

  // Set destCurrency from tour data once loaded
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

  const quick = [100, 500, 1000, 5000, 10000]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 pb-24">
      <TopBar
        title="แปลงค่าเงิน"
        subtitle="อัตราแลกเปลี่ยนวันนี้"
      />

      <div className="px-4 py-4 space-y-3">
        {/* Currency selector */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-indigo-100/40">
          <p className="text-[11px] text-indigo-400 font-semibold uppercase tracking-wider mb-3">สกุลเงินปลายทาง</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CURRENCIES).map(([code, info]) => (
              <button
                key={code}
                onClick={() => setDestCurrency(code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  destCurrency === code
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-200/50'
                    : 'bg-white/60 text-gray-600 border border-gray-100/60 hover:border-indigo-200/50'
                }`}
              >
                <span>{info.flag}</span>
                <span>{code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Direction toggle */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 border border-indigo-100/40 flex gap-2">
          <button
            onClick={() => setDirection('thb-to-dest')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              direction === 'thb-to-dest'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-200/50'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            THB → {destCurrency}
          </button>
          <button
            onClick={() => setDirection('dest-to-thb')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              direction === 'dest-to-thb'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-200/50'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {destCurrency} → THB
          </button>
        </div>

        {/* Input */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-indigo-100/40">
          <p className="text-[11px] text-gray-400 font-medium mb-2">{fromLabel}</p>
          <input
            type="number"
            inputMode="decimal"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="0"
            className="w-full text-3xl font-bold text-gray-900 focus:outline-none placeholder-gray-200 bg-transparent"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            {quick.map(v => (
              <button
                key={v}
                onClick={() => setInput(String(v))}
                className="px-3 py-1 bg-indigo-50/80 border border-indigo-100/60 rounded-lg text-xs text-indigo-600 font-medium hover:bg-indigo-100/50 transition-colors"
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Result — glass with accent */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-200/50 p-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-emerald-100/30 blur-xl" />
          <div className="relative">
            <p className="text-[11px] text-emerald-500 font-semibold mb-1">{toLabel}</p>
            {loadingRates ? (
              <p className="text-gray-400 text-2xl font-bold">กำลังโหลด...</p>
            ) : rate === 0 ? (
              <p className="text-gray-400 text-2xl font-bold">ไม่พบอัตรา</p>
            ) : (
              <>
                <p className="text-emerald-700 text-4xl font-bold tracking-tight">
                  {cur?.symbol}{formatNum(result)}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  1 {direction === 'thb-to-dest' ? 'THB' : destCurrency} = {formatNum(direction === 'thb-to-dest' ? rate : 1 / rate)} {direction === 'thb-to-dest' ? destCurrency : 'THB'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Quick reference */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-indigo-100/30 bg-gradient-to-r from-indigo-50/50 to-violet-50/30">
            <p className="text-[11px] text-indigo-500 font-semibold uppercase tracking-wider">ตารางอ้างอิงด่วน (THB → {destCurrency})</p>
          </div>
          <div className="divide-y divide-indigo-50/40">
            {[100, 500, 1000, 2000, 5000].map(v => (
              <div key={v} className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-gray-500">฿{v.toLocaleString()}</span>
                <span className="text-sm font-bold text-indigo-700">
                  {cur?.symbol}{formatNum(v * rate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav activeTab="calculator" tourId={tourId} isChina={isChina} />
    </div>
  )
}
