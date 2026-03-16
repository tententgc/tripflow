'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Phrase {
  id: string
  category: string
  thai: string
  english: string
  local: string
  localPinyin: string | null
}

const phraseCategories = [
  { id: 'ALL', label: 'ทั้งหมด', emoji: '📋' },
  { id: 'EMERGENCY', label: 'ฉุกเฉิน', emoji: '🆘' },
  { id: 'DIRECTIONS', label: 'ทิศทาง', emoji: '🗺️' },
  { id: 'FOOD', label: 'อาหาร', emoji: '🍜' },
  { id: 'SHOPPING', label: 'ช้อปปิ้ง', emoji: '🛍️' },
  { id: 'TRANSPORT', label: 'ขนส่ง', emoji: '🚇' },
  { id: 'HOTEL', label: 'โรงแรม', emoji: '🏨' },
  { id: 'COURTESY', label: 'มารยาท', emoji: '🙏' },
  { id: 'NUMBERS', label: 'ตัวเลข', emoji: '🔢' },
]

function PhraseCard({ phrase }: { phrase: Phrase }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(phrase.local).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <p className="text-gray-500 text-sm mb-1">{phrase.thai}</p>
      <p className="text-3xl font-bold text-gray-900 my-2">{phrase.local}</p>
      {phrase.localPinyin && (
        <p className="text-primary-600 text-base italic">{phrase.localPinyin}</p>
      )}
      <p className="text-gray-400 text-xs mt-1">{phrase.english}</p>

      <button
        onClick={copy}
        className="mt-3 w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium active:bg-gray-200 transition-colors"
      >
        {copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอกภาษาจีน'}
      </button>
    </div>
  )
}

export default function PhrasesPage() {
  const params = useParams()
  const tourId = params.id as string
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => {
        setPhrases(data.usefulPhrases ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tourId])

  const filtered = activeCategory === 'ALL'
    ? phrases
    : phrases.filter((p) => p.category === activeCategory)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-4 pt-safe-top pb-4">
        <div className="pt-4">
          <h1 className="text-xl font-bold text-gray-900">คำศัพท์จีน</h1>
          <p className="text-gray-500 text-sm mt-1">แตะเพื่อคัดลอกอักษรจีน</p>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {phraseCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-3xl mb-2">🀄</p>
            <p className="text-gray-600 font-medium">ยังไม่มีคำศัพท์</p>
            <p className="text-gray-400 text-sm mt-1">ผู้จัดทัวร์จะเพิ่มคำศัพท์ให้</p>
          </div>
        ) : (
          filtered.map((phrase) => (
            <PhraseCard key={phrase.id} phrase={phrase} />
          ))
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
        <div className="flex">
          {[
            { id: 'today', label: 'วันนี้', icon: '🏠', href: `/tour/${tourId}/today` },
            { id: 'itinerary', label: 'แผนเที่ยว', icon: '📅', href: `/tour/${tourId}/itinerary` },
            { id: 'checklist', label: 'เช็คลิสต์', icon: '✅', href: `/tour/${tourId}/checklist` },
            { id: 'phrases', label: 'คำศัพท์', icon: '🀄', href: `/tour/${tourId}/phrases` },
            { id: 'chat', label: 'ช่วยเหลือ', icon: '💬', href: `/tour/${tourId}/chat` },
          ].map((tab) => (
            <a
              key={tab.id}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
                tab.id === 'phrases' ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-0.5">{tab.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}
