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

  const inputCls = 'w-full px-4 py-3 border border-indigo-100 rounded-xl text-sm bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors text-gray-900 placeholder:text-gray-400'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30">
      {/* Header — glass */}
      <div className="bg-white/70 backdrop-blur-2xl border-b border-indigo-100/30 px-4 pt-safe-top relative overflow-hidden">
        <div className="absolute bottom-0 left-1/4 w-48 h-6 bg-indigo-200/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-1/3 w-36 h-6 bg-violet-200/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-3 py-3">
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

      <div className="px-4 pt-6 pb-32 max-w-lg mx-auto space-y-5">
        {/* Profile hero card */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
          {/* Gradient banner */}
          <div className="h-20 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.15),transparent)]" />
          </div>
          <div className="flex flex-col items-center -mt-10 pb-5 px-5">
            <div className="relative p-[3px] rounded-2xl bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-400 shadow-lg shadow-indigo-200/30">
              <div className="w-[76px] h-[76px] rounded-[14px] overflow-hidden bg-white flex items-center justify-center">
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt="" width={76} height={76} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                ) : (
                  <span className="text-2xl font-bold text-indigo-600">{profile.name[0]}</span>
                )}
              </div>
            </div>
            <p className="font-bold text-gray-900 mt-3 text-lg">{profile.name}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
            <h2 className="text-sm font-bold text-gray-900">ข้อมูลส่วนตัว</h2>
          </div>

          <div>
            <label className="text-[11px] text-indigo-500 font-semibold mb-1.5 block">ชื่อ-นามสกุล (ไทย)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="ชื่อ-นามสกุล" />
          </div>

          <div>
            <label className="text-[11px] text-indigo-500 font-semibold mb-1.5 block">ชื่อ (EN / ตามพาสปอร์ต)</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} placeholder="SOMCHAI JAIDEE" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-indigo-500 font-semibold mb-1.5 block">เบอร์โทรศัพท์</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className={inputCls} placeholder="+66-81-XXX-XXXX" />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 font-medium mb-1.5 block">อีเมล</label>
              <input value={profile.email} disabled className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Passport */}
        <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 6.166a3.001 3.001 0 015.003.006" /></svg>
            </div>
            <h2 className="text-sm font-bold text-gray-900">พาสปอร์ต</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-violet-500 font-semibold mb-1.5 block">เลขพาสปอร์ต</label>
              <input value={passportNo} onChange={(e) => setPassportNo(e.target.value)} className={`${inputCls} font-mono tracking-wider`} placeholder="AB1234567" />
            </div>
            <div>
              <label className="text-[11px] text-violet-500 font-semibold mb-1.5 block">วันหมดอายุ</label>
              <input type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

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
            className="w-full py-3 bg-white/50 backdrop-blur-md border border-red-200 text-red-500 rounded-2xl font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}
