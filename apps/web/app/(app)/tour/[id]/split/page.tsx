'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'

interface Member {
  id: string
  name: string
  avatarUrl: string | null
}

interface Participant {
  id: string
  userId: string
  share: number
  isPaid: boolean
  settleReceiptUrl: string | null
  user: Member
}

interface SplitRecord {
  id: string
  title: string
  amount: number
  category: string
  date: string
  receiptUrl: string | null
  notes: string | null
  paidBy: Member
  participants: Participant[]
}

interface PaymentChannel {
  id: string
  type: string
  name: string
  detail: string
}

type Tab = 'summary' | 'owe' | 'owed' | 'create'

const PAYMENT_TYPES = [
  { id: 'promptpay',   label: 'พร้อมเพย์',        icon: '📱' },
  { id: 'kbank',       label: 'กสิกรไทย',          icon: '🟩' },
  { id: 'scb',         label: 'ไทยพาณิชย์',         icon: '🟣' },
  { id: 'bbl',         label: 'กรุงเทพ',            icon: '🔵' },
  { id: 'ktb',         label: 'กรุงไทย',            icon: '🔷' },
  { id: 'truemoney',   label: 'TrueMoney Wallet',  icon: '💚' },
  { id: 'rabbit',      label: 'Rabbit LINE Pay',   icon: '🐰' },
  { id: 'wechat',      label: 'WeChat Pay',         icon: '💚' },
  { id: 'other',       label: 'อื่นๆ',              icon: '💳' },
]

const CURRENCIES: Record<string, { symbol: string; flag: string; name: string }> = {
  THB: { symbol: '฿',   flag: '🇹🇭', name: 'บาท' },
  CNY: { symbol: '¥',   flag: '🇨🇳', name: 'หยวน' },
  JPY: { symbol: '¥',   flag: '🇯🇵', name: 'เยน' },
  KRW: { symbol: '₩',   flag: '🇰🇷', name: 'วอน' },
  EUR: { symbol: '€',   flag: '🇪🇺', name: 'ยูโร' },
  USD: { symbol: '$',   flag: '🇺🇸', name: 'ดอลลาร์' },
  SGD: { symbol: 'S$',  flag: '🇸🇬', name: 'ดอลลาร์สิงคโปร์' },
  HKD: { symbol: 'HK$', flag: '🇭🇰', name: 'ดอลลาร์ฮ่องกง' },
}

const CATEGORIES = [
  { id: 'FOOD',          label: 'อาหาร',        icon: '🍜' },
  { id: 'TRANSPORT',     label: 'เดินทาง',       icon: '🚌' },
  { id: 'ACCOMMODATION', label: 'ที่พัก',         icon: '🏨' },
  { id: 'ACTIVITY',      label: 'กิจกรรม',       icon: '🎡' },
  { id: 'ENTRANCE_FEE',  label: 'ค่าเข้า',       icon: '🎫' },
  { id: 'SHOPPING',      label: 'ช้อปปิ้ง',       icon: '🛍️' },
  { id: 'TIPS',          label: 'ทิป',            icon: '💝' },
  { id: 'EMERGENCY',     label: 'ฉุกเฉิน',        icon: '🚨' },
  { id: 'OTHER',         label: 'อื่นๆ',          icon: '📌' },
] as const

type CategoryId = typeof CATEGORIES[number]['id']

export default function SplitPage() {
  const params = useParams()
  const tourId = params.id as string
  const fileRef = useRef<HTMLInputElement>(null)

  const [isChina, setIsChina] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [me, setMe] = useState<Member | null>(null)
  const [records, setRecords] = useState<SplitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('summary')

  // create form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('THB')
  const [rates, setRates] = useState<Record<string, number>>({})
  const [category, setCategory] = useState<CategoryId>('FOOD')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // payment channel state
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const [showChannelManager, setShowChannelManager] = useState(false)
  const [newChType, setNewChType] = useState('promptpay')
  const [newChName, setNewChName] = useState('')

  // group fund state
  const [fundBalance, setFundBalance] = useState<number | null>(null)
  const [payFromFund, setPayFromFund] = useState(false)
  const [newChDetail, setNewChDetail] = useState('')

  const loadData = useCallback(async () => {
    const [tourRes, splitsRes, meRes, fundRes] = await Promise.all([
      fetch(`/api/tours/${tourId}`),
      fetch(`/api/tours/${tourId}/splits`),
      fetch('/api/auth/me'),
      fetch(`/api/tours/${tourId}/fund`),
    ])
    const tourData = await tourRes.json()
    const splitsData: SplitRecord[] = await splitsRes.json()
    const meData: Member = await meRes.json()
    const fundData = fundRes.ok ? await fundRes.json() : null

    setIsChina(tourData.isChina)
    if (tourData.destCurrency) setCurrency(tourData.destCurrency)
    const ms: Member[] = (tourData.members ?? []).map((m: { user: Member }) => m.user)
    setMembers(ms)
    setMe(meData)
    setSelectedIds(ms.map(m => m.id))
    setRecords(Array.isArray(splitsData) ? splitsData : [])
    if (fundData && typeof fundData.balance === 'number') {
      setFundBalance(fundData.balance)
    }
    setLoading(false)

    // fetch exchange rates
    fetch('https://api.exchangerate-api.com/v4/latest/THB')
      .then(r => r.json())
      .then((d: { rates: Record<string, number> }) => setRates(d.rates ?? {}))
      .catch(() => {})
  }, [tourId])

  useEffect(() => { loadData() }, [loadData])

  // Load payment channels from localStorage when me is set
  useEffect(() => {
    if (!me?.id) return
    try {
      const stored = localStorage.getItem(`paymentChannels_${me.id}`)
      if (stored) {
        const chs = JSON.parse(stored) as PaymentChannel[]
        setPaymentChannels(chs)
        if (chs.length > 0 && !selectedChannelId) setSelectedChannelId(chs[0]!.id)
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id])

  function saveChannels(chs: PaymentChannel[]) {
    setPaymentChannels(chs)
    if (me?.id) localStorage.setItem(`paymentChannels_${me.id}`, JSON.stringify(chs))
  }

  function addChannel() {
    if (!newChDetail.trim()) return
    const typeInfo = PAYMENT_TYPES.find(t => t.id === newChType)
    const ch: PaymentChannel = {
      id: Date.now().toString(),
      type: newChType,
      name: newChName.trim() || typeInfo?.label || newChType,
      detail: newChDetail.trim(),
    }
    const updated = [...paymentChannels, ch]
    saveChannels(updated)
    setSelectedChannelId(ch.id)
    setNewChName('')
    setNewChDetail('')
    setShowChannelManager(false)
  }

  function deleteChannel(id: string) {
    const updated = paymentChannels.filter(c => c.id !== id)
    saveChannels(updated)
    if (selectedChannelId === id) setSelectedChannelId(updated[0]?.id ?? '')
  }

  function pickReceipt(file: File) {
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  async function createSplit() {
    if (!amount) return
    if (!payFromFund && selectedIds.length === 0) return
    setSaving(true)
    try {
      const rawAmount = parseFloat(amount) || 0
      const rate = currency === 'THB' ? 1 : (rates[currency] ? 1 / rates[currency] : 1)
      const amountTHB = Math.ceil(rawAmount * rate)

      if (payFromFund) {
        // Withdraw from group fund — no individual split needed
        const res = await fetch(`/api/tours/${tourId}/fund/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountTHB,
            description: title || 'ค่าใช้จ่ายจากกองกลาง',
          }),
        })
        if (!res.ok) {
          const err = await res.json() as { error?: string }
          alert(err.error ?? 'เกิดข้อผิดพลาด')
          return
        }
        const data = await res.json() as { fund: { balance: number } }
        if (data.fund) setFundBalance(data.fund.balance)
      } else {
        let receiptUrl: string | null = null
        if (receiptFile) {
          const fd = new FormData()
          fd.append('file', receiptFile)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          if (res.ok) {
            const data = await res.json() as { url: string }
            receiptUrl = data.url
          }
        }

        const selectedChannel = paymentChannels.find(c => c.id === selectedChannelId)

        await fetch(`/api/tours/${tourId}/splits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || 'รายการหาร',
            amount: amountTHB,
            origAmount: rawAmount,
            origCurrency: currency,
            category,
            memberIds: selectedIds,
            receiptUrl,
            notes: selectedChannel ? JSON.stringify(selectedChannel) : null,
          }),
        })
      }

      setTitle('')
      setAmount('')
      setCategory('FOOD')
      setCurrency('THB')
      setReceiptFile(null)
      setReceiptPreview(null)
      setSelectedIds(members.map(m => m.id))
      setPayFromFund(false)
      setTab('summary')
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  async function settle(expenseId: string, settleAll: boolean, settleReceiptUrl?: string) {
    const res = await fetch(`/api/tours/${tourId}/splits/${expenseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settleAll, settleReceiptUrl }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string }
      console.error('settle PATCH failed:', res.status, err)
      alert(`บันทึกไม่สำเร็จ: ${err.error ?? res.status}`)
      return
    }
    await loadData()
  }

  async function deleteRecord(expenseId: string) {
    if (!confirm('ลบรายการนี้?')) return
    await fetch(`/api/tours/${tourId}/splits/${expenseId}`, { method: 'DELETE' })
    await loadData()
  }

  const fmt = (n: number) => Math.ceil(n).toLocaleString('th-TH')

  // ── Derived data ──
  // Records I need to pay (others created, I'm a participant, not paid)
  const iOwe = records.filter(r =>
    r.paidBy.id !== me?.id &&
    r.participants.some(p => p.userId === me?.id && !p.isPaid)
  )

  // Records others need to pay me (I created, some participants haven't paid)
  const owedToMe = records.filter(r =>
    r.paidBy.id === me?.id &&
    r.participants.some(p => p.userId !== me?.id && !p.isPaid)
  )

  // Summary: net balance per person
  const balances: Record<string, { person: Member; net: number }> = {}
  for (const r of records) {
    for (const p of r.participants) {
      if (p.isPaid) continue
      if (p.userId === me?.id && r.paidBy.id !== me?.id) {
        // I owe r.paidBy
        const key = r.paidBy.id
        if (!balances[key]) balances[key] = { person: r.paidBy, net: 0 }
        balances[key]!.net -= p.share
      } else if (r.paidBy.id === me?.id && p.userId !== me?.id) {
        // p.user owes me
        const key = p.userId
        if (!balances[key]) balances[key] = { person: p.user, net: 0 }
        balances[key]!.net += p.share
      }
    }
  }

  const totalOweOut = iOwe.reduce((s, r) => {
    const p = r.participants.find(p => p.userId === me?.id && !p.isPaid)
    return s + (p?.share ?? 0)
  }, 0)

  const totalOwedIn = owedToMe.reduce((s, r) => {
    return s + r.participants.filter(p => p.userId !== me?.id && !p.isPaid).reduce((a, p) => a + p.share, 0)
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar
        title="หารค่าใช้จ่าย"
        subtitle={iOwe.length > 0 ? `⚠️ ค้างจ่าย ${iOwe.length} รายการ` : 'ไม่มียอดค้างชำระ'}
        gradient="bg-gradient-to-br from-orange-500 to-rose-500"
      />

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 sticky top-0 z-10">
        {([
          ['summary', '📊 สรุป'],
          ['owe',     `💸 ต้องจ่าย${iOwe.length > 0 ? ` (${iOwe.length})` : ''}`],
          ['owed',    `📥 รอรับ${owedToMe.length > 0 ? ` (${owedToMe.length})` : ''}`],
          ['create',  '➕ สร้างรายการ'],
        ] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-semibold transition-all duration-200 ${
              tab === t ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* ── SUMMARY TAB ── */}
        {tab === 'summary' && (
          <>
            {/* Net cards */}
            <div className="grid grid-cols-2 gap-3 animate-slide-up delay-1">
              <div className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 rounded-3xl p-4 text-white shadow-xl shadow-red-200/50 relative overflow-hidden hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-white/5 blur-lg" />
                <div className="relative">
                  <p className="text-xs text-white/70 font-medium mb-1">ฉันต้องจ่าย</p>
                  <p className="text-2xl font-black">฿{fmt(totalOweOut)}</p>
                  <p className="text-[10px] text-white/50 mt-1.5">{iOwe.length} รายการ</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-4 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-white/5 blur-lg" />
                <div className="relative">
                  <p className="text-xs text-white/70 font-medium mb-1">รอรับเงิน</p>
                  <p className="text-2xl font-black">฿{fmt(totalOwedIn)}</p>
                  <p className="text-[10px] text-white/50 mt-1.5">{owedToMe.length} รายการ</p>
                </div>
              </div>
            </div>

            {/* ── My personal expense summary ── */}
            {(() => {
              const catColors: Record<string, string> = {
                FOOD: 'bg-orange-400', TRANSPORT: 'bg-blue-400', ACCOMMODATION: 'bg-violet-400',
                ACTIVITY: 'bg-pink-400', SHOPPING: 'bg-rose-400', TIPS: 'bg-yellow-400',
                EMERGENCY: 'bg-red-500', ENTRANCE_FEE: 'bg-teal-400', OTHER: 'bg-gray-400',
              }

              // All records I'm a participant in
              const myRecords = records.filter(r =>
                r.participants.some(p => p.userId === me?.id)
              )
              if (myRecords.length === 0) return null

              // My share per record
              const myTotal = myRecords.reduce((s, r) => {
                const p = r.participants.find(p => p.userId === me?.id)
                return s + (p?.share ?? 0)
              }, 0)

              // Category breakdown by my share
              const myCatMap: Record<string, number> = {}
              for (const r of myRecords) {
                const p = r.participants.find(p => p.userId === me?.id)
                if (p) myCatMap[r.category] = (myCatMap[r.category] ?? 0) + p.share
              }
              const myCatSorted = Object.entries(myCatMap).sort((a, b) => b[1] - a[1])

              return (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up delay-2 hover:shadow-md transition-shadow duration-300">
                  <div className="px-5 pt-5 pb-3 relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-50 to-transparent rounded-bl-full" />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 relative">ค่าใช้จ่ายของฉัน</p>
                    <p className="text-3xl font-black text-gray-900 relative">฿{fmt(myTotal)}</p>
                    <p className="text-xs text-gray-400 mt-1">{myRecords.length} รายการที่เกี่ยวกับฉัน</p>
                  </div>
                  <div className="mx-5 mb-4 h-3 rounded-full overflow-hidden flex shadow-inner">
                    {myCatSorted.map(([cat, amt]) => (
                      <div key={cat} className={`${catColors[cat] ?? 'bg-gray-400'} h-full transition-all duration-700`}
                        style={{ width: `${(amt / myTotal) * 100}%` }} />
                    ))}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {myCatSorted.map(([cat, amt]) => {
                      const info = CATEGORIES.find(c => c.id === cat)
                      const pct = Math.round((amt / myTotal) * 100)
                      return (
                        <div key={cat} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${catColors[cat] ?? 'bg-gray-400'} shadow-sm`} />
                          <span className="text-sm text-gray-700 flex-1 font-medium">{info?.icon} {info?.label ?? cat}</span>
                          <span className="text-xs text-gray-400 w-10 text-right font-medium">{pct}%</span>
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${catColors[cat] ?? 'bg-gray-400'} transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-bold text-gray-900 w-20 text-right">฿{fmt(amt)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* ── Trip total (only when there are group splits with others) ── */}
            {(() => {
              const catColors: Record<string, string> = {
                FOOD: 'bg-orange-400', TRANSPORT: 'bg-blue-400', ACCOMMODATION: 'bg-violet-400',
                ACTIVITY: 'bg-pink-400', SHOPPING: 'bg-rose-400', TIPS: 'bg-yellow-400',
                EMERGENCY: 'bg-red-500', ENTRANCE_FEE: 'bg-teal-400', OTHER: 'bg-gray-400',
              }
              // Only group records (has participants other than me)
              const groupRecords = records.filter(r =>
                r.participants.some(p => p.userId !== me?.id)
              )
              if (groupRecords.length === 0) return null

              const tripTotal = groupRecords.reduce((s, r) => s + r.amount, 0)
              const catMap: Record<string, number> = {}
              for (const r of groupRecords) {
                catMap[r.category] = (catMap[r.category] ?? 0) + r.amount
              }
              const catSorted = Object.entries(catMap).sort((a, b) => b[1] - a[1])

              return (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up delay-3 hover:shadow-md transition-shadow duration-300">
                  <div className="px-5 pt-5 pb-3 relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full" />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 relative">ค่าใช้จ่ายรวมทั้งกลุ่ม</p>
                    <p className="text-3xl font-black text-gray-900 relative">฿{fmt(tripTotal)}</p>
                    <p className="text-xs text-gray-400 mt-1">{groupRecords.length} รายการหารกัน</p>
                  </div>
                  <div className="mx-5 mb-4 h-3 rounded-full overflow-hidden flex shadow-inner">
                    {catSorted.map(([cat, amt]) => (
                      <div key={cat} className={`${catColors[cat] ?? 'bg-gray-400'} h-full transition-all duration-700`}
                        style={{ width: `${(amt / tripTotal) * 100}%` }} />
                    ))}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {catSorted.map(([cat, amt]) => {
                      const info = CATEGORIES.find(c => c.id === cat)
                      const pct = Math.round((amt / tripTotal) * 100)
                      return (
                        <div key={cat} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${catColors[cat] ?? 'bg-gray-400'} shadow-sm`} />
                          <span className="text-sm text-gray-700 flex-1 font-medium">{info?.icon} {info?.label ?? cat}</span>
                          <span className="text-xs text-gray-400 w-10 text-right font-medium">{pct}%</span>
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${catColors[cat] ?? 'bg-gray-400'} transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-bold text-gray-900 w-20 text-right">฿{fmt(amt)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Balance per person */}
            {Object.keys(balances).length > 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up delay-4 hover:shadow-md transition-shadow duration-300">
                <div className="px-5 py-3.5 border-b border-gray-50 relative overflow-hidden">
                  <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-indigo-50 blur-lg" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider relative">ยอดคงค้างระหว่างกัน</p>
                </div>
                {Object.values(balances).map(({ person, net }) => (
                  <div key={person.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                        {person.name[0]}
                      </div>
                      <p className="text-sm text-gray-800 font-medium">{person.name.split(' ')[0]}</p>
                    </div>
                    {net > 0 ? (
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">+฿{fmt(net)}</p>
                        <p className="text-[10px] text-gray-400">ค้างจ่ายให้ฉัน</p>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-500">-฿{fmt(Math.abs(net))}</p>
                        <p className="text-[10px] text-gray-400">ฉันค้างจ่าย</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm font-medium">ไม่มียอดค้างชำระ</p>
              </div>
            )}
          </>
        )}

        {/* ── OWE TAB (ฉันต้องจ่ายเพื่อน) ── */}
        {tab === 'owe' && (
          <>
            {iOwe.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm font-medium">ไม่มียอดที่ต้องจ่าย</p>
              </div>
            ) : iOwe.map(record => (
              <SplitCard key={record.id} record={record} me={me} myRole="owe"
                onSettle={(url) => settle(record.id, false, url)} fmt={fmt} />

            ))}
          </>
        )}

        {/* ── OWED TAB (เพื่อนต้องจ่ายฉัน) ── */}
        {tab === 'owed' && (
          <>
            {owedToMe.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-3xl mb-2">💤</p>
                <p className="text-sm font-medium">ไม่มียอดรอรับ</p>
              </div>
            ) : owedToMe.map(record => (
              <SplitCard key={record.id} record={record} me={me} myRole="owed"
                onSettleAll={() => settle(record.id, true)}
                onDelete={() => deleteRecord(record.id)} fmt={fmt} />
            ))}
          </>
        )}

        {/* ── CREATE TAB ── */}
        {tab === 'create' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="ชื่อรายการ (เช่น อาหารเที่ยง)"
                className="w-full text-sm font-medium text-gray-900 focus:outline-none placeholder-gray-300 border-b border-gray-100 pb-2"
              />

              {/* Currency + Amount */}
              <div className="flex items-center gap-3">
                {/* Currency picker */}
                <div className="relative">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="appearance-none pl-2 pr-6 py-1.5 bg-orange-50 text-orange-700 text-sm font-semibold rounded-xl focus:outline-none cursor-pointer"
                  >
                    {Object.entries(CURRENCIES).map(([code, c]) => (
                      <option key={code} value={code}>{c.flag} {code}</option>
                    ))}
                  </select>
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-orange-400 text-xs pointer-events-none">▾</span>
                </div>
                <input
                  type="number" inputMode="decimal"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 text-3xl font-bold text-gray-900 focus:outline-none placeholder-gray-200"
                />
              </div>

              {/* THB conversion preview */}
              {currency !== 'THB' && parseFloat(amount) > 0 && rates[currency] && (
                <div className="bg-amber-50 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-amber-700">เทียบเป็น THB</span>
                  <span className="text-sm font-bold text-amber-700">
                    ≈ ฿{Math.ceil(parseFloat(amount) / rates[currency]).toLocaleString('th-TH')}
                  </span>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {[100, 200, 500, 1000, 2000].map(v => (
                  <button key={v} onClick={() => setAmount(String(v))}
                    className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
                    {CURRENCIES[currency]?.symbol}{v}
                  </button>
                ))}
              </div>
            </div>

            {/* Category picker */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">ประเภทค่าใช้จ่าย</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      category === c.id
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Receipt upload */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-2">📎 หลักฐานการจ่ายเงิน <span className="text-gray-300">(ไม่บังคับ)</span></p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) pickReceipt(f) }} />
              {receiptPreview ? (
                <div className="relative">
                  <img src={receiptPreview} alt="receipt" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => { setReceiptFile(null); setReceiptPreview(null) }}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center">
                    ×
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors">
                  <span className="text-2xl">📷</span>
                  <span className="text-xs">แนบสลิป / ใบเสร็จ</span>
                </button>
              )}
            </div>

            {/* Member selector — hidden when paying from fund */}
            {!payFromFund && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">หารกับ</p>
                <button onClick={() => setSelectedIds(
                  selectedIds.length === members.length ? [] : members.map(m => m.id)
                )} className="text-xs text-orange-500 font-medium">
                  {selectedIds.length === members.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const sel = selectedIds.includes(m.id)
                  return (
                    <button key={m.id}
                      onClick={() => setSelectedIds(prev =>
                        sel ? prev.filter(id => id !== m.id) : [...prev, m.id]
                      )}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        sel ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                      }`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${sel ? 'bg-white/30' : 'bg-gray-200'}`}>
                        {m.name[0]}
                      </span>
                      {m.name.split(' ')[0]}{m.id === me?.id && ' (ฉัน)'}
                    </button>
                  )
                })}
              </div>
              {selectedIds.length > 0 && parseFloat(amount) > 0 && (
                <p className="mt-3 text-sm text-gray-500">
                  คนละ <span className="font-bold text-orange-600">฿{Math.ceil(
                    (currency === 'THB' ? parseFloat(amount) : parseFloat(amount) / (rates[currency] ?? 1))
                    / selectedIds.length
                  ).toLocaleString('th-TH')}</span>
                  {' '}({selectedIds.length} คน)
                </p>
              )}
            </div>
            )}

            {/* Pay from group fund toggle */}
            {fundBalance !== null && (
              <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${payFromFund ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-100'}`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">จ่ายจากกองกลาง</p>
                      <p className="text-xs text-gray-400">
                        ยอดกองกลาง: <span className={`font-semibold ${fundBalance > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          ฿{Math.ceil(fundBalance).toLocaleString('th-TH')}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      if (fundBalance <= 0) return
                      setPayFromFund(v => !v)
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                      payFromFund ? 'bg-emerald-500' : 'bg-gray-200'
                    } ${fundBalance <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${payFromFund ? 'translate-x-6' : ''}`} />
                  </div>
                </label>
                {payFromFund && parseFloat(amount) > 0 && (() => {
                  const rawAmount = parseFloat(amount) || 0
                  const rate = currency === 'THB' ? 1 : (rates[currency] ? 1 / rates[currency] : 1)
                  const amountTHB = Math.ceil(rawAmount * rate)
                  const remaining = fundBalance - amountTHB
                  return (
                    <div className={`mt-3 px-3 py-2 rounded-xl text-xs ${remaining >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {remaining >= 0
                        ? `หลังหัก: ฿${Math.ceil(remaining).toLocaleString('th-TH')} คงเหลือในกองกลาง`
                        : `ยอดกองกลางไม่พอ (ขาด ฿${Math.ceil(Math.abs(remaining)).toLocaleString('th-TH')})`
                      }
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Payment channel selector */}
            {!payFromFund && (
            <div className={`bg-white rounded-2xl p-4 shadow-sm border ${selectedChannelId ? 'border-green-200' : 'border-orange-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium flex items-center gap-1">
                  <span>💳 ช่องทางรับเงิน</span>
                  <span className="text-rose-500 font-bold">*</span>
                </p>
                <button onClick={() => setShowChannelManager(v => !v)}
                  className="text-xs text-orange-500 font-medium">
                  {showChannelManager ? 'ยกเลิก' : '+ เพิ่มช่องทาง'}
                </button>
              </div>

              {/* Add channel form */}
              {showChannelManager && (
                <div className="mb-3 p-3 bg-orange-50 rounded-xl space-y-2 border border-orange-100">
                  <select value={newChType} onChange={e => setNewChType(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl bg-white border border-orange-200 focus:outline-none text-gray-700">
                    {PAYMENT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                  <input value={newChName} onChange={e => setNewChName(e.target.value)}
                    placeholder="ชื่อ (เช่น กสิกรไทย สาขาสยาม)"
                    className="w-full text-sm px-3 py-2 rounded-xl bg-white border border-orange-200 focus:outline-none placeholder-gray-300" />
                  <input value={newChDetail} onChange={e => setNewChDetail(e.target.value)}
                    placeholder="เลขบัญชี / เบอร์โทรศัพท์"
                    className="w-full text-sm px-3 py-2 rounded-xl bg-white border border-orange-200 focus:outline-none placeholder-gray-300" />
                  <button onClick={addChannel} disabled={!newChDetail.trim()}
                    className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40">
                    บันทึกช่องทาง
                  </button>
                </div>
              )}

              {paymentChannels.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <p className="text-2xl mb-1">💳</p>
                  <p className="text-xs">ยังไม่มีช่องทางรับเงิน</p>
                  <p className="text-xs">กด &quot;+ เพิ่มช่องทาง&quot; เพื่อเพิ่ม</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentChannels.map(ch => {
                    const typeInfo = PAYMENT_TYPES.find(t => t.id === ch.type)
                    const sel = selectedChannelId === ch.id
                    return (
                      <label key={ch.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        sel ? 'border-orange-400 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                      }`}>
                        <input type="radio" name="channel" value={ch.id} checked={sel}
                          onChange={() => setSelectedChannelId(ch.id)} className="hidden" />
                        <span className="text-xl flex-shrink-0">{typeInfo?.icon ?? '💳'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{ch.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{ch.detail}</p>
                        </div>
                        {sel && <span className="text-orange-500 font-bold flex-shrink-0">✓</span>}
                        <button onClick={e => { e.preventDefault(); deleteChannel(ch.id) }}
                          className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0 p-1">
                          ✕
                        </button>
                      </label>
                    )
                  })}
                </div>
              )}
              {paymentChannels.length > 0 && !selectedChannelId && (
                <p className="text-xs text-rose-500 mt-2">⚠️ กรุณาเลือกช่องทางรับเงิน</p>
              )}
            </div>
            )}

            <button onClick={createSplit}
              disabled={
                saving ||
                !amount ||
                parseFloat(amount) <= 0 ||
                (!payFromFund && (selectedIds.length === 0 || !selectedChannelId)) ||
                (payFromFund && (() => {
                  const rawAmount = parseFloat(amount) || 0
                  const rate = currency === 'THB' ? 1 : (rates[currency] ? 1 / rates[currency] : 1)
                  return Math.ceil(rawAmount * rate) > (fundBalance ?? 0)
                })())
              }
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold rounded-2xl shadow-lg shadow-orange-200 disabled:opacity-40">
              {saving
                ? 'กำลังบันทึก...'
                : payFromFund
                  ? '💰 ตัดจากกองกลาง'
                  : '💾 บันทึกรายการ'
              }
            </button>
          </>
        )}
      </div>

      <BottomNav activeTab="split" tourId={tourId} isChina={isChina} />
    </div>
  )
}

// ── Sub-component: Split card ──
function SplitCard({ record, me, myRole, onSettle, onSettleAll, onDelete, fmt }: {
  record: SplitRecord
  me: Member | null
  myRole: 'owe' | 'owed'
  onSettle?: (settleReceiptUrl?: string) => Promise<void>
  onSettleAll?: () => void
  onDelete?: () => void
  fmt: (n: number) => string
}) {
  const [showReceipt, setShowReceipt] = useState(false)
  const [showSettleUpload, setShowSettleUpload] = useState(false)
  const [settlePreview, setSettlePreview] = useState<string | null>(null)
  const [settleFile, setSettleFile] = useState<File | null>(null)
  const [settling, setSettling] = useState(false)
  const settleFileRef = useRef<HTMLInputElement>(null)

  const myParticipant = record.participants.find(p => p.userId === me?.id)
  const pendingParticipants = record.participants.filter(p => p.userId !== me?.id && !p.isPaid)
  const cat = CATEGORIES.find(c => c.id === record.category)

  async function confirmSettle() {
    if (!settleFile || !onSettle) return
    setSettling(true)
    try {
      const fd = new FormData()
      fd.append('file', settleFile)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        alert('อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่')
        return
      }
      const { url } = await res.json() as { url: string }
      await onSettle(url)
      setShowSettleUpload(false)
      setSettleFile(null)
      setSettlePreview(null)
    } finally {
      setSettling(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${
      myRole === 'owe' ? 'border-red-100' : 'border-emerald-100'
    }`}>
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              {cat && (
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                  {cat.icon} {cat.label}
                </span>
              )}
            </div>
            <p className="font-semibold text-gray-900 text-sm">{record.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {myRole === 'owe'
                ? <>สร้างโดย <span className="text-gray-700 font-medium">{record.paidBy.name.split(' ')[0]}</span></>
                : <>คุณเปิดบิล</>
              }
              {' · '}{new Date(record.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="text-right flex items-start gap-2">
            {record.receiptUrl && (
              <button onClick={() => setShowReceipt(v => !v)}
                className="text-[10px] px-2 py-1 bg-blue-50 text-blue-500 rounded-lg font-medium">
                🧾 สลิป
              </button>
            )}
            <div>
              <p className="font-bold text-gray-900">฿{fmt(record.amount)}</p>
              <p className={`text-[10px] font-semibold ${myRole === 'owe' ? 'text-red-500' : 'text-emerald-600'}`}>
                {myRole === 'owe'
                  ? `ฉันค้าง ฿${fmt(myParticipant?.share ?? 0)}`
                  : `รอรับ ฿${fmt(pendingParticipants.reduce((s, p) => s + p.share, 0))}`
                }
              </p>
            </div>
          </div>
        </div>

        {showReceipt && record.receiptUrl && (
          <img src={record.receiptUrl} alt="receipt" className="mt-3 w-full rounded-xl object-contain max-h-48" />
        )}

        {/* Payment channel — shown to people who owe */}
        {myRole === 'owe' && record.notes && (() => {
          try {
            const ch = JSON.parse(record.notes) as PaymentChannel
            const typeInfo = PAYMENT_TYPES.find(t => t.id === ch.type)
            return (
              <div className="mt-3 bg-blue-50 rounded-xl px-3 py-2.5 flex items-center gap-3 border border-blue-100">
                <span className="text-xl flex-shrink-0">{typeInfo?.icon ?? '💳'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">โอนมาที่</p>
                  <p className="text-sm font-bold text-blue-900">{ch.name}</p>
                  <p className="text-xs text-blue-700 font-mono">{ch.detail}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(ch.detail)}
                  className="flex-shrink-0 px-2.5 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-semibold active:scale-95">
                  คัดลอก
                </button>
              </div>
            )
          } catch { return null }
        })()}
      </div>

      {/* Participants */}
      <div className="border-t border-gray-50 px-4 py-3 space-y-2">
        {record.participants.map(p => (
          <div key={p.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  p.isPaid ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                }`}>{p.user.name[0]}</div>
                <span className="text-xs text-gray-700">{p.userId === me?.id ? 'ฉัน' : p.user.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-900">฿{fmt(p.share)}</span>
                <span className={`text-[10px] font-medium ${p.isPaid ? 'text-green-600' : 'text-orange-500'}`}>
                  {p.isPaid ? '✓ จ่ายแล้ว' : 'ค้าง'}
                </span>
              </div>
            </div>
            {/* Settle slip — visible to expense creator */}
            {myRole === 'owed' && p.isPaid && p.userId !== me?.id && (
              p.settleReceiptUrl
                ? <SettleSlipToggle url={p.settleReceiptUrl} name={p.user.name.split(' ')[0]} />
                : <p className="mt-1 ml-7 text-[10px] text-gray-300">ไม่มีสลิปแนบมา</p>
            )}
          </div>
        ))}
      </div>

      {/* Settle slip upload area */}
      {myRole === 'owe' && myParticipant && !myParticipant.isPaid && showSettleUpload && (
        <div className="border-t border-blue-50 px-4 py-3 bg-blue-50/60 space-y-2">
          <p className="text-xs font-semibold text-blue-700">📎 แนบสลิปการโอนเงิน</p>
          <input ref={settleFileRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (!f) return
              setSettleFile(f)
              setSettlePreview(URL.createObjectURL(f))
            }} />
          {settlePreview ? (
            <div className="relative">
              <img src={settlePreview} alt="slip" className="w-full h-36 object-cover rounded-xl" />
              <button onClick={() => { setSettleFile(null); setSettlePreview(null) }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center">
                ×
              </button>
            </div>
          ) : (
            <button onClick={() => settleFileRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center gap-1 text-blue-400 hover:border-blue-400 transition-colors">
              <span className="text-xl">📷</span>
              <span className="text-xs">เลือกรูปสลิป</span>
            </button>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setShowSettleUpload(false); setSettleFile(null); setSettlePreview(null) }}
              className="flex-1 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-medium">
              ยกเลิก
            </button>
            <button onClick={confirmSettle} disabled={!settleFile || settling}
              className="flex-1 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40 shadow-sm shadow-green-200">
              {settling ? 'กำลังบันทึก...' : '✓ ยืนยันจ่ายแล้ว'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-gray-50 px-4 py-2.5 flex gap-2">
        {myRole === 'owe' && myParticipant && !myParticipant.isPaid && !showSettleUpload && (
          <button onClick={() => setShowSettleUpload(true)}
            className="flex-1 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold shadow-sm shadow-green-200">
            ✓ ฉันจ่ายแล้ว
          </button>
        )}
        {myRole === 'owed' && pendingParticipants.length > 0 && (
          <button onClick={onSettleAll}
            className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-200">
            ✓ ปิดยอดทั้งหมด
          </button>
        )}
        {myRole === 'owed' && (
          <button onClick={onDelete}
            className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-medium">
            ลบ
          </button>
        )}
      </div>
    </div>
  )
}

// ── Sub-component: settle slip toggle ──
function SettleSlipToggle({ url, name }: { url: string; name: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-1.5 ml-7">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
        <span>🧾</span>
        <span>{open ? 'ซ่อนสลิป' : `ดูสลิปจาก ${name}`}</span>
      </button>
      {open && (
        <img src={url} alt={`slip from ${name}`}
          className="mt-1.5 w-full max-h-52 object-contain rounded-xl border border-emerald-100" />
      )}
    </div>
  )
}
