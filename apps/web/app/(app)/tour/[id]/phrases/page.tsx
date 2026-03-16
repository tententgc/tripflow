import { Metadata } from 'next'

export const metadata: Metadata = { title: 'คำศัพท์จีน — TripFlow' }

const phraseCategories = [
  { id: 'EMERGENCY', label: 'ฉุกเฉิน', emoji: '🆘' },
  { id: 'DIRECTIONS', label: 'ทิศทาง', emoji: '🗺️' },
  { id: 'FOOD', label: 'อาหาร', emoji: '🍜' },
  { id: 'SHOPPING', label: 'ช้อปปิ้ง', emoji: '🛍️' },
  { id: 'TRANSPORT', label: 'ขนส่ง', emoji: '🚇' },
  { id: 'HOTEL', label: 'โรงแรม', emoji: '🏨' },
  { id: 'COURTESY', label: 'มารยาท', emoji: '🙏' },
  { id: 'NUMBERS', label: 'ตัวเลข', emoji: '🔢' },
]

const mockPhrases = [
  { id: 'p1', category: 'EMERGENCY', thai: 'ช่วยด้วย!', english: 'Help!', local: '救命!', localPinyin: 'Jiùmìng!' },
  { id: 'p2', category: 'DIRECTIONS', thai: 'ห้องน้ำอยู่ที่ไหน', english: 'Where is the toilet?', local: '厕所在哪里？', localPinyin: 'Cèsuǒ zài nǎlǐ?' },
  { id: 'p3', category: 'FOOD', thai: 'ฉันกินเผ็ดไม่ได้', english: 'I cannot eat spicy food', local: '我不能吃辣', localPinyin: 'Wǒ bù néng chī là' },
  { id: 'p4', category: 'FOOD', thai: 'อร่อยมาก!', english: 'Very delicious!', local: '非常好吃！', localPinyin: 'Fēicháng hǎochī!' },
  { id: 'p5', category: 'SHOPPING', thai: 'ลดราคาได้ไหม', english: 'Can you lower the price?', local: '可以便宜一点吗？', localPinyin: 'Kěyǐ piányí yīdiǎn ma?' },
  { id: 'p6', category: 'SHOPPING', thai: 'ราคาเท่าไร', english: 'How much is this?', local: '多少钱？', localPinyin: 'Duōshǎo qián?' },
  { id: 'p7', category: 'HOTEL', thai: 'เช็คอิน', english: 'Check in', local: '我要办理入住', localPinyin: 'Wǒ yào bànlǐ rùzhù' },
  { id: 'p8', category: 'COURTESY', thai: 'ขอบคุณ', english: 'Thank you', local: '谢谢', localPinyin: 'Xièxiè' },
  { id: 'p9', category: 'COURTESY', thai: 'สวัสดี', english: 'Hello', local: '你好', localPinyin: 'Nǐ hǎo' },
]

function PhraseCard({ phrase }: { phrase: typeof mockPhrases[0] }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <p className="text-gray-500 text-sm mb-1">{phrase.thai}</p>
      <p className="text-3xl font-bold text-gray-900 my-2">{phrase.local}</p>
      <p className="text-primary-600 text-base italic">{phrase.localPinyin}</p>
      <p className="text-gray-400 text-xs mt-1">{phrase.english}</p>

      <div className="flex gap-2 mt-3">
        <button
          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium touch-target"
          onClick={() => {}}
        >
          📋 คัดลอก
        </button>
        <button
          className="flex-1 py-2 bg-primary-50 text-primary-700 rounded-xl text-sm font-medium touch-target"
          onClick={() => {}}
        >
          🔊 ฟังเสียง
        </button>
      </div>
    </div>
  )
}

export default function PhrasesPage({ params: _params }: { params: { id: string } }) {
  const categories = phraseCategories

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-4 pt-safe-top pb-4">
        <div className="pt-4">
          <h1 className="text-xl font-bold text-gray-900">คำศัพท์จีน</h1>
          <p className="text-gray-500 text-sm mt-1">ภาษาจีนสำหรับนักเดินทาง</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-700 touch-target whitespace-nowrap"
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {mockPhrases.map((phrase) => (
          <PhraseCard key={phrase.id} phrase={phrase} />
        ))}
      </div>

      <BottomNav activeTab="phrases" tourId="tour-1" />
    </div>
  )
}

function BottomNav({ activeTab, tourId }: { activeTab: string; tourId: string }) {
  const tabs = [
    { id: 'today', label: 'วันนี้', icon: '🏠', href: `/tour/${tourId}/today` },
    { id: 'itinerary', label: 'แผนเที่ยว', icon: '📅', href: `/tour/${tourId}/itinerary` },
    { id: 'transport', label: 'การเดินทาง', icon: '🚌', href: `/tour/${tourId}/transport` },
    { id: 'checklist', label: 'เช็คลิสต์', icon: '✅', href: `/tour/${tourId}/checklist` },
    { id: 'chat', label: 'ช่วยเหลือ', icon: '💬', href: `/tour/${tourId}/chat` },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] touch-target transition-colors ${
              activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs mt-0.5">{tab.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}
