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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-indigo-50/20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const inputCls = 'w-full px-4 py-3 border border-gray-200/80 rounded-xl text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-colors'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20">
      {/* Header — glass */}
      <div className="relative">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 pt-safe-top">
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
      </div>

      <div className="px-4 pt-6 pb-32 max-w-lg mx-auto space-y-4">
        {/* Avatar card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100/60 p-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-50 flex items-center justify-center border border-indigo-100">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" width={80} height={80} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
            ) : (
              <span className="text-3xl font-bold text-indigo-600">{profile.name[0]}</span>
            )}
          </div>
          <p className="font-bold text-gray-900 mt-3">{profile.name}</p>
          <p className="text-sm text-gray-400">{profile.email}</p>
        </div>

        {/* Personal info */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100/60 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">ข้อมูลส่วนตัว</h2>

          <div>
            <label className="text-[11px] text-gray-400 font-medium mb-1 block">ชื่อ-นามสกุล (ไทย)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="ชื่อ-นามสกุล" />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 font-medium mb-1 block">ชื่อ (EN / ตามพาสปอร์ต)</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} placeholder="SOMCHAI JAIDEE" />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 font-medium mb-1 block">เบอร์โทรศัพท์</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className={inputCls} placeholder="+66-81-000-0000" />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 font-medium mb-1 block">อีเมล</label>
            <input value={profile.email} disabled className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400" />
          </div>
        </div>

        {/* Passport */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100/60 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">พาสปอร์ต</h2>

          <div>
            <label className="text-[11px] text-gray-400 font-medium mb-1 block">เลขพาสปอร์ต</label>
            <input value={passportNo} onChange={(e) => setPassportNo(e.target.value)} className={`${inputCls} font-mono`} placeholder="AB1234567" />
          </div>

          <div>
            <label className="text-[11px] text-gray-400 font-medium mb-1 block">วันหมดอายุ</label>
            <input type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving || !name.trim()}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึกข้อมูล'}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 bg-white/80 backdrop-blur-xl border border-red-100 text-red-500 rounded-2xl font-medium text-sm hover:bg-red-50 transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}
