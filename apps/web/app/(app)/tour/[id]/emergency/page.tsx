'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const CHINA_EMERGENCY_NUMBERS = [
  { number: '110', label: 'ตำรวจ', icon: '👮', color: 'bg-blue-600' },
  { number: '120', label: 'รถพยาบาล', icon: '🚑', color: 'bg-red-600' },
  { number: '119', label: 'ดับเพลิง', icon: '🚒', color: 'bg-orange-600' },
  { number: '12301', label: 'สายท่องเที่ยว', icon: 'ℹ️', color: 'bg-green-600' },
]

const GLOBAL_EMERGENCY_NUMBERS = [
  { number: '191', label: 'ตำรวจ', icon: '👮', color: 'bg-blue-600' },
  { number: '1669', label: 'รถพยาบาล', icon: '🚑', color: 'bg-red-600' },
  { number: '199', label: 'ดับเพลิง', icon: '🚒', color: 'bg-orange-600' },
  { number: '1155', label: 'สายด่วนท่องเที่ยว', icon: '🛈', color: 'bg-green-600' },
]

const THAI_EMBASSIES_CHINA = [
  { city: 'ปักกิ่ง (สถานทูต)', phone: '+86-10-6532-4985' },
  { city: 'เซี่ยงไฮ้ (สถานกงสุล)', phone: '+86-21-6288-2088' },
  { city: 'กวางโจว (สถานกงสุล)', phone: '+86-20-8385-8988' },
  { city: 'เฉิงตู (สถานกงสุล)', phone: '+86-28-6618-0109' },
  { city: 'คุนหมิง (สถานกงสุล)', phone: '+86-871-6316-8916' },
  { city: 'เซียะเหมิน (สถานกงสุล)', phone: '+86-592-5112-313' },
]

interface TourData {
  id: string
  title: string
  isChina: boolean
  emergencyInfo?: {
    insuranceCompany?: string | null
    insurancePhone?: string | null
    insurancePolicyNo?: string | null
    thaiEmbassyPhone?: string | null
    thaiEmbassyAddress?: string | null
    chinaVisaHotline?: string | null
  } | null
  contacts: Array<{ id: string; name: string; phone: string | null; type: string }>
}

export default function EmergencyPage() {
  const params = useParams()
  const tourId = params.id as string
  const [tour, setTour] = useState<TourData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => { setTour(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tourId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isChina = tour?.isChina ?? false
  const emergencyNumbers = isChina ? CHINA_EMERGENCY_NUMBERS : GLOBAL_EMERGENCY_NUMBERS
  const emergencyContact = tour?.contacts.find((c) => c.type === 'EMERGENCY')

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-red-600 text-white px-4 pt-safe-top pb-6">
        <div className="pt-4">
          <h1 className="text-xl font-bold">ฉุกเฉิน</h1>
          <p className="text-red-200 text-sm mt-1">แตะเบอร์เพื่อโทรได้ทันที</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Emergency numbers grid */}
        <div className="grid grid-cols-2 gap-3">
          {emergencyNumbers.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className={`${item.color} text-white rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] active:opacity-80 transition-opacity`}
            >
              <span className="text-3xl mb-2">{item.icon}</span>
              <span className="text-2xl font-bold">{item.number}</span>
              <span className="text-sm mt-1 opacity-90">{item.label}</span>
            </a>
          ))}
        </div>

        {/* Guide / Emergency contact */}
        {emergencyContact && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📞 ผู้ติดต่อฉุกเฉิน</h3>
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{emergencyContact.name}</p>
              {emergencyContact.phone && (
                <a href={`tel:${emergencyContact.phone}`} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">
                  โทร
                </a>
              )}
            </div>
          </div>
        )}

        {/* Thai Embassy contacts for China */}
        {isChina && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">🇹🇭 สถานทูตและสถานกงสุลไทยในจีน</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {THAI_EMBASSIES_CHINA.map((embassy) => (
                <a
                  key={embassy.city}
                  href={`tel:${embassy.phone}`}
                  className="flex items-center justify-between px-4 py-3 min-h-[56px] active:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{embassy.city}</p>
                    <p className="text-sm text-gray-500">{embassy.phone}</p>
                  </div>
                  <span className="text-primary-600 text-xl">📞</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Insurance info */}
        {tour?.emergencyInfo?.insuranceCompany ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">🛡️ ประกันเดินทาง</h3>
            <p className="text-sm font-medium text-gray-900">{tour.emergencyInfo.insuranceCompany}</p>
            {tour.emergencyInfo.insurancePolicyNo && (
              <p className="text-sm text-gray-600 mt-1">กรมธรรม์: {tour.emergencyInfo.insurancePolicyNo}</p>
            )}
            {tour.emergencyInfo.insurancePhone && (
              <a href={`tel:${tour.emergencyInfo.insurancePhone}`} className="mt-3 flex items-center gap-2 text-primary-600 font-medium text-sm">
                <span>📞</span>
                <span>{tour.emergencyInfo.insurancePhone}</span>
              </a>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">🛡️ ประกันเดินทาง</h3>
            <p className="text-sm text-gray-600">กรุณาติดต่อบริษัทประกันของท่านโดยตรง</p>
          </div>
        )}

        {/* China tourist hotline */}
        {isChina && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">ℹ️ สายด่วนท่องเที่ยว 12301</h3>
            <p className="text-sm text-gray-600">มีบริการภาษาไทยและอังกฤษ โทรได้ 24 ชั่วโมง</p>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
        <div className="flex">
          {[
            { id: 'today', label: 'วันนี้', icon: '🏠', href: `/tour/${tourId}/today` },
            { id: 'itinerary', label: 'แผนเที่ยว', icon: '📅', href: `/tour/${tourId}/itinerary` },
            { id: 'checklist', label: 'เช็คลิสต์', icon: '✅', href: `/tour/${tourId}/checklist` },
            { id: 'chat', label: 'ช่วยเหลือ', icon: '💬', href: `/tour/${tourId}/chat` },
          ].map((tab) => (
            <a
              key={tab.id}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-gray-400"
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
