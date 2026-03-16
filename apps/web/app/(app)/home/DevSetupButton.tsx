'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DevSetupButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function setup() {
    setLoading(true)
    try {
      const res = await fetch('/api/dev-setup', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMsg(`เพิ่มเข้าทริปแล้ว: ${data.addedToTours?.join(', ')}`)
        setTimeout(() => router.refresh(), 1000)
      } else {
        setMsg(data.error ?? 'เกิดข้อผิดพลาด')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={setup}
        disabled={loading}
        className="text-xs px-4 py-2 bg-orange-100 text-orange-700 rounded-xl font-medium hover:bg-orange-200 disabled:opacity-50"
      >
        {loading ? 'กำลังตั้งค่า...' : '⚡ Dev: เพิ่มตัวเองเข้าทริปตัวอย่าง'}
      </button>
      {msg && <p className="text-xs text-gray-500 mt-2">{msg}</p>}
    </div>
  )
}
