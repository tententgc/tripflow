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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 relative overflow-hidden">
      {/* Decorative gradient blobs — scattered indigo/violet/purple */}
      {/* Top left */}
      <div className="fixed top-[-40px] left-[-40px] w-[280px] h-[280px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', opacity: 0.1, filter: 'blur(50px)' }} />
      {/* Top right */}
      <div className="fixed top-[5%] right-[-60px] w-[320px] h-[320px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)', opacity: 0.12, filter: 'blur(60px)' }} />
      {/* Center left */}
      <div className="fixed top-[35%] left-[-80px] w-[250px] h-[250px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)', opacity: 0.15, filter: 'blur(50px)' }} />
      {/* Center right */}
      <div className="fixed top-[45%] right-[10%] w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', opacity: 0.06, filter: 'blur(45px)' }} />
      {/* Bottom right — large */}
      <div className="fixed bottom-[-80px] right-[-60px] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, #a855f7 40%, transparent 70%)', opacity: 0.14, filter: 'blur(70px)' }} />
      {/* Bottom left */}
      <div className="fixed bottom-[10%] left-[5%] w-[220px] h-[220px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', opacity: 0.08, filter: 'blur(45px)' }} />
      {/* Bottom center */}
      <div className="fixed bottom-[-30px] left-[40%] w-[300px] h-[200px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)', opacity: 0.2, filter: 'blur(50px)' }} />

      {/* Top bar */}
      <div className="relative z-10 bg-white/70 backdrop-blur-2xl border-b border-indigo-100/30 px-4 pt-safe-top">
        <div className="flex items-center gap-3 py-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all flex-shrink-0 no-btn-fx"
          >
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[15px] font-bold text-gray-900">โปรไฟล์</h1>
        </div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-6 pb-32 max-w-4xl mx-auto page-content">
        {/* Profile hero — centered */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative p-[2.5px] rounded-full bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-400 shadow-lg shadow-indigo-200/30">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white flex items-center justify-center">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="" width={96} height={96} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
              ) : (
                <span className="text-3xl font-bold text-indigo-300">{profile.name[0]}</span>
              )}
            </div>
          </div>
          <h2 className="font-bold text-gray-900 text-lg mt-4">{profile.name}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{profile.email}</p>

          {/* Quick info pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {nameEn && (
              <span className="px-3 py-1.5 bg-white/60 backdrop-blur-sm border border-indigo-200/40 rounded-full text-xs text-gray-600 font-medium">{nameEn}</span>
            )}
            {phone && (
              <span className="px-3 py-1.5 bg-white/60 backdrop-blur-sm border border-indigo-200/40 rounded-full text-xs text-gray-600 font-medium">{phone}</span>
            )}
            {passportNo && (
              <span className="px-3 py-1.5 bg-white/60 backdrop-blur-sm border border-violet-200/40 rounded-full text-xs text-gray-600 font-mono tracking-wider">{passportNo}</span>
            )}
          </div>
        </div>

        {/* Form cards — 2 col on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Personal info */}
          <div className="bg-white/50 backdrop-blur-md rounded-3xl border border-indigo-200/40 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">ข้อมูลส่วนตัว</h3>
              </div>
              <div className="space-y-3">
                <FormField label="ชื่อ-นามสกุล (ไทย)" value={name} onChange={setName} placeholder="ชื่อ-นามสกุล" />
                <FormField label="ชื่อ EN (ตามพาสปอร์ต)" value={nameEn} onChange={setNameEn} placeholder="SOMCHAI JAIDEE" />
                <FormField label="เบอร์โทรศัพท์" value={phone} onChange={setPhone} placeholder="+66-81-XXX-XXXX" type="tel" />
                <div>
                  <label className="text-[11px] text-gray-400 font-medium mb-1.5 block">อีเมล</label>
                  <div className="px-4 py-3 bg-indigo-50/30 border border-indigo-100/40 rounded-xl text-sm text-gray-400">{profile.email}</div>
                </div>
              </div>
            </div>

            {/* Passport */}
            <div className="bg-white/50 backdrop-blur-md rounded-3xl border border-violet-200/40 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 6.166a3.001 3.001 0 015.003.006" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">พาสปอร์ต</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="เลขพาสปอร์ต" value={passportNo} onChange={setPassportNo} placeholder="AB1234567" mono />
                <div>
                  <label className="text-[11px] text-gray-400 font-medium mb-1.5 block">วันหมดอายุ</label>
                  <input
                    type="date"
                    value={passportExpiry}
                    onChange={(e) => setPassportExpiry(e.target.value)}
                    className="w-full px-4 py-3 border border-indigo-200/50 rounded-xl text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors"
                  />
                </div>
              </div>
            </div>

        </div>

        {/* Actions — full width below cards */}
        <div className="mt-6 space-y-3">
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-violet-300/40"
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
            className="w-full py-3 bg-red-50/50 backdrop-blur-sm border border-red-200/40 text-red-500 rounded-2xl font-medium text-sm hover:bg-red-100/50 hover:border-red-300/50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">{label}</span>
      <p className={`text-sm text-gray-700 mt-0.5 ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value || <span className="text-gray-300 italic font-sans">ไม่ได้ระบุ</span>}
      </p>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, type, mono }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; mono?: boolean
}) {
  return (
    <div>
      <label className="text-[11px] text-gray-400 font-medium mb-1.5 block">{label}</label>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-indigo-200/50 rounded-xl text-sm bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors text-gray-900 placeholder:text-gray-300 ${mono ? 'font-mono tracking-wider' : ''}`}
      />
    </div>
  )
}
