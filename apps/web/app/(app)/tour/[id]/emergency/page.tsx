'use client'

import { useParams } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { useApi } from '@/lib/swr'

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
  const { data: tour, isLoading: loading } = useApi<TourData>(`/api/tours/${tourId}?fields=basic`)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isChina = tour?.isChina ?? false
  const emergencyNumbers = isChina ? CHINA_EMERGENCY_NUMBERS : GLOBAL_EMERGENCY_NUMBERS
  const emergencyContact = tour?.contacts.find((c) => c.type === 'EMERGENCY')

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar
        title="ฉุกเฉิน"
        subtitle="แตะเบอร์เพื่อโทรได้ทันที"
      />

      <div className="px-4 py-4 space-y-4">
        {/* Emergency numbers grid */}
        <div className="grid grid-cols-2 gap-3">
          {emergencyNumbers.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className={`${item.color} text-white rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] shadow-md active:opacity-80 transition-opacity`}
            >
              <span className="text-3xl mb-2">{item.icon}</span>
              <span className="text-2xl font-bold">{item.number}</span>
              <span className="text-sm mt-1 opacity-90">{item.label}</span>
            </a>
          ))}
        </div>

        {/* Emergency contact */}
        {emergencyContact && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📞 ผู้ติดต่อฉุกเฉิน</h3>
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900">{emergencyContact.name}</p>
              {emergencyContact.phone && (
                <a href={`tel:${emergencyContact.phone}`}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl text-sm font-medium shadow-sm">
                  โทร
                </a>
              )}
            </div>
          </div>
        )}

        {/* Thai Embassy contacts for China */}
        {isChina && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
              <h3 className="font-semibold text-orange-700">🇹🇭 สถานทูตและสถานกงสุลไทยในจีน</h3>
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
                  <span className="text-orange-500 text-xl">📞</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Insurance info */}
        {tour?.emergencyInfo?.insuranceCompany ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">🛡️ ประกันเดินทาง</h3>
            <p className="text-sm font-medium text-gray-900">{tour.emergencyInfo.insuranceCompany}</p>
            {tour.emergencyInfo.insurancePolicyNo && (
              <p className="text-sm text-gray-600 mt-1">กรมธรรม์: {tour.emergencyInfo.insurancePolicyNo}</p>
            )}
            {tour.emergencyInfo.insurancePhone && (
              <a href={`tel:${tour.emergencyInfo.insurancePhone}`} className="mt-3 flex items-center gap-2 text-orange-600 font-medium text-sm">
                <span>📞</span>
                <span>{tour.emergencyInfo.insurancePhone}</span>
              </a>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">🛡️ ประกันเดินทาง</h3>
            <p className="text-sm text-gray-600">กรุณาติดต่อบริษัทประกันของท่านโดยตรง</p>
          </div>
        )}

        {isChina && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">ℹ️ สายด่วนท่องเที่ยว 12301</h3>
            <p className="text-sm text-gray-600">มีบริการภาษาไทยและอังกฤษ โทรได้ 24 ชั่วโมง</p>
          </div>
        )}
      </div>

      <BottomNav activeTab="chat" tourId={tourId} isChina={isChina} />
    </div>
  )
}
