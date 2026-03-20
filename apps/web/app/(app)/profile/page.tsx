'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  name: string
  nameEn: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  nationality: string
  passportNo: string | null
  passportExpiry: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data)
        setName(data.name)
        setNameEn(data.nameEn ?? '')
        setPhone(data.phone ?? '')
        setLoading(false)
      })
  }, [])

  async function save() {
    setSaving(true)
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, nameEn: nameEn || null, phone: phone || null }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 pt-safe-top pb-8">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white p-1">
            ←
          </button>
          <h1 className="text-lg font-bold">โปรไฟล์</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mt-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-4 border-white/40">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{profile.name[0]}</span>
            )}
          </div>
          <p className="text-white font-semibold mt-2">{profile.name}</p>
          <p className="text-primary-200 text-sm">{profile.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 -mt-4 space-y-3 pb-32">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900">แก้ไขข้อมูล</h2>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อ-นามสกุล (ภาษาไทย)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="สมชาย ใจดี"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อ-นามสกุล (ภาษาอังกฤษ / ตามพาสปอร์ต)</label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="SOMCHAI JAIDEE"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">เบอร์โทรศัพท์</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="+66-81-000-0000"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">อีเมล</label>
            <input
              value={profile.email}
              disabled
              className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">ไม่สามารถเปลี่ยนอีเมลได้</p>
          </div>

          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'กำลังบันทึก...' : saved ? '✓ บันทึกแล้ว' : 'บันทึกข้อมูล'}
          </button>
        </div>

        {/* Passport info (read-only, edit via operator) */}
        {(profile.passportNo || profile.passportExpiry) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">ข้อมูลพาสปอร์ต</h2>
            {profile.passportExpiry && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">วันหมดอายุ</span>
                <span className="font-medium text-gray-900">
                  {new Date(profile.passportExpiry).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">แก้ไขโดยผู้จัดทัวร์เท่านั้น</p>
          </div>
        )}

        {/* Logout */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <button
            onClick={logout}
            className="w-full px-5 py-4 text-left text-red-500 font-medium text-sm flex items-center gap-3 hover:bg-red-50 transition-colors"
          >
            <span className="text-xl">🚪</span>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}
