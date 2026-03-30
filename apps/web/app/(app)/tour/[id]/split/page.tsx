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
  THB: { symbol: '฿',    flag: '🇹🇭', name: 'บาท' },
  // เอเชีย
  CNY: { symbol: '¥',    flag: '🇨🇳', name: 'หยวน' },
  JPY: { symbol: '¥',    flag: '🇯🇵', name: 'เยน' },
  KRW: { symbol: '₩',    flag: '🇰🇷', name: 'วอน' },
  VND: { symbol: '₫',    flag: '🇻🇳', name: 'ด่อง' },
  SGD: { symbol: 'S$',   flag: '🇸🇬', name: 'ดอลลาร์สิงคโปร์' },
  MYR: { symbol: 'RM',   flag: '🇲🇾', name: 'ริงกิต' },
  IDR: { symbol: 'Rp',   flag: '🇮🇩', name: 'รูเปียห์' },
  TWD: { symbol: 'NT$',  flag: '🇹🇼', name: 'ดอลลาร์ไต้หวัน' },
  HKD: { symbol: 'HK$',  flag: '🇭🇰', name: 'ดอลลาร์ฮ่องกง' },
  INR: { symbol: '₹',    flag: '🇮🇳', name: 'รูปีอินเดีย' },
  MMK: { symbol: 'K',    flag: '🇲🇲', name: 'จ๊าต' },
  LAK: { symbol: '₭',    flag: '🇱🇦', name: 'กีบ' },
  KHR: { symbol: '៛',    flag: '🇰🇭', name: 'เรียล' },
  PHP: { symbol: '₱',    flag: '🇵🇭', name: 'เปโซ' },
  // ยุโรป
  EUR: { symbol: '€',    flag: '🇪🇺', name: 'ยูโร' },
  GBP: { symbol: '£',    flag: '🇬🇧', name: 'ปอนด์' },
  CHF: { symbol: 'CHF',  flag: '🇨🇭', name: 'ฟรังก์สวิส' },
  TRY: { symbol: '₺',    flag: '🇹🇷', name: 'ลีรา' },
  RUB: { symbol: '₽',    flag: '🇷🇺', name: 'รูเบิล' },
  // อเมริกา + โอเชียเนีย
  USD: { symbol: '$',    flag: '🇺🇸', name: 'ดอลลาร์' },
  AUD: { symbol: 'A$',   flag: '🇦🇺', name: 'ดอลลาร์ออสเตรเลีย' },
  NZD: { symbol: 'NZ$',  flag: '🇳🇿', name: 'ดอลลาร์นิวซีแลนด์' },
  CAD: { symbol: 'C$',   flag: '🇨🇦', name: 'ดอลลาร์แคนาดา' },
  // ตะวันออกกลาง
  AED: { symbol: 'د.إ',  flag: '🇦🇪', name: 'เดอร์แฮม' },
  SAR: { symbol: '﷼',    flag: '🇸🇦', name: 'ริยาล' },
}

const CATEGORIES = [
  { id: 'FOOD',          label: 'อาหาร' },
  { id: 'TRANSPORT',     label: 'เดินทาง' },
  { id: 'ACCOMMODATION', label: 'ที่พัก' },
  { id: 'ACTIVITY',      label: 'กิจกรรม' },
  { id: 'ENTRANCE_FEE',  label: 'ค่าเข้า' },
  { id: 'SHOPPING',      label: 'ช้อปปิ้ง' },
  { id: 'TIPS',          label: 'ทิป' },
  { id: 'EMERGENCY',     label: 'ฉุกเฉิน' },
  { id: 'OTHER',         label: 'อื่นๆ' },
] as const

type CategoryId = typeof CATEGORIES[number]['id']

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#f97316', TRANSPORT: '#3b82f6', ACCOMMODATION: '#fb923c',
  ACTIVITY: '#f472b6', SHOPPING: '#f472b6', TIPS: '#eab308',
  EMERGENCY: '#ef4444', ENTRANCE_FEE: '#06b6d4', OTHER: '#94a3b8',
}

const glassCard = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 20px rgba(0,0,0,0.05)',
  borderRadius: '20px',
  padding: '20px',
} as const

const glassCardNoPad = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 20px rgba(0,0,0,0.05)',
  borderRadius: '20px',
} as const

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

  // itemized split state
  const [splitMode, setSplitMode] = useState<'equal' | 'itemized'>('equal')
  const [lineItems, setLineItems] = useState<{ id: string; name: string; price: string; assignedIds: string[] }[]>([])

  function addLineItem() {
    setLineItems(prev => [...prev, { id: Date.now().toString(), name: '', price: '', assignedIds: members.map(m => m.id) }])
  }
  function updateLineItem(id: string, field: 'name' | 'price', val: string) {
    setLineItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i))
  }
  function toggleLineItemPerson(itemId: string, userId: string) {
    setLineItems(prev => prev.map(i => {
      if (i.id !== itemId) return i
      const has = i.assignedIds.includes(userId)
      return { ...i, assignedIds: has ? i.assignedIds.filter(x => x !== userId) : [...i.assignedIds, userId] }
    }))
  }
  function removeLineItem(id: string) {
    setLineItems(prev => prev.filter(i => i.id !== id))
  }
  function assignAllToItem(itemId: string) {
    setLineItems(prev => prev.map(i => i.id === itemId ? { ...i, assignedIds: members.map(m => m.id) } : i))
  }
  // Calculate per-person totals from line items
  function getItemizedTotals(): Map<string, number> {
    const totals = new Map<string, number>()
    members.forEach(m => totals.set(m.id, 0))
    for (const item of lineItems) {
      const price = parseFloat(item.price) || 0
      if (price <= 0 || item.assignedIds.length === 0) continue
      const perPerson = price / item.assignedIds.length
      for (const uid of item.assignedIds) {
        totals.set(uid, (totals.get(uid) ?? 0) + perPerson)
      }
    }
    return totals
  }
  const itemizedTotal = lineItems.reduce((s, i) => s + (parseFloat(i.price) || 0), 0)

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
    // For itemized mode, use total from items; for equal mode, use amount input
    const effectiveAmount = splitMode === 'itemized' ? String(itemizedTotal) : amount
    if (splitMode === 'equal' && !amount) return
    if (splitMode === 'itemized' && lineItems.length === 0) return
    if (!payFromFund && splitMode === 'equal' && selectedIds.length === 0) return
    setSaving(true)
    try {
      const rawAmount = parseFloat(effectiveAmount) || 0
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

        // For itemized mode, calculate per-person shares in THB
        let memberIds = selectedIds
        let notes = selectedChannel ? JSON.stringify(selectedChannel) : null
        let perPerson: Record<string, number> | undefined
        if (splitMode === 'itemized' && lineItems.length > 0) {
          const totals = getItemizedTotals()
          memberIds = members.filter(m => (totals.get(m.id) ?? 0) > 0).map(m => m.id)
          perPerson = Object.fromEntries(
            members.filter(m => (totals.get(m.id) ?? 0) > 0)
              .map(m => [m.id, Math.ceil((totals.get(m.id) ?? 0) * rate)])
          )
          const itemsData = lineItems.map(i => ({ name: i.name, price: parseFloat(i.price) || 0, assignedTo: i.assignedIds }))
          notes = JSON.stringify({ ...(selectedChannel ?? {}), splitMode: 'itemized', items: itemsData })
        }

        await fetch(`/api/tours/${tourId}/splits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || (splitMode === 'itemized' ? 'แยกรายการอาหาร' : 'รายการหาร'),
            amount: amountTHB,
            origAmount: rawAmount,
            origCurrency: currency,
            category,
            memberIds,
            receiptUrl,
            notes,
            perPerson, // send per-person amounts to API (undefined for equal split)
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
      setSplitMode('equal')
      setLineItems([])
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f2f8' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid #f97316', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#f0f2f8' }}>
      {/* Ambient gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full" style={{ top: '-15%', right: '-10%', width: 600, height: 600, opacity: 0.6, background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ bottom: '-10%', left: '-15%', width: 550, height: 550, opacity: 0.5, background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10" style={{ paddingBottom: '100px' }}>
        <TopBar
          title="หารค่าใช้จ่าย"
          subtitle={iOwe.length > 0 ? `ค้างจ่าย ${iOwe.length} รายการ` : 'ไม่มียอดค้างชำระ'}
        />

        {/* Tabs — glass */}
        <div className="sticky top-0 z-20" style={{ padding: '8px 16px' }}>
          <div className="flex" style={{
            ...glassCard,
            padding: '4px',
            borderRadius: '16px',
          }}>
            {([
              ['summary', 'สรุป'],
              ['owe',     `ต้องจ่าย${iOwe.length > 0 ? ` (${iOwe.length})` : ''}`],
              ['owed',    `รอรับ${owedToMe.length > 0 ? ` (${owedToMe.length})` : ''}`],
              ['create',  'สร้างรายการ'],
            ] as const).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: tab === t ? 700 : 500,
                  color: tab === t ? '#3d3a5c' : 'rgba(30,30,60,0.4)',
                  background: tab === t ? 'rgba(255,255,255,0.9)' : 'transparent',
                  boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
          <div className="space-y-4" style={{ paddingTop: 12 }}>

          {/* ── SUMMARY TAB ── */}
          {tab === 'summary' && (
            <>
              {/* Net cards — glass */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative overflow-hidden" style={{
                  ...glassCard,
                  borderLeft: '4px solid #ef4444',
                  animation: 'splitCardIn 0.32s ease-out 0s both',
                }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444', marginBottom: 4 }}>ฉันต้องจ่าย</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: '#ef4444', lineHeight: 1.1 }}>฿{fmt(totalOweOut)}</p>
                  <p style={{ fontSize: 10, color: 'rgba(30,30,60,0.4)', marginTop: 4 }}>{iOwe.length} รายการ</p>
                </div>
                <div className="relative overflow-hidden" style={{
                  ...glassCard,
                  borderLeft: '4px solid #22c55e',
                  animation: 'splitCardIn 0.32s ease-out 0.06s both',
                }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: '#22c55e', marginBottom: 4 }}>รอรับเงิน</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: '#22c55e', lineHeight: 1.1 }}>฿{fmt(totalOwedIn)}</p>
                  <p style={{ fontSize: 10, color: 'rgba(30,30,60,0.4)', marginTop: 4 }}>{owedToMe.length} รายการ</p>
                </div>
              </div>

              {/* ── My personal expense summary ── */}
              {(() => {
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
                  <div style={{ ...glassCardNoPad, overflow: 'hidden', animation: 'splitCardIn 0.32s ease-out 0.12s both' }}>
                    <div style={{ padding: '20px 20px 12px' }}>
                      <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(30,30,60,0.4)', marginBottom: 4 }}>ค่าใช้จ่ายของฉัน</p>
                      <p style={{ fontSize: 36, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.1 }}>฿{fmt(myTotal)}</p>
                      <p style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)', marginTop: 4 }}>{myRecords.length} รายการที่เกี่ยวกับฉัน</p>
                    </div>
                    {/* Stacked progress bar */}
                    <div className="flex overflow-hidden" style={{ margin: '0 20px 16px', height: 8, borderRadius: 8, background: 'rgba(0,0,0,0.04)' }}>
                      {myCatSorted.map(([cat, amt]) => (
                        <div key={cat} className="transition-all duration-700" style={{ width: `${(amt / myTotal) * 100}%`, height: '100%', background: CATEGORY_COLORS[cat] ?? '#94a3b8' }} />
                      ))}
                    </div>
                    {/* Category rows */}
                    <div>
                      {myCatSorted.map(([cat, amt], idx) => {
                        const info = CATEGORIES.find(c => c.id === cat)
                        const pct = Math.round((amt / myTotal) * 100)
                        return (
                          <div key={cat} className="flex items-center gap-3" style={{
                            padding: '12px 20px',
                            borderTop: idx > 0 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
                          }}>
                            <div className="flex-shrink-0 rounded-full" style={{ width: 10, height: 10, background: CATEGORY_COLORS[cat] ?? '#94a3b8' }} />
                            <span className="flex-1" style={{ fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>{info?.label ?? cat}</span>
                            <span style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)', fontWeight: 500, width: 36, textAlign: 'right' }}>{pct}%</span>
                            <div className="overflow-hidden" style={{ width: 120, height: 4, borderRadius: 4, background: 'rgba(0,0,0,0.04)' }}>
                              <div className="transition-all duration-500" style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: CATEGORY_COLORS[cat] ?? '#94a3b8' }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', width: 80, textAlign: 'right' }}>฿{fmt(amt)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* ── Trip total (only when there are group splits with others) ── */}
              {(() => {
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
                  <div style={{ ...glassCardNoPad, overflow: 'hidden', animation: 'splitCardIn 0.32s ease-out 0.18s both' }}>
                    <div style={{ padding: '20px 20px 12px' }}>
                      <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(30,30,60,0.4)', marginBottom: 4 }}>ค่าใช้จ่ายรวมทั้งกลุ่ม</p>
                      <p style={{ fontSize: 36, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.1 }}>฿{fmt(tripTotal)}</p>
                      <p style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)', marginTop: 4 }}>{groupRecords.length} รายการหารกัน</p>
                    </div>
                    {/* Stacked progress bar */}
                    <div className="flex overflow-hidden" style={{ margin: '0 20px 16px', height: 8, borderRadius: 8, background: 'rgba(0,0,0,0.04)' }}>
                      {catSorted.map(([cat, amt]) => (
                        <div key={cat} className="transition-all duration-700" style={{ width: `${(amt / tripTotal) * 100}%`, height: '100%', background: CATEGORY_COLORS[cat] ?? '#94a3b8' }} />
                      ))}
                    </div>
                    {/* Category rows */}
                    <div>
                      {catSorted.map(([cat, amt], idx) => {
                        const info = CATEGORIES.find(c => c.id === cat)
                        const pct = Math.round((amt / tripTotal) * 100)
                        return (
                          <div key={cat} className="flex items-center gap-3" style={{
                            padding: '12px 20px',
                            borderTop: idx > 0 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
                          }}>
                            <div className="flex-shrink-0 rounded-full" style={{ width: 10, height: 10, background: CATEGORY_COLORS[cat] ?? '#94a3b8' }} />
                            <span className="flex-1" style={{ fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>{info?.label ?? cat}</span>
                            <span style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)', fontWeight: 500, width: 36, textAlign: 'right' }}>{pct}%</span>
                            <div className="overflow-hidden" style={{ width: 120, height: 4, borderRadius: 4, background: 'rgba(0,0,0,0.04)' }}>
                              <div className="transition-all duration-500" style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: CATEGORY_COLORS[cat] ?? '#94a3b8' }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', width: 80, textAlign: 'right' }}>฿{fmt(amt)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Balance per person */}
              {Object.keys(balances).length > 0 ? (
                <div style={{ ...glassCardNoPad, overflow: 'hidden', animation: 'splitCardIn 0.32s ease-out 0.24s both' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(30,30,60,0.4)' }}>ยอดคงค้างระหว่างกัน</p>
                  </div>
                  {Object.values(balances).map(({ person, net }) => (
                    <div key={person.id} className="flex items-center justify-between" style={{ padding: '12px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-full" style={{
                          width: 32, height: 32,
                          background: net > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          fontSize: 13, fontWeight: 700,
                          color: net > 0 ? '#22c55e' : '#ef4444',
                        }}>
                          {person.name[0]}
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>{person.name.split(' ')[0]}</p>
                      </div>
                      {net > 0 ? (
                        <div className="text-right">
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>+฿{fmt(net)}</p>
                          <p style={{ fontSize: 10, color: 'rgba(30,30,60,0.4)' }}>ค้างจ่ายให้ฉัน</p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>-฿{fmt(Math.abs(net))}</p>
                          <p style={{ fontSize: 10, color: 'rgba(30,30,60,0.4)' }}>ฉันค้างจ่าย</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center" style={{
                  ...glassCard,
                  padding: '40px 20px',
                  animation: 'splitCardIn 0.32s ease-out 0.24s both',
                }}>
                  <div className="flex items-center justify-center" style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                    marginBottom: 8,
                  }}>
                    <svg className="w-5 h-5" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>ไม่มียอดค้างชำระ</p>
                </div>
              )}
            </>
          )}

          {/* ── OWE TAB (ฉันต้องจ่ายเพื่อน) ── */}
          {tab === 'owe' && (
            <>
              {iOwe.length === 0 ? (
                <div className="flex flex-col items-center justify-center" style={{
                  ...glassCard,
                  padding: '64px 20px',
                }}>
                  <div className="flex items-center justify-center" style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                    marginBottom: 8,
                  }}>
                    <svg className="w-5 h-5" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>ไม่มียอดที่ต้องจ่าย</p>
                </div>
              ) : iOwe.map((record, idx) => (
                <SplitCard key={record.id} record={record} me={me} myRole="owe"
                  onSettle={(url) => settle(record.id, false, url)} fmt={fmt} idx={idx} />

              ))}
            </>
          )}

          {/* ── OWED TAB (เพื่อนต้องจ่ายฉัน) ── */}
          {tab === 'owed' && (
            <>
              {owedToMe.length === 0 ? (
                <div className="flex flex-col items-center justify-center" style={{
                  ...glassCard,
                  padding: '64px 20px',
                }}>
                  <div className="flex items-center justify-center" style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)',
                    marginBottom: 8,
                  }}>
                    <svg className="w-5 h-5" style={{ color: 'rgba(30,30,60,0.25)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(30,30,60,0.4)' }}>ไม่มียอดรอรับ</p>
                </div>
              ) : owedToMe.map((record, idx) => (
                <SplitCard key={record.id} record={record} me={me} myRole="owed"
                  onSettleAll={() => settle(record.id, true)}
                  onDelete={() => deleteRecord(record.id)} fmt={fmt} idx={idx} />
              ))}
            </>
          )}

          {/* ── CREATE TAB ── */}
          {tab === 'create' && (
            <>
              {/* Split mode toggle — TOP */}
              {!payFromFund && (
              <div style={{ ...glassCard, animation: 'splitCardIn 0.32s ease-out 0s both' }}>
                <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(30,30,60,0.4)', marginBottom: 10 }}>วิธีหาร</p>
                <div className="flex gap-2">
                  {(['equal', 'itemized'] as const).map(mode => (
                    <button key={mode} onClick={() => setSplitMode(mode)}
                      className="flex-1 flex items-center justify-center gap-2 transition-all"
                      style={{
                        padding: '10px 12px', borderRadius: 14, fontSize: 13, fontWeight: 600,
                        borderWidth: 1, borderStyle: 'solid',
                        ...(splitMode === mode ? {
                          background: 'linear-gradient(to right, #f97316, #ea580c)', color: '#fff',
                          boxShadow: '0 2px 8px rgba(249,115,22,0.25)', borderColor: 'transparent',
                        } : {
                          background: 'rgba(255,255,255,0.7)', color: 'rgba(30,30,60,0.55)',
                          borderColor: 'rgba(255,255,255,0.88)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        }),
                      }}>
                      {mode === 'equal' ? '➗ หารเท่า' : '📝 แยกรายการ'}
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Itemized split — add food items (right after toggle) */}
              {!payFromFund && splitMode === 'itemized' && (
              <div style={{ ...glassCard, animation: 'splitCardIn 0.32s ease-out 0.04s both' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(30,30,60,0.4)' }}>
                    รายการอาหาร ({lineItems.length})
                  </p>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>
                    รวม {CURRENCIES[currency]?.symbol}{itemizedTotal.toLocaleString()}
                  </span>
                </div>

                {lineItems.map((item, idx) => (
                  <div key={item.id} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(30,30,60,0.3)', minWidth: 20 }}>#{idx + 1}</span>
                      <input value={item.name} onChange={e => updateLineItem(item.id, 'name', e.target.value)}
                        placeholder="ชื่อเมนู (เช่น ราเมน, ข้าวผัด)"
                        style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1a1a2e', background: 'transparent', border: 'none', outline: 'none' }} />
                      <input type="number" inputMode="decimal" value={item.price} onChange={e => updateLineItem(item.id, 'price', e.target.value)}
                        placeholder="ราคา"
                        style={{ width: 80, fontSize: 14, fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.06)', border: 'none', outline: 'none', borderRadius: 8, padding: '4px 8px', textAlign: 'right' }} />
                      <button onClick={() => removeLineItem(item.id)} style={{ color: 'rgba(30,30,60,0.25)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>×</button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span style={{ fontSize: 10, color: 'rgba(30,30,60,0.3)', fontWeight: 600, marginRight: 2 }}>ใครกิน:</span>
                      {members.map(m => {
                        const sel = item.assignedIds.includes(m.id)
                        return (
                          <button key={m.id} onClick={() => toggleLineItemPerson(item.id, m.id)}
                            style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                              borderWidth: 1, borderStyle: 'solid',
                              ...(sel ? { background: '#f97316', color: '#fff', borderColor: 'transparent' }
                                     : { background: 'rgba(0,0,0,0.04)', color: 'rgba(30,30,60,0.4)', borderColor: 'rgba(0,0,0,0.06)' }),
                            }}>
                            {m.name.split(' ')[0]}{m.id === me?.id ? '(ฉัน)' : ''}
                          </button>
                        )
                      })}
                      <button onClick={() => assignAllToItem(item.id)}
                        style={{ padding: '2px 6px', borderRadius: 999, fontSize: 10, fontWeight: 600, color: '#f97316', background: 'none', border: '1px dashed rgba(249,115,22,0.3)', cursor: 'pointer' }}>
                        ทุกคน
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={addLineItem} className="w-full flex items-center justify-center gap-2"
                  style={{ padding: '10px', borderRadius: 14, fontSize: 13, fontWeight: 600, color: '#f97316', background: 'rgba(249,115,22,0.04)', border: '1.5px dashed rgba(249,115,22,0.25)', cursor: 'pointer' }}>
                  + เพิ่มรายการ
                </button>

                {lineItems.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(30,30,60,0.3)', marginBottom: 8 }}>สรุปแต่ละคนจ่าย</p>
                    {(() => {
                      const totals = getItemizedTotals()
                      return members.filter(m => (totals.get(m.id) ?? 0) > 0).map(m => (
                        <div key={m.id} className="flex items-center justify-between" style={{ padding: '6px 0' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{m.name.split(' ')[0]}{m.id === me?.id ? ' (ฉัน)' : ''}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#f97316' }}>
                            {CURRENCIES[currency]?.symbol}{Math.ceil(totals.get(m.id) ?? 0).toLocaleString()}
                          </span>
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>
              )}

              <div style={{ ...glassCard, animation: `splitCardIn 0.32s ease-out ${splitMode === 'itemized' ? '0.08s' : '0.04s'} both` }} className="space-y-3">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="ชื่อรายการ (เช่น อาหารเที่ยง)"
                  style={{
                    width: '100%', fontSize: 14, fontWeight: 500, color: '#1a1a2e',
                    background: 'transparent', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)',
                    paddingBottom: 8, outline: 'none',
                  }}
                />

                {/* Currency picker — always visible */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      style={{
                        appearance: 'none', paddingLeft: 8, paddingRight: 24, paddingTop: 6, paddingBottom: 6,
                        background: 'rgba(249,115,22,0.08)', color: '#f97316', fontSize: 13, fontWeight: 600,
                        borderRadius: 12, border: 'none', outline: 'none', cursor: 'pointer',
                      }}
                    >
                      {Object.entries(CURRENCIES).map(([code, c]) => (
                        <option key={code} value={code}>{c.flag} {code}</option>
                      ))}
                    </select>
                    <span className="absolute pointer-events-none" style={{ right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#f97316' }}>▾</span>
                  </div>

                  {/* Itemized mode: show auto-total / Equal mode: manual input */}
                  {splitMode === 'itemized' ? (
                    <div className="flex-1">
                      <span style={{ fontSize: 28, fontWeight: 700, color: itemizedTotal > 0 ? '#f97316' : 'rgba(30,30,60,0.2)' }}>
                        {itemizedTotal > 0 ? itemizedTotal.toLocaleString() : '0'}
                      </span>
                      <span style={{ fontSize: 12, color: 'rgba(30,30,60,0.35)', marginLeft: 8, fontWeight: 500 }}>รวมจากรายการ</span>
                    </div>
                  ) : (
                    <input
                      type="number" inputMode="decimal"
                      value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="0"
                      style={{
                        flex: 1, fontSize: 28, fontWeight: 700, color: '#1a1a2e',
                        background: 'transparent', border: 'none', outline: 'none',
                      }}
                    />
                  )}
                </div>

                {/* THB conversion preview — equal mode only */}
                {splitMode === 'equal' && currency !== 'THB' && parseFloat(amount) > 0 && rates[currency] && (
                  <div className="flex items-center justify-between" style={{
                    background: 'rgba(234,179,8,0.08)', borderRadius: 12, padding: '8px 12px',
                  }}>
                    <span style={{ fontSize: 12, color: '#a16207' }}>เทียบเป็น THB</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#a16207' }}>
                      ≈ ฿{Math.ceil(parseFloat(amount) / rates[currency]).toLocaleString('th-TH')}
                    </span>
                  </div>
                )}

                {/* Itemized mode THB conversion */}
                {splitMode === 'itemized' && currency !== 'THB' && itemizedTotal > 0 && rates[currency] && (
                  <div className="flex items-center justify-between" style={{
                    background: 'rgba(234,179,8,0.08)', borderRadius: 12, padding: '8px 12px',
                  }}>
                    <span style={{ fontSize: 12, color: '#a16207' }}>เทียบเป็น THB</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#a16207' }}>
                      ≈ ฿{Math.ceil(itemizedTotal / rates[currency]).toLocaleString('th-TH')}
                    </span>
                  </div>
                )}

                {/* Quick amount buttons — equal mode only */}
                {splitMode === 'equal' && (
                <div className="flex gap-2 flex-wrap">
                  {[100, 200, 500, 1000, 2000].map(v => (
                    <button key={v} onClick={() => setAmount(String(v))}
                      style={{
                        padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                        background: 'rgba(255,255,255,0.7)', color: 'rgba(30,30,60,0.55)',
                        border: '1px solid rgba(255,255,255,0.88)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                      {CURRENCIES[currency]?.symbol}{v}
                    </button>
                  ))}
                </div>
                )}
              </div>

              {/* Category picker */}
              <div style={{ ...glassCard, animation: 'splitCardIn 0.32s ease-out 0.06s both' }}>
                <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(30,30,60,0.4)', marginBottom: 12 }}>ประเภทค่าใช้จ่าย</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className="flex items-center gap-1.5 transition-all"
                      style={{
                        padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                        borderWidth: 1, borderStyle: 'solid',
                        ...(category === c.id ? {
                          background: 'linear-gradient(to right, #f97316, #ea580c)',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
                          borderColor: 'transparent',
                        } : {
                          background: 'rgba(255,255,255,0.7)',
                          color: 'rgba(30,30,60,0.55)',
                          borderColor: 'rgba(255,255,255,0.88)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        }),
                      }}
                    >
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Receipt upload */}
              <div style={{ ...glassCard, animation: 'splitCardIn 0.32s ease-out 0.12s both' }}>
                <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(30,30,60,0.4)', marginBottom: 8 }}>หลักฐานการจ่ายเงิน <span style={{ color: 'rgba(30,30,60,0.25)' }}>(ไม่บังคับ)</span></p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) pickReceipt(f) }} />
                {receiptPreview ? (
                  <div className="relative">
                    <img src={receiptPreview} alt="receipt" className="w-full object-cover" style={{ height: 160, borderRadius: 16 }} />
                    <button onClick={() => { setReceiptFile(null); setReceiptPreview(null) }}
                      className="absolute flex items-center justify-center" style={{
                        top: 8, right: 8, width: 24, height: 24, borderRadius: 999,
                        background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 12,
                        backdropFilter: 'blur(8px)',
                      }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-1 transition-colors"
                    style={{
                      height: 96, borderRadius: 16, border: '2px dashed rgba(249,115,22,0.2)',
                      color: 'rgba(30,30,60,0.35)', background: 'transparent',
                    }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    <span style={{ fontSize: 12 }}>แนบสลิป / ใบเสร็จ</span>
                  </button>
                )}
              </div>

              {/* (itemized section moved to after toggle) */}

              {/* Member selector — equal split mode, hidden when paying from fund */}
              {!payFromFund && splitMode === 'equal' && (
              <div style={{ ...glassCard, animation: 'splitCardIn 0.32s ease-out 0.21s both' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(30,30,60,0.4)' }}>หารกับ</p>
                  <button onClick={() => setSelectedIds(
                    selectedIds.length === members.length ? [] : members.map(m => m.id)
                  )} style={{ fontSize: 12, color: '#f97316', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
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
                        className="flex items-center gap-1.5 transition-all"
                        style={{
                          padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                          borderWidth: 1, borderStyle: 'solid',
                          ...(sel ? {
                            background: 'linear-gradient(to right, #f97316, #ea580c)',
                            color: '#ffffff',
                            boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
                            borderColor: 'transparent',
                          } : {
                            background: 'rgba(255,255,255,0.7)',
                            color: 'rgba(30,30,60,0.55)',
                            borderColor: 'rgba(255,255,255,0.88)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                          }),
                        }}>
                        <span className="flex items-center justify-center rounded-full" style={{
                          width: 16, height: 16, fontSize: 9, fontWeight: 700,
                          background: sel ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.06)',
                          color: sel ? '#ffffff' : 'rgba(30,30,60,0.5)',
                        }}>
                          {m.name[0]}
                        </span>
                        {m.name.split(' ')[0]}{m.id === me?.id && ' (ฉัน)'}
                      </button>
                    )
                  })}
                </div>
                {selectedIds.length > 0 && parseFloat(amount) > 0 && (
                  <p style={{ marginTop: 12, fontSize: 14, color: 'rgba(30,30,60,0.55)' }}>
                    คนละ <span style={{ fontWeight: 700, color: '#f97316' }}>฿{Math.ceil(
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
                <div style={{
                  ...glassCard,
                  borderColor: payFromFund ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.88)',
                  background: payFromFund ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.62)',
                  animation: 'splitCardIn 0.32s ease-out 0.24s both',
                }} className="transition-all">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center" style={{
                        width: 36, height: 36, borderRadius: 12,
                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                      }}>
                        <svg className="w-4 h-4" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>จ่ายจากกองกลาง</p>
                        <p style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)' }}>
                          ยอดกองกลาง: <span style={{ fontWeight: 600, color: fundBalance > 0 ? '#22c55e' : '#ef4444' }}>
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
                      className="relative transition-colors cursor-pointer"
                      style={{
                        width: 48, height: 24, borderRadius: 999,
                        background: payFromFund ? '#22c55e' : 'rgba(0,0,0,0.1)',
                        opacity: fundBalance <= 0 ? 0.4 : 1,
                        cursor: fundBalance <= 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span className="absolute transition-transform" style={{
                        top: 2, left: 2, width: 20, height: 20, borderRadius: 999,
                        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        transform: payFromFund ? 'translateX(24px)' : 'translateX(0)',
                      }} />
                    </div>
                  </label>
                  {payFromFund && parseFloat(amount) > 0 && (() => {
                    const rawAmount = parseFloat(amount) || 0
                    const rate = currency === 'THB' ? 1 : (rates[currency] ? 1 / rates[currency] : 1)
                    const amountTHB = Math.ceil(rawAmount * rate)
                    const remaining = fundBalance - amountTHB
                    return (
                      <div style={{
                        marginTop: 12, padding: '8px 12px', borderRadius: 12, fontSize: 12,
                        background: remaining >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: remaining >= 0 ? '#16a34a' : '#dc2626',
                      }}>
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
              <div style={{
                ...glassCard,
                borderColor: selectedChannelId ? 'rgba(34,197,94,0.25)' : 'rgba(234,179,8,0.25)',
                animation: 'splitCardIn 0.32s ease-out 0.3s both',
              }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <p className="flex items-center gap-1" style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(30,30,60,0.4)' }}>
                    <span>ช่องทางรับเงิน</span>
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
                  </p>
                  <button onClick={() => setShowChannelManager(v => !v)}
                    style={{ fontSize: 12, color: '#f97316', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showChannelManager ? 'ยกเลิก' : '+ เพิ่มช่องทาง'}
                  </button>
                </div>

                {/* Add channel form */}
                {showChannelManager && (
                  <div className="space-y-2" style={{
                    marginBottom: 12, padding: 12, borderRadius: 16,
                    background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.1)',
                  }}>
                    <select value={newChType} onChange={e => setNewChType(e.target.value)}
                      style={{
                        width: '100%', fontSize: 13, padding: '8px 12px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)',
                        outline: 'none', color: '#1a1a2e',
                      }}>
                      {PAYMENT_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                    <input value={newChName} onChange={e => setNewChName(e.target.value)}
                      placeholder="ชื่อ (เช่น กสิกรไทย สาขาสยาม)"
                      style={{
                        width: '100%', fontSize: 13, padding: '8px 12px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)',
                        outline: 'none', color: '#1a1a2e',
                      }} />
                    <input value={newChDetail} onChange={e => setNewChDetail(e.target.value)}
                      placeholder="เลขบัญชี / เบอร์โทรศัพท์"
                      style={{
                        width: '100%', fontSize: 13, padding: '8px 12px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.06)',
                        outline: 'none', color: '#1a1a2e',
                      }} />
                    <button onClick={addChannel} disabled={!newChDetail.trim()}
                      style={{
                        width: '100%', padding: '8px 0', borderRadius: 12, fontSize: 13, fontWeight: 600,
                        background: 'linear-gradient(to right, #f97316, #ea580c)',
                        color: '#ffffff', border: 'none', cursor: 'pointer',
                        opacity: !newChDetail.trim() ? 0.4 : 1,
                      }}>
                      บันทึกช่องทาง
                    </button>
                  </div>
                )}

                {paymentChannels.length === 0 ? (
                  <div className="flex flex-col items-center" style={{ padding: '16px 0', color: 'rgba(30,30,60,0.35)' }}>
                    <svg className="w-6 h-6" style={{ marginBottom: 4, color: 'rgba(30,30,60,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    <p style={{ fontSize: 12 }}>ยังไม่มีช่องทางรับเงิน</p>
                    <p style={{ fontSize: 12 }}>กด &quot;+ เพิ่มช่องทาง&quot; เพื่อเพิ่ม</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentChannels.map(ch => {
                      const typeInfo = PAYMENT_TYPES.find(t => t.id === ch.type)
                      const sel = selectedChannelId === ch.id
                      return (
                        <label key={ch.id} className="flex items-center gap-3 cursor-pointer transition-all" style={{
                          padding: 12, borderRadius: 16,
                          border: sel ? '2px solid rgba(249,115,22,0.4)' : '2px solid rgba(0,0,0,0.04)',
                          background: sel ? 'rgba(249,115,22,0.04)' : 'transparent',
                        }}>
                          <input type="radio" name="channel" value={ch.id} checked={sel}
                            onChange={() => setSelectedChannelId(ch.id)} className="hidden" />
                          <span style={{ fontSize: 20 }} className="flex-shrink-0">{typeInfo?.icon ?? '💳'}</span>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{ch.name}</p>
                            <p style={{ fontSize: 12, color: 'rgba(30,30,60,0.45)', fontFamily: 'monospace' }}>{ch.detail}</p>
                          </div>
                          {sel && <span style={{ color: '#f97316', fontWeight: 700 }} className="flex-shrink-0">✓</span>}
                          <button onClick={e => { e.preventDefault(); deleteChannel(ch.id) }}
                            className="flex-shrink-0" style={{
                              color: 'rgba(30,30,60,0.2)', fontSize: 14, padding: 4,
                              background: 'none', border: 'none', cursor: 'pointer',
                            }}>
                            ✕
                          </button>
                        </label>
                      )
                    })}
                  </div>
                )}
                {paymentChannels.length > 0 && !selectedChannelId && (
                  <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>กรุณาเลือกช่องทางรับเงิน</p>
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
                className="w-full transition-all active:scale-[0.98]"
                style={{
                  height: 52, borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(to right, #f97316, #fbbf24)',
                  color: '#ffffff', fontWeight: 600, fontSize: 15,
                  boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
                  opacity: (saving || !amount || parseFloat(amount) <= 0 || (!payFromFund && (selectedIds.length === 0 || !selectedChannelId))) ? 0.4 : 1,
                  animation: 'splitCardIn 0.32s ease-out 0.36s both',
                }}>
                {saving
                  ? 'กำลังบันทึก...'
                  : payFromFund
                    ? 'ตัดจากกองกลาง'
                    : 'บันทึกรายการ'
                }
              </button>
            </>
          )}

          </div>
        </div>
      </div>

      <BottomNav activeTab="split" tourId={tourId} isChina={isChina} />

      {/* Keyframes */}
      <style>{`
        @keyframes splitCardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Sub-component: Split card ──
function SplitCard({ record, me, myRole, onSettle, onSettleAll, onDelete, fmt, idx = 0 }: {
  record: SplitRecord
  me: Member | null
  myRole: 'owe' | 'owed'
  onSettle?: (settleReceiptUrl?: string) => Promise<void>
  onSettleAll?: () => void
  onDelete?: () => void
  fmt: (n: number) => string
  idx?: number
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

  const accentColor = myRole === 'owe' ? '#ef4444' : '#22c55e'

  return (
    <div className="overflow-hidden" style={{
      ...glassCardNoPad,
      borderLeft: `4px solid ${accentColor}`,
      animation: `splitCardIn 0.32s ease-out ${idx * 0.06}s both`,
    }}>
      <div style={{ padding: '16px 16px 12px' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5" style={{ marginBottom: 4 }}>
              {cat && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 500,
                  background: 'rgba(255,255,255,0.7)', color: 'rgba(30,30,60,0.55)',
                  border: '1px solid rgba(255,255,255,0.88)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  {cat.label}
                </span>
              )}
            </div>
            <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{record.title}</p>
            <p style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)', marginTop: 2 }}>
              {myRole === 'owe'
                ? <>สร้างโดย <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{record.paidBy.name.split(' ')[0]}</span></>
                : <>คุณเปิดบิล</>
              }
              {' · '}{new Date(record.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="text-right flex items-start gap-2">
            {record.receiptUrl && (
              <button onClick={() => setShowReceipt(v => !v)}
                style={{
                  fontSize: 10, padding: '4px 8px', borderRadius: 8, fontWeight: 500,
                  background: 'rgba(255,255,255,0.7)', color: '#f97316',
                  border: '1px solid rgba(255,255,255,0.88)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                }}>
                สลิป
              </button>
            )}
            <div>
              <p style={{ fontWeight: 700, color: '#1a1a2e' }}>฿{fmt(record.amount)}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: myRole === 'owe' ? '#ef4444' : '#22c55e' }}>
                {myRole === 'owe'
                  ? `ฉันค้าง ฿${fmt(myParticipant?.share ?? 0)}`
                  : `รอรับ ฿${fmt(pendingParticipants.reduce((s, p) => s + p.share, 0))}`
                }
              </p>
            </div>
          </div>
        </div>

        {showReceipt && record.receiptUrl && (
          <img src={record.receiptUrl} alt="receipt" className="w-full object-contain" style={{ marginTop: 12, borderRadius: 16, maxHeight: 192 }} />
        )}

        {/* Payment channel — shown to people who owe */}
        {myRole === 'owe' && record.notes && (() => {
          try {
            const ch = JSON.parse(record.notes) as PaymentChannel
            const typeInfo = PAYMENT_TYPES.find(t => t.id === ch.type)
            return (
              <div className="flex items-center gap-3" style={{
                marginTop: 12, borderRadius: 16, padding: '10px 12px',
                background: 'rgba(59,130,246,0.05)',
                border: '1px solid rgba(59,130,246,0.1)',
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ fontSize: 20 }} className="flex-shrink-0">{typeInfo?.icon ?? '💳'}</span>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 10, color: '#3b82f6', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>โอนมาที่</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f' }}>{ch.name}</p>
                  <p style={{ fontSize: 12, color: '#3b82f6', fontFamily: 'monospace' }}>{ch.detail}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(ch.detail)}
                  className="flex-shrink-0 active:scale-95"
                  style={{
                    padding: '6px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                    background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                    border: 'none', cursor: 'pointer',
                  }}>
                  คัดลอก
                </button>
              </div>
            )
          } catch { return null }
        })()}
      </div>

      {/* Participants */}
      <div className="space-y-2" style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', padding: '12px 16px' }}>
        {record.participants.map(p => (
          <div key={p.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center rounded-full" style={{
                  width: 20, height: 20, fontSize: 9, fontWeight: 700,
                  background: p.isPaid ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)',
                  color: p.isPaid ? '#22c55e' : '#f97316',
                }}>{p.user.name[0]}</div>
                <span style={{ fontSize: 12, color: '#1a1a2e' }}>{p.userId === me?.id ? 'ฉัน' : p.user.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>฿{fmt(p.share)}</span>
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 6,
                  background: p.isPaid ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.08)',
                  color: p.isPaid ? '#22c55e' : '#f97316',
                }}>
                  {p.isPaid ? '✓ จ่ายแล้ว' : 'ค้าง'}
                </span>
              </div>
            </div>
            {/* Settle slip — visible to expense creator */}
            {myRole === 'owed' && p.isPaid && p.userId !== me?.id && (
              p.settleReceiptUrl
                ? <SettleSlipToggle url={p.settleReceiptUrl as string} name={p.user.name?.split(' ')[0] ?? ''} />
                : <p style={{ marginTop: 4, marginLeft: 28, fontSize: 10, color: 'rgba(30,30,60,0.25)' }}>ไม่มีสลิปแนบมา</p>
            )}
          </div>
        ))}
      </div>

      {/* Settle slip upload area */}
      {myRole === 'owe' && myParticipant && !myParticipant.isPaid && showSettleUpload && (
        <div className="space-y-2" style={{
          borderTop: '0.5px solid rgba(59,130,246,0.1)',
          padding: '12px 16px',
          background: 'rgba(59,130,246,0.03)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>แนบสลิปการโอนเงิน</p>
          <input ref={settleFileRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (!f) return
              setSettleFile(f)
              setSettlePreview(URL.createObjectURL(f))
            }} />
          {settlePreview ? (
            <div className="relative">
              <img src={settlePreview} alt="slip" className="w-full object-cover" style={{ height: 144, borderRadius: 16 }} />
              <button onClick={() => { setSettleFile(null); setSettlePreview(null) }}
                className="absolute flex items-center justify-center" style={{
                  top: 8, right: 8, width: 24, height: 24, borderRadius: 999,
                  background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 12,
                  border: 'none', cursor: 'pointer', backdropFilter: 'blur(8px)',
                }}>
                ×
              </button>
            </div>
          ) : (
            <button onClick={() => settleFileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1 transition-colors"
              style={{
                height: 80, borderRadius: 16, border: '2px dashed rgba(59,130,246,0.2)',
                color: 'rgba(59,130,246,0.5)', background: 'transparent', cursor: 'pointer',
              }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <span style={{ fontSize: 12 }}>เลือกรูปสลิป</span>
            </button>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setShowSettleUpload(false); setSettleFile(null); setSettlePreview(null) }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 500,
                background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)',
                color: 'rgba(30,30,60,0.5)', cursor: 'pointer',
              }}>
              ยกเลิก
            </button>
            <button onClick={confirmSettle} disabled={!settleFile || settling}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: '#22c55e', color: '#ffffff', border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(34,197,94,0.25)',
                opacity: (!settleFile || settling) ? 0.4 : 1,
              }}>
              {settling ? 'กำลังบันทึก...' : '✓ ยืนยันจ่ายแล้ว'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2" style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', padding: '10px 16px' }}>
        {myRole === 'owe' && myParticipant && !myParticipant.isPaid && !showSettleUpload && (
          <button onClick={() => setShowSettleUpload(true)}
            className="transition-all active:scale-[0.98]"
            style={{
              flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 600,
              background: '#22c55e', color: '#ffffff', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(34,197,94,0.25)',
            }}>
            ✓ ฉันจ่ายแล้ว
          </button>
        )}
        {myRole === 'owed' && pendingParticipants.length > 0 && (
          <button onClick={onSettleAll}
            className="transition-all active:scale-[0.98]"
            style={{
              flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 600,
              background: '#22c55e', color: '#ffffff', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(34,197,94,0.25)',
            }}>
            ✓ ปิดยอดทั้งหมด
          </button>
        )}
        {myRole === 'owed' && (
          <button onClick={onDelete}
            style={{
              padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 500,
              background: 'rgba(255,255,255,0.7)', color: 'rgba(30,30,60,0.45)',
              border: '1px solid rgba(255,255,255,0.88)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              cursor: 'pointer',
            }}>
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
    <div style={{ marginTop: 6, marginLeft: 28 }}>
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1"
        style={{ fontSize: 10, color: '#22c55e', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
        <span>{open ? 'ซ่อนสลิป' : `ดูสลิปจาก ${name}`}</span>
      </button>
      {open && (
        <img src={url} alt={`slip from ${name}`}
          className="w-full object-contain" style={{
            marginTop: 6, maxHeight: 208, borderRadius: 16,
            border: '1px solid rgba(34,197,94,0.15)',
          }} />
      )}
    </div>
  )
}
