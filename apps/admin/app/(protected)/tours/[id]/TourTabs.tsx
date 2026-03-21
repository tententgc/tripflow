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
      <div className="flex border-b border-gray-200 mb-6 -mx-8 px-8 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 -mb-px ${
              active === tab.id
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
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
