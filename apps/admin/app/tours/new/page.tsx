import { Metadata } from 'next'

export const metadata: Metadata = { title: 'สร้างทัวร์ใหม่ — TripFlow Admin' }

const countries = [
  { iso2: 'CN', nameTh: 'จีน', emoji: '🇨🇳' },
  { iso2: 'JP', nameTh: 'ญี่ปุ่น', emoji: '🇯🇵' },
  { iso2: 'KR', nameTh: 'เกาหลีใต้', emoji: '🇰🇷' },
  { iso2: 'FR', nameTh: 'ฝรั่งเศส', emoji: '🇫🇷' },
  { iso2: 'IT', nameTh: 'อิตาลี', emoji: '🇮🇹' },
  { iso2: 'GB', nameTh: 'สหราชอาณาจักร', emoji: '🇬🇧' },
  { iso2: 'SG', nameTh: 'สิงคโปร์', emoji: '🇸🇬' },
  { iso2: 'MY', nameTh: 'มาเลเซีย', emoji: '🇲🇾' },
  { iso2: 'TW', nameTh: 'ไต้หวัน', emoji: '🇹🇼' },
  { iso2: 'AU', nameTh: 'ออสเตรเลีย', emoji: '🇦🇺' },
]

export default function NewTourPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white border-r border-gray-200 fixed left-0 top-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">TripFlow</p>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {[
              { href: '/dashboard', label: 'แดชบอร์ด', icon: '📊' },
              { href: '/tours', label: 'จัดการทัวร์', icon: '🗺️', active: true },
              { href: '/travelers', label: 'นักเดินทาง', icon: '👥' },
              { href: '/notifications', label: 'การแจ้งเตือน', icon: '🔔' },
              { href: '/settings', label: 'ตั้งค่า', icon: '⚙️' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="ml-64 flex-1 p-8 max-w-4xl">
          <div className="mb-8 flex items-center gap-4">
            <a href="/tours" className="text-gray-500 hover:text-gray-700">← กลับ</a>
            <h1 className="text-2xl font-bold text-gray-900">สร้างทัวร์ใหม่</h1>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {['ข้อมูลทั่วไป', 'เที่ยวบิน', 'กำหนดการ', 'เช็คลิสต์', 'คำศัพท์', 'เผยแพร่'].map((step, i) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                <span className={`ml-2 text-sm ${i === 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {step}
                </span>
                {i < 5 && <div className="w-8 h-px bg-gray-200 mx-3" />}
              </div>
            ))}
          </div>

          {/* Step 1 form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อทัวร์ (ภาษาไทย) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ทัวร์จีน ปักกิ่ง-กำแพงเมืองจีน 6 วัน"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อทัวร์ (English)
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Beijing Great Wall China Tour 6 Days"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเทศปลายทาง <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {countries.map((country) => (
                  <button
                    key={country.iso2}
                    type="button"
                    className="flex flex-col items-center gap-1 px-3 py-3 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm"
                  >
                    <span className="text-2xl">{country.emoji}</span>
                    <span className="text-xs text-gray-600">{country.nameTh}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ การเลือก จีน จะเปิดใช้งาน China Mode โดยอัตโนมัติ (Amap, Qwen AI, JPush)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันออกเดินทาง <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันกลับ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนสมาชิกสูงสุด
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสทัวร์ (Tour Code)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CN2026-04"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <a
                href="/tours"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </a>
              <button
                type="button"
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
