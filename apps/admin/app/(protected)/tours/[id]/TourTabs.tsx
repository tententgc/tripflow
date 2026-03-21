'use client'

import { useState } from 'react'

const tabs = [
  { id: 'overview', label: '📋 ภาพรวม', shortLabel: '📋' },
  { id: 'flights', label: '✈️ เที่ยวบิน', shortLabel: '✈️' },
  { id: 'contacts', label: '📞 ผู้ติดต่อ', shortLabel: '📞' },
  { id: 'checklists', label: '✅ เช็คลิสต์', shortLabel: '✅' },
  { id: 'documents', label: '🎫 เอกสาร', shortLabel: '🎫' },
] as const

type TabId = typeof tabs[number]['id']

export default function TourTabs({
  overviewContent,
  flightsContent,
  contactsContent,
  checklistsContent,
  documentsContent,
}: {
  overviewContent: React.ReactNode
  flightsContent: React.ReactNode
  contactsContent: React.ReactNode
  checklistsContent: React.ReactNode
  documentsContent: React.ReactNode
}) {
  const [active, setActive] = useState<TabId>('overview')

  const content: Record<TabId, React.ReactNode> = {
    overview: overviewContent,
    flights: flightsContent,
    contacts: contactsContent,
    checklists: checklistsContent,
    documents: documentsContent,
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-1 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200 ${
              active === tab.id
                ? 'text-indigo-700 bg-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>{content[active]}</div>
    </div>
  )
}
