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

interface FundTransaction {
  id: string
  type: 'DEPOSIT' | 'WITHDRAWAL'
  amount: number
  description: string
  userId: string | null
  receiptUrl: string | null
  isPaid: boolean
  createdAt: string
  user: Member | null
  createdBy: Member
}

interface GroupFund {
  id: string
  name: string
  balance: number
  transactions: FundTransaction[]
}

type Tab = 'balance' | 'collect' | 'history'

export default function FundPage() {
  const params = useParams()
  const tourId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isChina, setIsChina] = useState(false)
  const [me, setMe] = useState<Member | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [fund, setFund] = useState<GroupFund | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('balance')

  // collect form
  const [collectAmount, setCollectAmount] = useState('')
  const [collectDesc, setCollectDesc] = useState('')
  const [collecting, setCollecting] = useState(false)

  // per-tx slip upload state
  const [uploadingTxId, setUploadingTxId] = useState<string | null>(null)
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string | null>(null)
  const [confirmTxId, setConfirmTxId] = useState<string | null>(null)
  const [submittingTxId, setSubmittingTxId] = useState<string | null>(null)

  // slip viewer
  const [viewingSlip, setViewingSlip] = useState<string | null>(null)

  const fmt = (n: number) => Math.ceil(n).toLocaleString('th-TH')

  const loadData = useCallback(async () => {
    const [tourRes, fundRes, meRes] = await Promise.all([
      fetch(`/api/tours/${tourId}`),
      fetch(`/api/tours/${tourId}/fund`),
      fetch('/api/auth/me'),
    ])
    const tourData = await tourRes.json()
    const fundData = await fundRes.json()
    const meData: Member = await meRes.json()

    setIsChina(tourData.isChina ?? false)
    const ms: Member[] = (tourData.members ?? []).map((m: { user: Member }) => m.user)
    setMembers(ms)
    setMe(meData)
    setFund(fundData ?? null)
    setLoading(false)
  }, [tourId])

  useEffect(() => { loadData() }, [loadData])

  // Ensure fund is created when page loads and none exists
  async function ensureFund() {
    if (fund) return fund
    const res = await fetch(`/api/tours/${tourId}/fund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json() as GroupFund
    setFund(data)
    return data
  }

  async function handleCollect() {
    if (!collectAmount || parseFloat(collectAmount) <= 0) return
    setCollecting(true)
    try {
      await ensureFund()
      const res = await fetch(`/api/tours/${tourId}/fund/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPerPerson: Math.ceil(parseFloat(collectAmount)),
          description: collectDesc.trim() || 'เรียกเก็บเงินกองกลาง',
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        alert(err.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      const updated = await res.json() as GroupFund
      setFund(updated)
      setCollectAmount('')
      setCollectDesc('')
      setTab('balance')
    } finally {
      setCollecting(false)
    }
  }

  function openSlipUpload(txId: string) {
    setUploadingTxId(txId)
    setSlipFile(null)
    setSlipPreview(null)
    setConfirmTxId(null)
    fileInputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadingTxId) return
    setSlipFile(file)
    setSlipPreview(URL.createObjectURL(file))
    setConfirmTxId(uploadingTxId)
    // reset input so same file can be picked again
    e.target.value = ''
  }

  async function submitSlip(txId: string) {
    if (!slipFile) return
    setSubmittingTxId(txId)
    try {
      let receiptUrl: string | null = null
      const fd = new FormData()
      fd.append('file', slipFile)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      if (uploadRes.ok) {
        const data = await uploadRes.json() as { url: string }
        receiptUrl = data.url
      }

      const res = await fetch(`/api/tours/${tourId}/fund/transactions/${txId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        alert(err.error ?? 'บันทึกไม่สำเร็จ')
        return
      }
      setConfirmTxId(null)
      setSlipFile(null)
      setSlipPreview(null)
      setUploadingTxId(null)
      await loadData()
    } finally {
      setSubmittingTxId(null)
    }
  }

  // Derived data
  const deposits = fund?.transactions.filter(t => t.type === 'DEPOSIT') ?? []
  const unpaidDeposits = deposits.filter(t => !t.isPaid)
  const paidDeposits = deposits.filter(t => t.isPaid)
  const myUnpaid = unpaidDeposits.filter(t => t.userId === me?.id)

  const totalExpected = deposits.reduce((s, t) => s + t.amount, 0)
  const totalCollected = paidDeposits.reduce((s, t) => s + t.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar
        title="กองกลาง"
        subtitle={fund ? `ยอดคงเหลือ ฿${fmt(fund.balance)}` : 'จัดการเงินกองกลางทริป'}
        gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
      />

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 sticky top-0 z-10">
        {([
          ['balance', '💰 ยอดเงิน'],
          ['collect', '📤 เรียกเก็บ'],
          ['history', '📋 ประวัติ'],
        ] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              tab === t
                ? 'text-emerald-600 border-b-2 border-emerald-500'
                : 'text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hidden file input for slip uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="px-4 py-4 space-y-3">

        {/* ── SLIP CONFIRM MODAL ── */}
        {confirmTxId && slipPreview && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-gray-100">
                <p className="font-semibold text-gray-900 text-center">ยืนยันสลิปโอนเงิน</p>
              </div>
              <div className="p-4">
                <img
                  src={slipPreview}
                  alt="slip"
                  className="w-full max-h-64 object-contain rounded-2xl bg-gray-100"
                />
              </div>
              <div className="flex gap-3 px-4 pb-6">
                <button
                  onClick={() => { setConfirmTxId(null); setSlipFile(null); setSlipPreview(null) }}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-medium text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => submitSlip(confirmTxId)}
                  disabled={submittingTxId === confirmTxId}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-200 disabled:opacity-60"
                >
                  {submittingTxId === confirmTxId ? 'กำลังบันทึก...' : 'ยืนยันจ่ายแล้ว'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SLIP VIEWER MODAL ── */}
        {viewingSlip && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setViewingSlip(null)}
          >
            <img
              src={viewingSlip}
              alt="receipt"
              className="max-w-full max-h-full rounded-2xl object-contain"
            />
          </div>
        )}

        {/* ── BALANCE TAB ── */}
        {tab === 'balance' && (
          <>
            {/* Fund balance card */}
            {!fund ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                <p className="text-4xl mb-3">💰</p>
                <p className="text-gray-700 font-semibold mb-1">ยังไม่มีกองกลาง</p>
                <p className="text-gray-400 text-sm mb-4">เริ่มเรียกเก็บเงินเพื่อสร้างกองกลางทริป</p>
                <button
                  onClick={() => setTab('collect')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-200"
                >
                  เรียกเก็บเงินรอบแรก
                </button>
              </div>
            ) : (
              <>
                {/* Main balance card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
                  <p className="text-sm text-white/70 mb-1">{fund.name}</p>
                  <p className="text-4xl font-bold">฿{fmt(fund.balance)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xs text-white/60">เรียกเก็บแล้ว</p>
                      <p className="text-sm font-semibold">฿{fmt(totalCollected)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">รอรับเงิน</p>
                      <p className="text-sm font-semibold">{unpaidDeposits.length} คน</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">สมาชิก</p>
                      <p className="text-sm font-semibold">{members.length} คน</p>
                    </div>
                  </div>
                  {totalExpected > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/70 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (totalCollected / totalExpected) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/50 mt-1">
                        {Math.round((totalCollected / totalExpected) * 100)}% ของที่เรียกเก็บ
                      </p>
                    </div>
                  )}
                </div>

                {/* My pending payment alert */}
                {myUnpaid.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="font-semibold text-amber-800 text-sm mb-2">
                      คุณยังค้างชำระ {myUnpaid.length} รายการ
                    </p>
                    {myUnpaid.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm text-gray-700 font-medium">{tx.description}</p>
                          <p className="text-xs text-gray-400">฿{fmt(tx.amount)}</p>
                        </div>
                        <button
                          onClick={() => openSlipUpload(tx.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-semibold"
                        >
                          จ่ายเงิน
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unpaid members section */}
                {unpaidDeposits.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 pt-4 pb-2">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                        สมาชิกที่ยังไม่จ่าย ({unpaidDeposits.length} คน)
                      </p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {unpaidDeposits.map(tx => (
                        <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500 flex-shrink-0 overflow-hidden">
                            {tx.user?.avatarUrl
                              ? <img src={tx.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              : tx.user?.name?.[0] ?? '?'
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tx.user?.name ?? 'ไม่ระบุ'}</p>
                            <p className="text-xs text-gray-400">{tx.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">฿{fmt(tx.amount)}</p>
                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                              ยังไม่จ่าย
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paid members section */}
                {paidDeposits.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 pt-4 pb-2">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                        สมาชิกที่จ่ายแล้ว ({paidDeposits.length} คน)
                      </p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {paidDeposits.map(tx => (
                        <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500 flex-shrink-0 overflow-hidden">
                            {tx.user?.avatarUrl
                              ? <img src={tx.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              : tx.user?.name?.[0] ?? '?'
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tx.user?.name ?? 'ไม่ระบุ'}</p>
                            <p className="text-xs text-gray-400">{tx.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">฿{fmt(tx.amount)}</p>
                            {tx.receiptUrl ? (
                              <button
                                onClick={() => setViewingSlip(tx.receiptUrl!)}
                                className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium"
                              >
                                ดูสลิป
                              </button>
                            ) : (
                              <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                                จ่ายแล้ว
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New collection round button */}
                <button
                  onClick={() => setTab('collect')}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-200 active:scale-[0.98] transition-transform"
                >
                  + เรียกเก็บเงินรอบใหม่
                </button>
              </>
            )}
          </>
        )}

        {/* ── COLLECT TAB ── */}
        {tab === 'collect' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
              <p className="font-semibold text-gray-800">เรียกเก็บเงินกองกลาง</p>

              {/* Amount per person */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 block">
                  จำนวนเงินต่อคน (฿)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">฿</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={collectAmount}
                    onChange={e => setCollectAmount(e.target.value)}
                    placeholder="500"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1.5 block">
                  รายละเอียด
                </label>
                <input
                  type="text"
                  value={collectDesc}
                  onChange={e => setCollectDesc(e.target.value)}
                  placeholder="เช่น ค่าทริปวันแรก, ค่าอาหารเย็น"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Summary preview */}
              {collectAmount && parseFloat(collectAmount) > 0 && members.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">฿{fmt(parseFloat(collectAmount))} × {members.length} คน</span>
                    <span className="font-bold text-emerald-700">
                      รวม ฿{fmt(parseFloat(collectAmount) * members.length)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    จะสร้าง {members.length} รายการให้สมาชิกแต่ละคน
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleCollect}
              disabled={collecting || !collectAmount || parseFloat(collectAmount) <= 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {collecting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังสร้างรายการ...
                </span>
              ) : (
                'เรียกเก็บ'
              )}
            </button>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <>
            {(!fund || fund.transactions.length === 0) ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-gray-500 text-sm">ยังไม่มีประวัติรายการ</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {fund.transactions.map(tx => {
                    const isDeposit = tx.type === 'DEPOSIT'
                    const date = new Date(tx.createdAt)
                    const dateStr = date.toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })
                    const timeStr = date.toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                          isDeposit ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                          {isDeposit ? '↑' : '↓'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {isDeposit ? (tx.user?.name ?? 'ไม่ระบุ') : tx.description}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {isDeposit ? tx.description : `โดย ${tx.createdBy.name}`}
                          </p>
                          <p className="text-[10px] text-gray-300 mt-0.5">{dateStr} {timeStr}</p>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <p className={`text-sm font-bold ${isDeposit ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isDeposit ? '+' : '-'}฿{fmt(tx.amount)}
                          </p>
                          {isDeposit && (
                            tx.isPaid ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                                จ่ายแล้ว
                              </span>
                            ) : (
                              <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                                รอจ่าย
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav activeTab="split" tourId={tourId} isChina={isChina} />
    </div>
  )
}
