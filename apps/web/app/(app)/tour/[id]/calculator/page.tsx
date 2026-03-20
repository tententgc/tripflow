'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'

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
  const [isChina, setIsChina] = useState(false)
  const [destCurrency, setDestCurrency] = useState('CNY')
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loadingRates, setLoadingRates] = useState(true)

  // direction: 'thb-to-dest' or 'dest-to-thb'
  const [direction, setDirection] = useState<'thb-to-dest' | 'dest-to-thb'>('thb-to-dest')
  const [input, setInput] = useState('')

  useEffect(() => {
    fetch(`/api/tours/${tourId}`)
      .then(r => r.json())
      .then(data => {
        setIsChina(data.isChina)
        if (data.destCurrency) setDestCurrency(data.destCurrency)
      })
      .catch(() => {})

    // Fetch exchange rates (THB base)
    fetch('https://api.exchangerate-api.com/v4/latest/THB')
      .then(r => r.json())
      .then(data => { setRates(data.rates ?? {}); setLoadingRates(false) })
      .catch(() => setLoadingRates(false))
  }, [tourId])

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
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar
        title="แปลงค่าเงิน"
        subtitle="อัตราแลกเปลี่ยนวันนี้"
        gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
      />

      <div className="px-4 py-4 space-y-4">
        {/* Currency selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-3">สกุลเงินปลายทาง</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CURRENCIES).map(([code, info]) => (
              <button
                key={code}
                onClick={() => setDestCurrency(code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  destCurrency === code
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{info.flag}</span>
                <span>{code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Direction toggle */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setDirection('thb-to-dest')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                direction === 'thb-to-dest'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              THB → {destCurrency}
            </button>
            <button
              onClick={() => setDirection('dest-to-thb')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                direction === 'dest-to-thb'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {destCurrency} → THB
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-2">{fromLabel}</p>
          <input
            type="number"
            inputMode="decimal"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="0"
            className="w-full text-3xl font-bold text-gray-900 focus:outline-none placeholder-gray-200"
          />
          {/* Quick amounts */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {quick.map(v => (
              <button
                key={v}
                onClick={() => setInput(String(v))}
                className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 font-medium"
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-lg shadow-emerald-200">
          <p className="text-emerald-100 text-xs font-medium mb-1">{toLabel}</p>
          {loadingRates ? (
            <p className="text-white text-2xl font-bold opacity-60">กำลังโหลด...</p>
          ) : rate === 0 ? (
            <p className="text-white text-2xl font-bold opacity-60">ไม่พบอัตรา</p>
          ) : (
            <>
              <p className="text-white text-4xl font-bold tracking-tight">
                {cur?.symbol}{formatNum(result)}
              </p>
              <p className="text-emerald-100 text-xs mt-2">
                1 {direction === 'thb-to-dest' ? 'THB' : destCurrency} = {formatNum(direction === 'thb-to-dest' ? rate : 1 / rate)} {direction === 'thb-to-dest' ? destCurrency : 'THB'}
              </p>
            </>
          )}
        </div>

        {/* Quick reference */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-3">ตารางอ้างอิงด่วน (THB → {destCurrency})</p>
          <div className="space-y-2">
            {[100, 500, 1000, 2000, 5000].map(v => (
              <div key={v} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">฿{v.toLocaleString()}</span>
                <span className="text-sm font-semibold text-gray-900">
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
