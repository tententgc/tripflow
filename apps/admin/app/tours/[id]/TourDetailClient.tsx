'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tour {
  id: string
  status: string
}

export default function TourDetailClient({ tour }: { tour: Tour }) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)

  const statusOptions = [
    { value: 'DRAFT', label: 'ฉบับร่าง' },
    { value: 'PUBLISHED', label: 'เผยแพร่แล้ว' },
    { value: 'ACTIVE', label: 'กำลังเดินทาง' },
    { value: 'COMPLETED', label: 'เสร็จสิ้น' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
  ]

  async function updateStatus(status: string) {
    setUpdating(true)
    try {
      await fetch(`/api/tours/${tour.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        defaultValue={tour.status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={updating}
        className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <a
        href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/tour/${tour.id}/today`}
        target="_blank"
        rel="noreferrer"
        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50"
      >
        เปิดแอปนักเดินทาง ↗
      </a>
    </div>
  )
}
