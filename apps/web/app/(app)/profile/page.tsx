'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useApi } from '@/lib/swr'

interface UserProfile {
  id: string
  name: string
  nameEn: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  passportNo: string | null
  passportExpiry: string | null
}

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 24px rgba(180,100,50,0.07)',
  borderRadius: '20px',
}

export default function ProfilePage() {
  const router = useRouter()
  const { data: profile, isLoading: loading, mutate } = useApi<UserProfile>('/api/auth/me')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [phone, setPhone] = useState('')
  const [passportNo, setPassportNo] = useState('')
  const [passportExpiry, setPassportExpiry] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (profile && !initialized) {
      setName(profile.name)
      setNameEn(profile.nameEn ?? '')
      setPhone(profile.phone ?? '')
      setPassportNo(profile.passportNo ?? '')
      setPassportExpiry(profile.passportExpiry ? new Date(profile.passportExpiry).toISOString().slice(0, 10) : '')
      setInitialized(true)
    }
  }, [profile, initialized])

  async function save() {
    setSaving(true)
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, nameEn: nameEn || null, phone: phone || null,
        passportNo: passportNo || null,
        passportExpiry: passportExpiry || null,
      }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      mutate()
    }
    setSaving(false)
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
        <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#f0f2f8] relative overflow-hidden">
      <style>{`
        @keyframes profCardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)' }} />
      </div>

      {/* Top bar */}
      <div className="relative z-10 px-4 pt-safe-top" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3 py-3 max-w-[680px] mx-auto">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-all flex-shrink-0 no-btn-fx"
            style={{ background: 'rgba(0,0,0,0.04)' }}
          >
            <svg className="w-4 h-4" style={{ color: 'rgba(30,30,60,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[15px] font-bold text-[#1a1a2e]">โปรไฟล์</h1>
        </div>
      </div>

      <div className="relative z-10 max-w-[680px] mx-auto flex flex-col gap-4" style={{ padding: '24px 16px 100px 16px' }}>

        {/* ═══ HERO ═══ */}
        <div className="rounded-[20px] text-center" style={{ ...glass, padding: '28px 20px', animation: 'profCardIn 0.3s ease-out 0s both' }}>
          <div className="relative mx-auto" style={{ width: 88, height: 88, marginBottom: 14 }}>
            <div className="w-[88px] h-[88px] rounded-full overflow-hidden flex items-center justify-center" style={{ border: '3px solid rgba(255,255,255,0.95)', boxShadow: '0 8px 28px rgba(180,100,50,0.2), 0 2px 8px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)' }}>
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="" width={88} height={88} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
              ) : (
                <span className="text-3xl font-bold text-[#f97316]">{profile.name[0]}</span>
              )}
            </div>
            {/* Edit badge */}
            <div className="absolute flex items-center justify-center" style={{ width: 26, height: 26, bottom: 2, right: 2, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #c2410c)', border: '2px solid rgba(255,255,255,0.95)', boxShadow: '0 2px 6px rgba(249,115,22,0.4)' }}>
              <svg className="w-3 h-3" style={{ color: '#f8f8fc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
              </svg>
            </div>
          </div>

          <p className="text-[20px] font-extrabold text-[#1a1a2e]" style={{ marginBottom: 4 }}>{profile.name}</p>
          <p className="text-[13px]" style={{ color: 'rgba(30,30,60,0.4)', marginBottom: 16 }}>{profile.email}</p>

          {/* Info pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {nameEn && (
              <span className="inline-flex items-center h-7 px-3 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.85)', color: 'rgba(30,30,60,0.55)', letterSpacing: '0.04em' }}>{nameEn}</span>
            )}
            {phone && (
              <span className="inline-flex items-center h-7 px-3 rounded-[20px] text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.85)', color: 'rgba(30,30,60,0.55)', letterSpacing: '0.04em' }}>{phone}</span>
            )}
            {passportNo && (
              <span className="inline-flex items-center h-7 px-3 rounded-[20px] text-[11px] font-semibold font-mono" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.85)', color: 'rgba(30,30,60,0.55)', letterSpacing: '0.08em' }}>{passportNo}</span>
            )}
          </div>
        </div>

        {/* ═══ FORM CARDS ═══ */}
        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-4">
          {/* Personal info */}
          <div className="rounded-[20px] overflow-hidden" style={{ ...glass, padding: 0, animation: 'profCardIn 0.3s ease-out 0.06s both' }}>
            <div className="flex items-center gap-2.5" style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(249,115,22,0.1)' }}>
                <svg className="w-4 h-4" style={{ color: '#fb923c' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <h3 className="text-[14px] font-bold text-[#1a1a2e]">ข้อมูลส่วนตัว</h3>
            </div>
            <div className="p-5 space-y-4">
              <GlassField label="ชื่อ-นามสกุล (ไทย)" value={name} onChange={setName} placeholder="ชื่อ-นามสกุล" />
              <GlassField label="ชื่อ EN (ตามพาสปอร์ต)" value={nameEn} onChange={setNameEn} placeholder="SOMCHAI JAIDEE" />
              <GlassField label="เบอร์โทรศัพท์" value={phone} onChange={setPhone} placeholder="+66-81-XXX-XXXX" type="tel" />
              <div>
                <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.08em' }}>อีเมล</label>
                <div className="h-[46px] flex items-center px-3.5 rounded-xl text-[14px]" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)', color: 'rgba(30,30,60,0.35)' }}>{profile.email}</div>
              </div>
            </div>
          </div>

          {/* Passport */}
          <div className="rounded-[20px] overflow-hidden" style={{ ...glass, padding: 0, animation: 'profCardIn 0.3s ease-out 0.12s both' }}>
            <div className="flex items-center gap-2.5" style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 6.166a3.001 3.001 0 015.003.006" /></svg>
              </div>
              <h3 className="text-[14px] font-bold text-[#1a1a2e]">พาสปอร์ต</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <GlassField label="เลขพาสปอร์ต" value={passportNo} onChange={setPassportNo} placeholder="AB1234567" mono />
                <div>
                  <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.08em' }}>วันหมดอายุ</label>
                  <input
                    type="date"
                    value={passportExpiry}
                    onChange={(e) => setPassportExpiry(e.target.value)}
                    className="w-full h-[46px] px-3.5 rounded-xl text-[14px] text-[#1a1a2e] focus:outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.85)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.45)'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 3px rgba(249,115,22,0.1)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.85)'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 4px rgba(0,0,0,0.04)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ACTIONS ═══ */}
        <div className="space-y-3 max-w-[400px] min-[900px]:mx-auto min-[900px]:w-full" style={{ animation: 'profCardIn 0.3s ease-out 0.18s both' }}>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full h-[54px] rounded-2xl text-[15px] font-bold no-btn-fx disabled:opacity-50 transition-all duration-200 active:scale-[0.98] hover:-translate-y-px"
            style={{
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.35)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 16px rgba(249,115,22,0.15)',
              color: '#f97316',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249,115,22,0.18)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(249,115,22,0.12)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.35)' }}
          >
            {saving ? 'กำลังบันทึก...' : saved ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                บันทึกแล้ว
              </span>
            ) : 'บันทึกข้อมูล'}
          </button>

          <button
            onClick={logout}
            className="w-full h-[46px] rounded-2xl text-[14px] font-semibold no-btn-fx flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}

function GlassField({ label, value, onChange, placeholder, type, mono }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; mono?: boolean
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'rgba(30,30,60,0.4)', letterSpacing: '0.08em' }}>{label}</label>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-[46px] px-3.5 rounded-xl text-[14px] text-[#1a1a2e] placeholder:text-[rgba(30,30,60,0.25)] focus:outline-none transition-all duration-200 ${mono ? 'font-mono tracking-wider' : ''}`}
        style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 4px rgba(0,0,0,0.04)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(249,115,22,0.45)'
          e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 3px rgba(249,115,22,0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.85)'
          e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 4px rgba(0,0,0,0.04)'
        }}
      />
    </div>
  )
}
