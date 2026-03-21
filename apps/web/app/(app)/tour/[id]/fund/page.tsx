'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi } from '@/lib/swr'

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

  const { data: tourData, isLoading: loadingTour } = useApi<{ isChina: boolean; members: Array<{ user: Member }> }>(`/api/tours/${tourId}`)
  const { data: fund, mutate: mutateFund } = useApi<GroupFund | null>(`/api/tours/${tourId}/fund`)
  const { data: me } = useApi<Member>('/api/auth/me')
  const isChina = tourData?.isChina ?? false
  const members: Member[] = (tourData?.members ?? []).map((m: { user: Member }) => m.user)
  const loading = loadingTour
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

  async function ensureFund() {
    if (fund) return fund
    const res = await fetch(`/api/tours/${tourId}/fund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json() as GroupFund
    mutateFund(data, false)
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
      mutateFund(updated, false)
      setCollectAmount('')
      setCollectDesc('')
      setTab('balance')
    } finally {
      setCollecting(false)
    }
  }

  async function deleteTx(txId: string) {
    if (!confirm('ต้องการลบ/ยกเลิกรายการนี้?')) return
    const res = await fetch(`/api/tours/${tourId}/fund/transactions/${txId}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string }
      alert(err.error ?? 'ลบไม่สำเร็จ')
      return
    }
    await mutateFund()
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
      await mutateFund()
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-indigo-50/20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const inputCls = 'w-full px-4 py-3 border border-gray-200/80 bg-white/50 backdrop-blur-sm rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-colors'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 pb-24">
      <TopBar
        title="กองกลาง"
        subtitle={fund ? `ยอดคงเหลือ ฿${fmt(fund.balance)}` : 'จัดการเงินกองกลางทริป'}
      />

      {/* Tabs — glass */}
      <div className="flex bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        {([
          ['balance', 'ยอดเงิน'],
          ['collect', 'เรียกเก็บ'],
          ['history', 'ประวัติ'],
        ] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-semibold transition-all ${
              tab === t
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      <div className="px-4 py-4 space-y-3">

        {/* ── SLIP CONFIRM MODAL ── */}
        {confirmTxId && slipPreview && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center p-4">
            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl w-full max-w-md overflow-hidden border border-gray-200/50">
              <div className="p-4 border-b border-gray-100/60">
                <p className="font-semibold text-gray-900 text-center">ยืนยันสลิปโอนเงิน</p>
              </div>
              <div className="p-4">
                <img src={slipPreview} alt="slip" className="w-full max-h-64 object-contain rounded-2xl bg-gray-50" />
              </div>
              <div className="flex gap-3 px-4 pb-6">
                <button
                  onClick={() => { setConfirmTxId(null); setSlipFile(null); setSlipPreview(null) }}
                  className="flex-1 py-3 rounded-2xl bg-white/80 border border-gray-200/60 text-gray-600 font-medium text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => submitSlip(confirmTxId)}
                  disabled={submittingTxId === confirmTxId}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm disabled:opacity-60"
                >
                  {submittingTxId === confirmTxId ? 'กำลังบันทึก...' : 'ยืนยันจ่ายแล้ว'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SLIP VIEWER ── */}
        {viewingSlip && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewingSlip(null)}>
            <img src={viewingSlip} alt="receipt" className="max-w-full max-h-full rounded-2xl object-contain" />
          </div>
        )}

        {/* ── BALANCE TAB ── */}
        {tab === 'balance' && (
          <>
            {!fund ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-semibold mb-1">ยังไม่มีกองกลาง</p>
                <p className="text-gray-400 text-sm mb-4">เริ่มเรียกเก็บเงินเพื่อสร้างกองกลางทริป</p>
                <button
                  onClick={() => setTab('collect')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white font-semibold text-sm shadow-sm shadow-indigo-200/50 active:scale-[0.98] transition-all"
                >
                  เรียกเก็บเงินรอบแรก
                </button>
              </div>
            ) : (
              <>
                {/* Main balance card — glass with emerald accent */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-200/50 p-5 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-emerald-100/30 blur-xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-[11px] text-emerald-500 font-semibold uppercase tracking-wider">{fund.name}</p>
                      <button
                        onClick={() => setTab('collect')}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] font-semibold active:scale-[0.97] transition-all"
                      >
                        + เรียกเก็บ
                      </button>
                    </div>
                    <p className="text-4xl font-bold text-emerald-700">฿{fmt(fund.balance)}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <p className="text-[11px] text-gray-400">เก็บแล้ว</p>
                        <p className="text-sm font-bold text-gray-900">฿{fmt(totalCollected)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] text-gray-400">รอรับ</p>
                        <p className="text-sm font-bold text-amber-600">{unpaidDeposits.length} คน</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400">สมาชิก</p>
                        <p className="text-sm font-bold text-gray-900">{members.length} คน</p>
                      </div>
                    </div>
                    {totalExpected > 0 && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-emerald-100/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (totalCollected / totalExpected) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {Math.round((totalCollected / totalExpected) * 100)}% ของที่เรียกเก็บ
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* My pending payment */}
                {myUnpaid.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-amber-200/50 p-4">
                    <p className="font-semibold text-amber-700 text-sm mb-2">
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
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-semibold active:scale-[0.97] transition-all"
                        >
                          จ่ายเงิน
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unpaid members */}
                {unpaidDeposits.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-indigo-100/30 bg-gradient-to-r from-indigo-50/50 to-violet-50/30">
                      <p className="text-[11px] text-indigo-500 font-semibold uppercase tracking-wider">
                        ยังไม่จ่าย ({unpaidDeposits.length})
                      </p>
                    </div>
                    <div className="divide-y divide-indigo-50/40">
                      {unpaidDeposits.map(tx => (
                        <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500 flex-shrink-0 overflow-hidden">
                            {tx.user?.avatarUrl
                              ? <img src={tx.user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              : tx.user?.name?.[0] ?? '?'
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tx.user?.name ?? 'ไม่ระบุ'}</p>
                            <p className="text-xs text-gray-400">{tx.description}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">฿{fmt(tx.amount)}</p>
                          <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-100/60 px-2 py-0.5 rounded-md font-medium">
                            ค้าง
                          </span>
                          <button
                            onClick={() => deleteTx(tx.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                            title="ยกเลิกรายการ"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Paid members */}
                {paidDeposits.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-indigo-100/30 bg-gradient-to-r from-emerald-50/50 to-teal-50/30">
                      <p className="text-[11px] text-emerald-500 font-semibold uppercase tracking-wider">
                        จ่ายแล้ว ({paidDeposits.length})
                      </p>
                    </div>
                    <div className="divide-y divide-indigo-50/40">
                      {paidDeposits.map(tx => (
                        <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500 flex-shrink-0 overflow-hidden">
                            {tx.user?.avatarUrl
                              ? <img src={tx.user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              : tx.user?.name?.[0] ?? '?'
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tx.user?.name ?? 'ไม่ระบุ'}</p>
                            <p className="text-xs text-gray-400">{tx.description}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">฿{fmt(tx.amount)}</p>
                          {tx.receiptUrl ? (
                            <button
                              onClick={() => setViewingSlip(tx.receiptUrl!)}
                              className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-2 py-0.5 rounded-md font-medium"
                            >
                              ดูสลิป
                            </button>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-2 py-0.5 rounded-md font-medium">
                              จ่ายแล้ว
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </>
            )}
          </>
        )}

        {/* ── COLLECT TAB ── */}
        {tab === 'collect' && (
          <div className="space-y-3">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-4 space-y-4">
              <p className="font-semibold text-gray-900 text-sm">เรียกเก็บเงินกองกลาง</p>

              <div>
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">จำนวนเงินต่อคน (฿)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-medium">฿</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={collectAmount}
                    onChange={e => setCollectAmount(e.target.value)}
                    placeholder="500"
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">รายละเอียด</label>
                <input
                  type="text"
                  value={collectDesc}
                  onChange={e => setCollectDesc(e.target.value)}
                  placeholder="เช่น ค่าทริปวันแรก, ค่าอาหารเย็น"
                  className={inputCls}
                />
              </div>

              {collectAmount && parseFloat(collectAmount) > 0 && members.length > 0 && (
                <div className="bg-indigo-50/60 backdrop-blur-sm border border-indigo-100/60 rounded-xl p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">฿{fmt(parseFloat(collectAmount))} x {members.length} คน</span>
                    <span className="font-bold text-indigo-700">
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white font-semibold text-sm shadow-sm shadow-indigo-200/50 disabled:opacity-50 active:scale-[0.98] transition-all"
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
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100/60 p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">ยังไม่มีประวัติรายการ</p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
                <div className="divide-y divide-indigo-50/40">
                  {fund.transactions.map(tx => {
                    const isDeposit = tx.type === 'DEPOSIT'
                    const date = new Date(tx.createdAt)
                    const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

                    return (
                      <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isDeposit ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'
                        }`}>
                          <svg className={`w-4 h-4 ${isDeposit ? 'text-emerald-500' : 'text-rose-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={isDeposit ? 'M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18' : 'M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3'} />
                          </svg>
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
                          <p className={`text-sm font-bold ${isDeposit ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {isDeposit ? '+' : '-'}฿{fmt(tx.amount)}
                          </p>
                          {isDeposit && (
                            tx.isPaid ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-1.5 py-0.5 rounded-md font-medium">
                                จ่ายแล้ว
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-100/60 px-1.5 py-0.5 rounded-md font-medium">
                                รอจ่าย
                              </span>
                            )
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => deleteTx(tx.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                          title="ลบรายการ"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
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
