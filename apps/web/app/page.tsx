import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TripFlow — แพลตฟอร์มทัวร์กลุ่มสำหรับนักเดินทางชาวไทย',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TF</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">TripFlow</span>
        </div>
        <a
          href="/login"
          className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          เข้าสู่ระบบ
        </a>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-24 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
          <span>🇹🇭</span>
          <span>สำหรับนักเดินทางชาวไทย</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-6">
          จัดการทริปกลุ่มของคุณ<br />
          <span className="text-primary-600">ได้ทุกที่ แม้ในจีน</span>
        </h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          แพลตฟอร์มสำหรับทัวร์กลุ่มชาวไทย ดูแผนเที่ยว เช็คลิสต์ ติดต่อไกด์
          และใช้งาน AI ช่วยเหลือได้แม้อยู่ในประเทศจีนโดยไม่ต้อง VPN
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/login"
            className="px-8 py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-lg"
          >
            เริ่มต้นใช้งาน →
          </a>
          <a
            href="#features"
            className="px-8 py-3.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-lg"
          >
            ดูฟีเจอร์
          </a>
        </div>
      </section>

      {/* Destination badges */}
      <section className="px-6 pb-16">
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {[
            { flag: '🇨🇳', name: 'จีน', note: 'ออฟไลน์พร้อม' },
            { flag: '🇯🇵', name: 'ญี่ปุ่น', note: '' },
            { flag: '🇰🇷', name: 'เกาหลี', note: '' },
            { flag: '🇫🇷', name: 'ยุโรป', note: '' },
            { flag: '🇸🇬', name: 'สิงคโปร์', note: '' },
            { flag: '🇦🇺', name: 'ออสเตรเลีย', note: '' },
          ].map((dest) => (
            <div key={dest.name} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
              <span className="text-xl">{dest.flag}</span>
              <span className="text-gray-700 font-medium text-sm">{dest.name}</span>
              {dest.note && (
                <span className="text-xs text-green-600 font-medium">✓ {dest.note}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            ทุกอย่างที่นักเดินทางต้องการ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '📅',
                title: 'แผนเที่ยวครบถ้วน',
                desc: 'ดูกำหนดการรายวัน กิจกรรม ที่พัก พร้อมชื่อภาษาท้องถิ่น',
              },
              {
                icon: '🗺️',
                title: 'แผนที่ใช้ได้ในจีน',
                desc: 'ใช้ Amap สำหรับทริปจีน และ Mapbox สำหรับประเทศอื่น โดยอัตโนมัติ',
              },
              {
                icon: '💬',
                title: 'AI ช่วยเหลือ',
                desc: 'ถามได้ทุกอย่างเป็นภาษาไทย ใช้ Qwen ในจีน และ Claude ที่อื่น',
              },
              {
                icon: '✅',
                title: 'เช็คลิสต์',
                desc: 'เตรียมของครบทุกชิ้น ซิงค์กับสมาชิกในกลุ่มแบบ real-time',
              },
              {
                icon: '🀄',
                title: 'คำศัพท์จีน',
                desc: 'ไทย → จีน พร้อมพินอิน และเสียงอ่าน สำหรับทริปจีนโดยเฉพาะ',
              },
              {
                icon: '🆘',
                title: 'ข้อมูลฉุกเฉิน',
                desc: 'เบอร์ฉุกเฉิน สถานทูตไทย ประกันภัย พร้อมใช้งานออฟไลน์',
              },
              {
                icon: '💰',
                title: 'ค่าใช้จ่ายกลุ่ม',
                desc: 'แชร์ค่าใช้จ่าย แสดงทั้งเงินท้องถิ่นและบาทไทย',
              },
              {
                icon: '📶',
                title: 'ใช้งานออฟไลน์',
                desc: 'ดาวน์โหลดข้อมูลทริปไว้ก่อน ใช้งานได้แม้ไม่มีสัญญาณ',
              },
              {
                icon: '🍱',
                title: 'แจ้งมื้ออาหาร',
                desc: 'รู้ทันทีว่าวันนี้มีอาหารเช้า กลางวัน หรือเย็น รวมในทัวร์หรือไม่',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* China highlight */}
      <section className="px-6 py-20 bg-red-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-6">🇨🇳</div>
          <h2 className="text-2xl font-bold mb-4">รองรับทริปจีนเต็มรูปแบบ</h2>
          <p className="text-red-100 text-lg mb-8 leading-relaxed">
            60% ของทัวร์ไทยไปจีน แต่บริการส่วนใหญ่ใช้ไม่ได้ในจีน
            TripFlow สลับ service อัตโนมัติเมื่อปลายทางคือจีน
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { global: 'Google Maps', china: 'Amap 高德' },
              { global: 'Claude AI', china: 'Qwen 通义' },
              { global: 'OpenWeather', china: 'Caiyun 彩云' },
              { global: 'Firebase', china: 'JPush 极光' },
            ].map((s) => (
              <div key={s.china} className="bg-white/10 rounded-xl p-3">
                <p className="text-red-200 text-xs mb-1 line-through">{s.global}</p>
                <p className="text-white font-semibold text-sm">{s.china}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">พร้อมออกเดินทางแล้วหรือยัง?</h2>
        <p className="text-gray-500 mb-8">เข้าสู่ระบบด้วย Google แล้วดูทริปของคุณได้เลย</p>
        <a
          href="/login"
          className="inline-block px-10 py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors text-lg"
        >
          เริ่มต้นใช้งานฟรี →
        </a>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p>© 2026 TripFlow · สร้างสำหรับนักเดินทางชาวไทย 🇹🇭</p>
      </footer>
    </div>
  )
}
