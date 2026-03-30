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
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
        <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const inputCls = 'w-full px-4 py-3 bg-transparent border-b text-sm focus:outline-none transition-colors' +
    ' placeholder:text-[rgba(30,30,60,0.3)]'

  const glassCard = {
    background: 'rgba(255,255,255,0.62)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.88)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 20px rgba(0,0,0,0.05)',
    borderRadius: '20px',
  } as const

  return (
    <div className="min-h-screen bg-[#f0f2f8] relative overflow-hidden" style={{ paddingBottom: 100 }}>
      {/* Ambient gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10">
        <TopBar
          title="กองกลาง"
          subtitle={fund ? `ยอดคงเหลือ ฿${fmt(fund.balance)}` : 'จัดการเงินกองกลางทริป'}
        />

        {/* Tabs — glass pill */}
        <div className="sticky top-0 z-20 px-4 pt-3 pb-2">
          <div className="flex" style={{ ...glassCard, borderRadius: 16, padding: 4 }}>
            {([
              ['balance', 'ยอดเงิน'],
              ['collect', 'เรียกเก็บ'],
              ['history', 'ประวัติ'],
            ] as const).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 flex items-center justify-center transition-all"
                style={{
                  height: 36,
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: tab === t ? 700 : 500,
                  color: tab === t ? '#3d3a5c' : 'rgba(30,30,60,0.4)',
                  background: tab === t ? 'rgba(255,255,255,0.9)' : 'transparent',
                  boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

        <div className="max-w-[680px] mx-auto px-4 py-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── SLIP CONFIRM MODAL ── */}
          {confirmTxId && slipPreview && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0"
                style={{ zIndex: 999, background: 'rgba(15,10,30,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                onClick={() => { setConfirmTxId(null); setSlipFile(null); setSlipPreview(null) }}
              />
              {/* Modal */}
              <div
                className="fixed w-[92vw] max-w-md flex flex-col overflow-hidden"
                style={{
                  zIndex: 1000,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  maxHeight: '90vh',
                  ...glassCard,
                  borderRadius: 24,
                }}
              >
                <div className="p-4 flex-shrink-0" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                  <p className="text-center" style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 15 }}>ยืนยันสลิปโอนเงิน</p>
                </div>
                <div className="p-4 overflow-y-auto flex-shrink-1 min-h-0">
                  <img
                    src={slipPreview}
                    alt="slip"
                    className="w-full object-contain [@media(max-height:700px)]:max-h-[30vh]"
                    style={{ maxHeight: '40vh', borderRadius: 12, background: 'rgba(0,0,0,0.03)' }}
                  />
                </div>
                <div className="flex gap-3 px-4 pb-6 pt-2 flex-shrink-0">
                  <button
                    onClick={() => { setConfirmTxId(null); setSlipFile(null); setSlipPreview(null) }}
                    className="flex-1 py-3 text-sm font-medium"
                    style={{ borderRadius: 16, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.88)', color: 'rgba(30,30,60,0.5)' }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => submitSlip(confirmTxId)}
                    disabled={submittingTxId === confirmTxId}
                    className="flex-1 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ borderRadius: 16, background: 'linear-gradient(135deg, #10b981, #34d399)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                  >
                    {submittingTxId === confirmTxId ? 'กำลังบันทึก...' : 'ยืนยันจ่ายแล้ว'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── SLIP VIEWER ── */}
          {viewingSlip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,10,30,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={() => setViewingSlip(null)}>
              <img src={viewingSlip} alt="receipt" className="max-w-full max-h-full object-contain" style={{ borderRadius: 16 }} />
            </div>
          )}

          {/* ── BALANCE TAB ── */}
          {tab === 'balance' && (
            <>
              {!fund ? (
                <div className="p-8 text-center" style={{ ...glassCard, animation: 'fundCardIn 0.4s ease both' }}>
                  <div className="w-14 h-14 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: 16, background: 'rgba(249,115,22,0.08)' }}>
                    <svg className="w-7 h-7" style={{ color: '#f97316' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <p style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: 4 }}>ยังไม่มีกองกลาง</p>
                  <p style={{ color: 'rgba(30,30,60,0.4)', fontSize: 14, marginBottom: 16 }}>เริ่มเรียกเก็บเงินเพื่อสร้างกองกลางทริป</p>
                  <button
                    onClick={() => setTab('collect')}
                    className="px-6 py-3 text-sm font-semibold text-white active:scale-[0.98] transition-all"
                    style={{ borderRadius: 16, background: 'linear-gradient(135deg, #f97316, #fbbf24)', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}
                  >
                    เรียกเก็บเงินรอบแรก
                  </button>
                </div>
              ) : (
                <>
                  {/* Main balance card — glass with emerald accent */}
                  <div className="p-5 relative overflow-hidden" style={{ ...glassCard, borderLeft: '4px solid #10b981', animation: 'fundCardIn 0.3s ease both' }}>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-1">
                        <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' as const, color: '#10b981' }}>{fund.name}</p>
                        <button
                          onClick={() => setTab('collect')}
                          className="active:scale-[0.97] transition-all"
                          style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 12, fontWeight: 600 }}
                        >
                          + เรียกเก็บ
                        </button>
                      </div>
                      <p style={{ fontSize: 44, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.1 }}>฿{fmt(fund.balance)}</p>
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p style={{ fontSize: 11, color: 'rgba(30,30,60,0.4)', letterSpacing: '0.04em' }}>เก็บแล้ว</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>฿{fmt(totalCollected)}</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, background: 'rgba(0,0,0,0.06)' }} />
                        <div className="text-center">
                          <p style={{ fontSize: 11, color: 'rgba(30,30,60,0.4)', letterSpacing: '0.04em' }}>รอรับ</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>{unpaidDeposits.length} คน</p>
                        </div>
                        <div style={{ width: 0.5, height: 28, background: 'rgba(0,0,0,0.06)' }} />
                        <div className="text-right">
                          <p style={{ fontSize: 11, color: 'rgba(30,30,60,0.4)', letterSpacing: '0.04em' }}>สมาชิก</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{members.length} คน</p>
                        </div>
                      </div>
                      {totalExpected > 0 && (
                        <div className="mt-3">
                          <div className="overflow-hidden" style={{ height: 4, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }}>
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${Math.min(100, (totalCollected / totalExpected) * 100)}%`,
                                borderRadius: 4,
                                background: 'linear-gradient(90deg, #10b981, #34d399)',
                                boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                              }}
                            />
                          </div>
                          <p style={{ fontSize: 10, color: 'rgba(30,30,60,0.4)', marginTop: 4 }}>
                            {Math.round((totalCollected / totalExpected) * 100)}% ของที่เรียกเก็บ
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* My pending payment */}
                  {myUnpaid.length > 0 && (
                    <div className="p-4" style={{ ...glassCard, borderLeft: '4px solid #f97316', animation: 'fundCardIn 0.35s ease both' }}>
                      <p style={{ fontWeight: 600, color: '#f97316', fontSize: 14, marginBottom: 8 }}>
                        คุณยังค้างชำระ {myUnpaid.length} รายการ
                      </p>
                      {myUnpaid.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-2">
                          <div>
                            <p style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 500 }}>{tx.description}</p>
                            <p style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)' }}>฿{fmt(tx.amount)}</p>
                          </div>
                          <button
                            onClick={() => openSlipUpload(tx.id)}
                            className="px-4 py-1.5 text-xs font-semibold text-white active:scale-[0.97] transition-all"
                            style={{ borderRadius: 14, background: 'linear-gradient(135deg, #f97316, #fb923c)', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}
                          >
                            จ่ายเงิน
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unpaid members */}
                  {unpaidDeposits.length > 0 && (
                    <div className="overflow-hidden" style={{ ...glassCard, animation: 'fundCardIn 0.4s ease both' }}>
                      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' as const, color: 'rgba(30,30,60,0.4)' }}>
                          ยังไม่จ่าย
                        </p>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'rgba(249,115,22,0.08)', color: '#f97316' }}>
                          {unpaidDeposits.length}
                        </span>
                      </div>
                      <div>
                        {unpaidDeposits.map((tx, i) => (
                          <div key={tx.id} className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: i < unpaidDeposits.length - 1 ? '0.5px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <div className="flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(30,30,60,0.06)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontSize: 14, fontWeight: 600, color: 'rgba(30,30,60,0.4)' }}>
                              {tx.user?.avatarUrl
                                ? <img src={tx.user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                : tx.user?.name?.[0] ?? '?'
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate" style={{ fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>{tx.user?.name ?? 'ไม่ระบุ'}</p>
                              <p className="truncate" style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)' }}>{tx.description}</p>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>฿{fmt(tx.amount)}</p>
                            <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
                              ค้าง
                            </span>
                            <button
                              onClick={() => deleteTx(tx.id)}
                              className="p-1 flex-shrink-0 transition-colors"
                              style={{ color: 'rgba(30,30,60,0.2)' }}
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
                    <div className="overflow-hidden" style={{ ...glassCard, animation: 'fundCardIn 0.45s ease both' }}>
                      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' as const, color: 'rgba(30,30,60,0.4)' }}>
                          จ่ายแล้ว
                        </p>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                          {paidDeposits.length}
                        </span>
                      </div>
                      <div>
                        {paidDeposits.map((tx, i) => (
                          <div key={tx.id} className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: i < paidDeposits.length - 1 ? '0.5px solid rgba(0,0,0,0.04)' : 'none' }}>
                            <div className="flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(30,30,60,0.06)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontSize: 14, fontWeight: 600, color: 'rgba(30,30,60,0.4)' }}>
                              {tx.user?.avatarUrl
                                ? <img src={tx.user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                : tx.user?.name?.[0] ?? '?'
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate" style={{ fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>{tx.user?.name ?? 'ไม่ระบุ'}</p>
                              <p className="truncate" style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)' }}>{tx.description}</p>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>฿{fmt(tx.amount)}</p>
                            {tx.receiptUrl ? (
                              <button
                                onClick={() => setViewingSlip(tx.receiptUrl!)}
                                style={{ fontSize: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}
                              >
                                ดูสลิป
                              </button>
                            ) : (
                              <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="p-5" style={{ ...glassCard, animation: 'fundCardIn 0.3s ease both' }}>
                <p style={{ fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' as const, color: 'rgba(30,30,60,0.4)', marginBottom: 16 }}>เรียกเก็บเงินกองกลาง</p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: 'rgba(30,30,60,0.4)', fontWeight: 500, marginBottom: 4, display: 'block' }}>จำนวนเงินต่อคน (฿)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium" style={{ color: '#f97316' }}>฿</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={collectAmount}
                      onChange={e => setCollectAmount(e.target.value)}
                      placeholder="500"
                      className={`${inputCls} pl-8`}
                      style={{ borderColor: 'rgba(0,0,0,0.06)', color: '#1a1a2e' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: 'rgba(30,30,60,0.4)', fontWeight: 500, marginBottom: 4, display: 'block' }}>รายละเอียด</label>
                  <input
                    type="text"
                    value={collectDesc}
                    onChange={e => setCollectDesc(e.target.value)}
                    placeholder="เช่น ค่าทริปวันแรก, ค่าอาหารเย็น"
                    className={inputCls}
                    style={{ borderColor: 'rgba(0,0,0,0.06)', color: '#1a1a2e' }}
                  />
                </div>

                {collectAmount && parseFloat(collectAmount) > 0 && members.length > 0 && (
                  <div className="p-3" style={{ borderRadius: 14, background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}>
                    <div className="flex justify-between items-center" style={{ fontSize: 14 }}>
                      <span style={{ color: 'rgba(30,30,60,0.5)' }}>฿{fmt(parseFloat(collectAmount))} x {members.length} คน</span>
                      <span style={{ fontWeight: 700, color: '#f97316' }}>
                        รวม ฿{fmt(parseFloat(collectAmount) * members.length)}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)', marginTop: 4 }}>
                      จะสร้าง {members.length} รายการให้สมาชิกแต่ละคน
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleCollect}
                disabled={collecting || !collectAmount || parseFloat(collectAmount) <= 0}
                className="w-full font-semibold text-sm text-white disabled:opacity-50 active:scale-[0.98] transition-all"
                style={{ height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #f97316, #fbbf24)', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}
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
                <div className="p-10 text-center" style={{ ...glassCard, animation: 'fundCardIn 0.3s ease both' }}>
                  <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: 16, background: 'rgba(249,115,22,0.08)' }}>
                    <svg className="w-6 h-6" style={{ color: 'rgba(30,30,60,0.25)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p style={{ color: 'rgba(30,30,60,0.4)', fontSize: 14 }}>ยังไม่มีประวัติรายการ</p>
                </div>
              ) : (
                <div className="overflow-hidden" style={{ ...glassCard, animation: 'fundCardIn 0.3s ease both' }}>
                  <div>
                    {fund.transactions.map((tx, i) => {
                      const isDeposit = tx.type === 'DEPOSIT'
                      const date = new Date(tx.createdAt)
                      const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                      const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

                      return (
                        <div key={tx.id} className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: i < fund.transactions.length - 1 ? '0.5px solid rgba(0,0,0,0.04)' : 'none', animation: `fundCardIn ${0.3 + i * 0.04}s ease both` }}>
                          <div className="flex items-center justify-center flex-shrink-0" style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: isDeposit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          }}>
                            <svg className="w-4 h-4" style={{ color: isDeposit ? '#10b981' : '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={isDeposit ? 'M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18' : 'M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3'} />
                            </svg>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="truncate" style={{ fontSize: 14, fontWeight: 500, color: '#1a1a2e' }}>
                              {isDeposit ? (tx.user?.name ?? 'ไม่ระบุ') : tx.description}
                            </p>
                            <p className="truncate" style={{ fontSize: 12, color: 'rgba(30,30,60,0.4)' }}>
                              {isDeposit ? tx.description : `โดย ${tx.createdBy.name}`}
                            </p>
                            <p style={{ fontSize: 10, color: 'rgba(30,30,60,0.25)', marginTop: 2 }}>{dateStr} {timeStr}</p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <p style={{ fontSize: 14, fontWeight: 700, color: isDeposit ? '#10b981' : '#ef4444' }}>
                              {isDeposit ? '+' : '-'}฿{fmt(tx.amount)}
                            </p>
                            {isDeposit && (
                              tx.isPaid ? (
                                <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 6px', borderRadius: 6, fontWeight: 500 }}>
                                  จ่ายแล้ว
                                </span>
                              ) : (
                                <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 6px', borderRadius: 6, fontWeight: 500 }}>
                                  รอจ่าย
                                </span>
                              )
                            )}
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => deleteTx(tx.id)}
                            className="p-1 flex-shrink-0 transition-colors"
                            style={{ color: 'rgba(30,30,60,0.2)' }}
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
      </div>

      <BottomNav activeTab="split" tourId={tourId} isChina={isChina} />

      {/* Stagger animation keyframe */}
      <style>{`
        @keyframes fundCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
