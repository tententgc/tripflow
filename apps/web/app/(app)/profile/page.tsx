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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30">
      {/* Top bar */}
      <div className="bg-white/70 backdrop-blur-2xl border-b border-indigo-100/30 px-4 pt-safe-top">
        <div className="flex items-center gap-3 py-3 max-w-lg mx-auto">
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

      <div className="px-4 pt-8 pb-32 max-w-lg mx-auto">
        {/* Avatar + name — centered */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative p-[2.5px] rounded-full bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-400 shadow-lg shadow-indigo-200/40">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white flex items-center justify-center">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="" width={96} height={96} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
              ) : (
                <span className="text-3xl font-bold text-indigo-600">{profile.name[0]}</span>
              )}
            </div>
          </div>
          <p className="font-bold text-gray-900 mt-4 text-lg">{profile.name}</p>
          <p className="text-sm text-gray-400 mt-0.5">{profile.email}</p>
        </div>

        {/* Form sections */}
        <div className="space-y-6">
          {/* Personal info */}
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1.5 h-4 rounded-full bg-indigo-500" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">ข้อมูลส่วนตัว</h2>
            </div>
            <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm divide-y divide-gray-100/60">
              <Field label="ชื่อ-นามสกุล (ไทย)" value={name} onChange={setName} placeholder="ชื่อ-นามสกุล" />
              <Field label="ชื่อ EN (ตามพาสปอร์ต)" value={nameEn} onChange={setNameEn} placeholder="SOMCHAI JAIDEE" />
              <Field label="เบอร์โทรศัพท์" value={phone} onChange={setPhone} placeholder="+66-81-XXX-XXXX" type="tel" />
              <div className="px-4 py-3.5 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">อีเมล</span>
                <span className="text-sm text-gray-400">{profile.email}</span>
              </div>
            </div>
          </section>

          {/* Passport */}
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1.5 h-4 rounded-full bg-violet-500" />
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">พาสปอร์ต</h2>
            </div>
            <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm divide-y divide-gray-100/60">
              <Field label="เลขพาสปอร์ต" value={passportNo} onChange={setPassportNo} placeholder="AB1234567" mono />
              <div className="px-4 py-3.5 flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400 font-medium flex-shrink-0">วันหมดอายุ</span>
                <input
                  type="date"
                  value={passportExpiry}
                  onChange={(e) => setPassportExpiry(e.target.value)}
                  className="text-sm text-right text-gray-900 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={save}
              disabled={saving || !name.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.98] shadow-md shadow-indigo-200/30"
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
              className="w-full py-3 text-red-400 rounded-2xl font-medium text-sm hover:text-red-600 hover:bg-red-50/50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Inline field row ── */
function Field({ label, value, onChange, placeholder, type, mono }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; mono?: boolean
}) {
  return (
    <div className="px-4 py-3.5 flex items-center justify-between gap-4">
      <span className="text-xs text-gray-400 font-medium flex-shrink-0">{label}</span>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`text-sm text-right text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-300 min-w-0 flex-1 ${mono ? 'font-mono tracking-wider' : ''}`}
      />
    </div>
  )
}
