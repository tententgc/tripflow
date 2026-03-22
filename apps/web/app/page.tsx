'use client'

import { useEffect, useRef, useState } from 'react'

/* ── i18n ──────────────────────────────────────────────── */
const content = {
  th: {
    nav: { features: 'ฟีเจอร์', china: 'China Mode', signin: 'เข้าสู่ระบบ' },
    hero: {
      badge: 'สำหรับบริษัททัวร์และนักเดินทางชาวไทย',
      h1: 'จัดการทริปกลุ่ม\nได้ทั่วโลก',
      sub: 'TripFlow รองรับทุกปลายทางทั่วโลก และยังใช้งานได้เต็มรูปแบบในจีน — โดยไม่ต้อง VPN',
      cta1: 'เริ่มต้นใช้งานฟรี',
      cta2: 'ดูฟีเจอร์ทั้งหมด',
    },
    metrics: [
      { value: '10+', label: 'ประเทศปลายทางทั่วโลก' },
      { value: '5', label: 'บริการรองรับจีน' },
      { value: '0', label: 'VPN ที่ต้องการ' },
    ],
    features: {
      badge: 'ฟีเจอร์',
      h2: 'ทุกอย่างที่นักเดินทางต้องการ',
      sub: 'ออกแบบสำหรับทัวร์กลุ่มชาวไทย ใช้งานได้ทุกประเทศ แม้ออฟไลน์',
    },
    featureList: [
      { title: 'แผนเที่ยวรายวัน', desc: 'กำหนดการ กิจกรรม ที่พัก พร้อมชื่อภาษาท้องถิ่นในทุก destination' },
      { title: 'แผนที่ dual-stack', desc: 'Amap สำหรับจีน, Mapbox สำหรับที่อื่น — สลับอัตโนมัติตาม destination' },
      { title: 'AI Assistant ภาษาไทย', desc: 'Qwen ในจีน, Claude ที่อื่น — ตอบเป็นภาษาไทยเสมอ' },
      { title: 'Real-time Checklist', desc: 'ซิงค์กับทุกคนในกลุ่มทันที ผ่าน Socket.io' },
      { title: 'คำศัพท์ไทย–จีน', desc: 'พร้อม Pinyin และเสียงอ่าน TTS ใช้ได้แม้ไม่มีสัญญาณ' },
      { title: 'Offline-first PWA', desc: 'ดาวน์โหลดทริปไว้ล่วงหน้า ใช้งานได้ในรถไฟใต้ดินปักกิ่ง' },
    ],
    china: {
      badge: 'China Mode',
      h2: 'ใช้งานได้แม้ในจีน',
      sub: 'เมื่อปลายทางคือจีน TripFlow สลับทุก service ให้อัตโนมัติ ไม่ต้องตั้งค่า ไม่ต้อง VPN — ทริปอื่นๆ ทั่วโลกก็ใช้งานได้ปกติ',
      tableHead: ['บริการ', 'ทั่วไป', 'จีน 🇨🇳'],
      pills: ['รองรับทุก SIM', 'ออฟไลน์เต็มรูปแบบ', 'ไม่ต้องตั้งค่า'],
    },
    how: {
      badge: 'วิธีใช้งาน',
      h2: 'ง่ายสำหรับผู้จัด\nราบรื่นสำหรับนักเดินทาง',
      steps: [
        { n: '01', title: 'ผู้จัดสร้างทริป', desc: 'เพิ่มกำหนดการ โรงแรม เที่ยวบิน ผู้ติดต่อ และเช็คลิสต์ใน Admin Portal ไม่ว่าปลายทางจะเป็นที่ไหน' },
        { n: '02', title: 'นักเดินทางรับคำเชิญ', desc: 'ลิงก์เดียว แตะครั้งเดียว ข้อมูลทริปโหลดลงโทรศัพท์พร้อมแคชออฟไลน์' },
        { n: '03', title: 'ใช้งานได้ทุกที่ในโลก', desc: 'แผนที่ AI สภาพอากาศ และการแจ้งเตือนปรับตามปลายทางอัตโนมัติ รวมถึงในจีน' },
      ],
    },
    cta: {
      h2: 'เริ่มทริปแรกของคุณวันนี้',
      sub: 'ทดลองใช้ฟรี ไม่ต้องใช้บัตรเครดิต',
      btn: 'เริ่มต้นใช้งานฟรี →',
      sub2: 'ผู้จัดทัวร์?',
      sub2link: 'เข้าสู่ Admin Portal',
    },
    footer: 'สร้างสำหรับนักเดินทางชาวไทย 🇹🇭',
    destinations: ['🇨🇳 จีน', '🇯🇵 ญี่ปุ่น', '🇰🇷 เกาหลี', '🇫🇷 ฝรั่งเศส', '🇮🇹 อิตาลี', '🇬🇧 อังกฤษ', '🇩🇪 เยอรมนี', '🇸🇬 สิงคโปร์', '🇦🇺 ออสเตรเลีย', '🇦🇪 UAE'],
  },
  en: {
    nav: { features: 'Features', china: 'China Mode', signin: 'Sign in' },
    hero: {
      badge: 'For Thai tour operators & travelers worldwide',
      h1: 'Group tour management\nfor anywhere in the world.',
      sub: 'TripFlow works across every destination globally — and runs fully in China without VPN when you need it.',
      cta1: 'Get started free',
      cta2: 'See all features',
    },
    metrics: [
      { value: '10+', label: 'destinations worldwide' },
      { value: '5', label: 'China-compatible services' },
      { value: '0', label: 'VPN required' },
    ],
    features: {
      badge: 'Features',
      h2: 'Everything your travelers need',
      sub: 'Designed for Thai group tours — works in every country, even offline.',
    },
    featureList: [
      { title: 'Daily Itinerary', desc: 'Schedule, activities, hotels — with local-language names at every destination worldwide.' },
      { title: 'Dual-stack Maps', desc: 'Amap for China, Mapbox elsewhere — switches automatically by destination.' },
      { title: 'Thai AI Assistant', desc: 'Qwen in China, Claude elsewhere — always responds in Thai.' },
      { title: 'Real-time Checklist', desc: 'Syncs across the entire group instantly via Socket.io.' },
      { title: 'Thai–Chinese Phrasebook', desc: 'Pinyin and TTS audio — fully accessible offline.' },
      { title: 'Offline-first PWA', desc: 'Cache the entire trip before departure. Works anywhere — including the Beijing subway.' },
    ],
    china: {
      badge: 'China Mode',
      h2: 'Works even in China',
      sub: 'When your tour goes to mainland China, every service switches automatically. No config. No VPN. All other global tours work as normal.',
      tableHead: ['Service', 'Global', 'China 🇨🇳'],
      pills: ['Works on any SIM', 'Full offline support', 'Zero configuration'],
    },
    how: {
      badge: 'How it works',
      h2: 'Simple for operators,\nseamless for travelers.',
      steps: [
        { n: '01', title: 'Operator builds the trip', desc: 'Add itinerary, hotels, flights, contacts and checklists from the admin portal — for any destination.' },
        { n: '02', title: 'Travelers receive invite', desc: 'One link, one tap — the full tour loads on their phone with offline caching.' },
        { n: '03', title: 'Works anywhere in the world', desc: 'Maps, AI, weather and notifications adapt to the destination automatically — including China.' },
      ],
    },
    cta: {
      h2: 'Start your first tour today.',
      sub: 'Free to try. No credit card required.',
      btn: 'Get started free →',
      sub2: 'Thai operator?',
      sub2link: 'Sign in to admin portal',
    },
    footer: 'Built for Thai travelers 🇹🇭',
    destinations: ['🇨🇳 China', '🇯🇵 Japan', '🇰🇷 Korea', '🇫🇷 France', '🇮🇹 Italy', '🇬🇧 UK', '🇩🇪 Germany', '🇸🇬 Singapore', '🇦🇺 Australia', '🇦🇪 UAE'],
  },
}

const services = [
  { category: { th: 'แผนที่', en: 'Maps' }, global: 'Google Maps', china: 'Amap 高德地图' },
  { category: { th: 'AI Chat', en: 'AI Chat' }, global: 'Claude API', china: 'Qwen 通义千问' },
  { category: { th: 'สภาพอากาศ', en: 'Weather' }, global: 'OpenWeather', china: 'Caiyun 彩云天气' },
  { category: { th: 'การแจ้งเตือน', en: 'Push' }, global: 'Firebase FCM', china: 'JPush 极光推送' },
  { category: { th: 'เที่ยวบิน', en: 'Flights' }, global: 'AviationStack', china: 'VariFlight 航班管家' },
]

/* ── Fade-in on scroll ─────────────────────────────────── */
function FadeIn({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const observer = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    }}>{children}</div>
  )
}

export default function LandingPage() {
  const [lang, setLang] = useState<'th' | 'en'>('th')
  const t = content[lang]

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes orb1 {
          0%,100% { opacity:.5; transform: scale(1) translateY(0); }
          50%      { opacity:.7; transform: scale(1.05) translateY(-10px); }
        }
        @keyframes orb2 {
          0%,100% { opacity:.3; transform: scale(1) translateX(0); }
          50%      { opacity:.5; transform: scale(1.05) translateX(10px); }
        }

        .anim-1 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 0ms; }
        .anim-2 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 100ms; }
        .anim-3 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 200ms; }
        .anim-4 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 300ms; }
        .anim-5 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 400ms; }

        .gradient-text-light {
          background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 40%, #6366f1 70%, #8b5cf6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%);
          transition: transform 200ms ease, box-shadow 200ms ease;
          position: relative;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,.3); }
        .btn-primary:active { transform:translateY(0); }

        .btn-ghost {
          border: 1px solid #e0e7ff;
          color: #6366f1;
          background: white;
          transition: border-color 150ms, background 150ms, box-shadow 150ms;
        }
        .btn-ghost:hover { border-color: #a5b4fc; background: #eef2ff; box-shadow: 0 4px 12px rgba(99,102,241,.08); }

        .card-glass {
          background: rgba(255,255,255,.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(224,231,255,.6);
          transition: background 200ms, border-color 200ms, transform 200ms, box-shadow 200ms;
          position: relative; overflow: hidden;
        }
        .card-glass:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,.8);
          border-color: #a5b4fc;
          box-shadow: 0 8px 32px rgba(99,102,241,.08);
        }

        .section-badge-light {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 14px; border-radius:999px;
          background: rgba(99,102,241,.06);
          border:1px solid rgba(99,102,241,.15);
          color:#6366f1; font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
        }

        .lang-btn {
          font-size:12px; font-weight:600; padding:4px 10px; border-radius:6px;
          transition: background 150ms, color 150ms;
        }
        .lang-btn.active { background: linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; }
        .lang-btn:not(.active) { color:#94a3b8; }
        .lang-btn:not(.active):hover { color:#4338ca; background:rgba(99,102,241,.06); }

        .dest-pill {
          background: rgba(255,255,255,.7); backdrop-filter: blur(6px);
          border:1px solid #e0e7ff; color: #6366f1;
          transition: background 150ms, border-color 150ms, box-shadow 150ms;
        }
        .dest-pill:hover { background: #eef2ff; border-color: #a5b4fc; box-shadow: 0 2px 8px rgba(99,102,241,.1); }

        .step-box {
          width:40px; height:40px; border-radius:12px;
          background: rgba(99,102,241,.06);
          border:1px solid rgba(99,102,241,.15);
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:700; color:#6366f1;
          transition: all 200ms;
        }
        .step-wrap:hover .step-box {
          background: #6366f1; color: white;
          box-shadow: 0 4px 16px rgba(99,102,241,.25);
        }

        .service-row { transition: background 150ms; }
        .service-row:hover { background: rgba(99,102,241,.03); }

        .pill-light {
          background: rgba(255,255,255,.6); backdrop-filter: blur(8px);
          border: 1px solid #e0e7ff;
          transition: background 150ms, border-color 150ms;
        }
        .pill-light:hover { background: #eef2ff; border-color: #a5b4fc; }

        .divider { border:none; border-top:1px solid #e0e7ff; margin:0; }

        .metric-value {
          background: linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #8b5cf6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 text-gray-900 antialiased">

        {/* ── NAV ───────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-50"
                style={{ background:'rgba(255,255,255,.7)', backdropFilter:'blur(24px) saturate(1.4)',
                         borderBottom:'1px solid rgba(224,231,255,.5)' }}>
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs><linearGradient id="navBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop stopColor="#6366F1"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs>
                  <rect width="512" height="512" rx="112" fill="url(#navBg)"/>
                  <circle cx="256" cy="256" r="160" stroke="white" strokeWidth="12" opacity="0.25"/>
                  <ellipse cx="256" cy="256" rx="70" ry="160" stroke="white" strokeWidth="8" opacity="0.15"/>
                  <line x1="96" y1="256" x2="416" y2="256" stroke="white" strokeWidth="8" opacity="0.15"/>
                  <path d="M120 370L220 256L120 210L380 120L300 400L256 300L120 370Z" fill="white" fillOpacity="0.95"/>
                  <path d="M380 120L256 300" stroke="white" strokeWidth="6" opacity="0.3" strokeDasharray="12 8"/>
                </svg>
              </div>
              <span className="font-semibold tracking-tight text-gray-900">TripFlow</span>
            </div>

            {/* Center nav */}
            <nav className="hidden sm:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors opacity-100 hover:opacity-100">{t.nav.features}</a>
              <a href="#china" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors opacity-100 hover:opacity-100">{t.nav.china}</a>
            </nav>

            {/* Right: lang toggle + sign in */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg"
                   style={{ background:'rgba(99,102,241,.04)', border:'1px solid rgba(99,102,241,.12)' }}>
                <button onClick={() => setLang('th')} className={`lang-btn ${lang === 'th' ? 'active' : ''}`}>TH</button>
                <button onClick={() => setLang('en')} className={`lang-btn ${lang === 'en' ? 'active' : ''}`}>EN</button>
              </div>
              <a href="/login"
                 className="btn-primary opacity-100 hover:opacity-100 px-4 py-2 text-white text-sm font-medium rounded-lg">
                {t.nav.signin}
              </a>
            </div>
          </div>
        </header>

        {/* ── HERO ──────────────────────────────────────────── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
          {/* Soft orbs */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(99,102,241,.12) 0%, rgba(139,92,246,.06) 45%, transparent 70%)',
                        animation:'orb1 12s ease-in-out infinite' }} />
          <div className="absolute top-[30%] left-[-5%] w-[300px] h-[300px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(139,92,246,.08) 0%, transparent 68%)',
                        filter:'blur(40px)', animation:'orb2 14s ease-in-out infinite' }} />
          <div className="absolute top-[20%] right-[-5%] w-[280px] h-[280px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(192,132,252,.06) 0%, transparent 68%)',
                        filter:'blur(40px)', animation:'orb2 10s ease-in-out infinite reverse' }} />

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            {/* Hero logo */}
            <div className="anim-1 mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-[22px] overflow-hidden" style={{ boxShadow:'0 8px 32px rgba(99,102,241,.2)' }}>
                <svg width="80" height="80" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs><linearGradient id="heroBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop stopColor="#6366F1"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs>
                  <rect width="512" height="512" rx="112" fill="url(#heroBg)"/>
                  <circle cx="256" cy="256" r="160" stroke="white" strokeWidth="12" opacity="0.25"/>
                  <ellipse cx="256" cy="256" rx="70" ry="160" stroke="white" strokeWidth="8" opacity="0.15"/>
                  <line x1="96" y1="256" x2="416" y2="256" stroke="white" strokeWidth="8" opacity="0.15"/>
                  <path d="M120 370L220 256L120 210L380 120L300 400L256 300L120 370Z" fill="white" fillOpacity="0.95"/>
                  <path d="M380 120L256 300" stroke="white" strokeWidth="6" opacity="0.3" strokeDasharray="12 8"/>
                </svg>
              </div>
            </div>

            <div className="anim-2 section-badge-light mb-8">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              {t.hero.badge}
            </div>

            <h1 className="anim-3 gradient-text-light text-5xl sm:text-6xl lg:text-[68px] font-bold tracking-tight leading-[1.07] mb-6"
                style={{ whiteSpace:'pre-line' }}>
              {t.hero.h1}
            </h1>

            <p className="anim-4 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 text-gray-500">
              {t.hero.sub.split('—').map((part, i) => i === 0
                ? <span key={i}>{part}—</span>
                : <span key={i} className="text-gray-800 font-medium">{part}</span>
              )}
            </p>

            <div className="anim-5 flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <a href="/login"
                 className="btn-primary cta-glow opacity-100 hover:opacity-100 px-7 py-3.5 text-white font-semibold rounded-xl text-base">
                {t.hero.cta1}
              </a>
              <a href="#features"
                 className="btn-ghost opacity-100 hover:opacity-100 px-7 py-3.5 font-medium rounded-xl text-base">
                {t.hero.cta2}
              </a>
            </div>

            {/* Destination pills */}
            <div className="anim-5 flex flex-wrap justify-center gap-2">
              {t.destinations.map((d) => (
                <span key={d} className="dest-pill px-3 py-1.5 text-xs rounded-full font-medium">{d}</span>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
               style={{ opacity:.2 }}>
            <div className="w-px h-10 bg-indigo-400 rounded-full" style={{ animation:'fadeUp .8s ease infinite alternate' }} />
          </div>
        </section>

        {/* ── METRICS ───────────────────────────────────────── */}
        <hr className="divider" />
        <section style={{ background:'rgba(255,255,255,.4)' }}>
          <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 divide-x divide-indigo-100">
            {t.metrics.map((s) => (
              <div key={s.label} className="text-center px-6">
                <div className="metric-value text-3xl font-bold tabular-nums">{s.value}</div>
                <div className="text-sm mt-1 text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
        <hr className="divider" />

        {/* ── FEATURES ──────────────────────────────────────── */}
        <section id="features" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-14">
              <div className="section-badge-light mb-5">{t.features.badge}</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">{t.features.h2}</h2>
              <p className="text-lg max-w-lg mx-auto text-gray-400">{t.features.sub}</p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {t.featureList.map((f, i) => (
                <FadeIn key={f.title} delay={i * 55}>
                  <div className="card-glass rounded-2xl p-6 h-full">
                    <div className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase mb-4">✦ Feature</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ── CHINA MODE ────────────────────────────────────── */}
        <section id="china" className="py-28 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(220,38,38,.04) 0%, transparent 70%)' }} />

          <div className="relative z-10 max-w-4xl mx-auto">
            <FadeIn className="text-center mb-14">
              <div className="section-badge-light mb-5" style={{ background:'rgba(220,38,38,.06)', borderColor:'rgba(220,38,38,.15)', color:'#dc2626' }}>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                {t.china.badge}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">{t.china.h2}</h2>
              <p className="text-lg max-w-xl mx-auto text-gray-400">{t.china.sub}</p>
            </FadeIn>

            <FadeIn>
              <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(224,231,255,.6)', background:'rgba(255,255,255,.5)', backdropFilter:'blur(12px)' }}>
                <div className="grid grid-cols-3 px-6 py-3"
                     style={{ borderBottom:'1px solid rgba(224,231,255,.5)', background:'rgba(99,102,241,.03)' }}>
                  {t.china.tableHead.map((h, i) => (
                    <span key={h} className={`text-[11px] font-semibold uppercase tracking-widest ${
                      i === 2 ? 'text-center text-red-500' : i === 1 ? 'text-center text-gray-400' : 'text-gray-400'
                    }`}>{h}</span>
                  ))}
                </div>
                {services.map((s, i) => (
                  <div key={i}
                       className={`service-row grid grid-cols-3 px-6 py-4 items-center ${
                         i < services.length - 1 ? 'border-b' : ''
                       }`}
                       style={{ borderColor:'rgba(224,231,255,.4)' }}>
                    <span className="text-sm font-medium text-gray-600">
                      {lang === 'th' ? s.category.th : s.category.en}
                    </span>
                    <span className="text-center text-sm line-through text-gray-300">
                      {s.global}
                    </span>
                    <span className="text-center text-sm font-semibold text-emerald-600">{s.china}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={80}>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {t.china.pills.map((p, i) => (
                  <div key={i} className="pill-light flex items-center gap-3 px-4 py-3.5 rounded-xl">
                    <span className="text-emerald-500 text-base">{['📡','🔌','⚙️'][i]}</span>
                    <span className="text-sm font-medium text-gray-700">{p}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        <hr className="divider" />

        {/* ── HOW IT WORKS ──────────────────────────────────── */}
        <section className="py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <FadeIn className="text-center mb-16">
              <div className="section-badge-light mb-5">{t.how.badge}</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900"
                  style={{ whiteSpace:'pre-line' }}>{t.how.h2}</h2>
            </FadeIn>

            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10">
              <div className="hidden sm:block absolute top-5 left-[calc(16.5%+20px)] right-[calc(16.5%+20px)] h-px"
                   style={{ background:'linear-gradient(90deg, transparent, rgba(99,102,241,.15), transparent)' }} />

              {t.how.steps.map((s) => (
                <FadeIn key={s.n}>
                  <div className="step-wrap flex flex-col items-start sm:items-center sm:text-center cursor-pointer">
                    <div className="step-box mb-5">{s.n}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ── CTA ───────────────────────────────────────────── */}
        <section className="py-28 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(99,102,241,.08) 0%, transparent 70%)' }} />
          <FadeIn className="relative z-10 max-w-lg mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">{t.cta.h2}</h2>
            <p className="text-lg mb-10 text-gray-400">{t.cta.sub}</p>
            <a href="/login"
               className="btn-primary opacity-100 hover:opacity-100 inline-block px-9 py-4 text-white font-semibold text-base rounded-xl mb-5">
              {t.cta.btn}
            </a>
            <p className="text-sm text-gray-400">
              {t.cta.sub2}{' '}
              <a href="/login"
                 className="text-indigo-600 underline underline-offset-2 opacity-100 hover:opacity-80 transition-opacity font-medium">
                {t.cta.sub2link}
              </a>
            </p>
          </FadeIn>
        </section>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <hr className="divider" />
        <footer className="px-6 py-7 bg-white/40">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md overflow-hidden">
                <svg width="24" height="24" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs><linearGradient id="ftBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop stopColor="#6366F1"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs>
                  <rect width="512" height="512" rx="112" fill="url(#ftBg)"/>
                  <circle cx="256" cy="256" r="160" stroke="white" strokeWidth="12" opacity="0.25"/>
                  <ellipse cx="256" cy="256" rx="70" ry="160" stroke="white" strokeWidth="8" opacity="0.15"/>
                  <line x1="96" y1="256" x2="416" y2="256" stroke="white" strokeWidth="8" opacity="0.15"/>
                  <path d="M120 370L220 256L120 210L380 120L300 400L256 300L120 370Z" fill="white" fillOpacity="0.95"/>
                  <path d="M380 120L256 300" stroke="white" strokeWidth="6" opacity="0.3" strokeDasharray="12 8"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900">TripFlow</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2026 TripFlow · {t.footer}
            </p>
            <a href="/login"
               className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors opacity-100 hover:opacity-100 font-medium">
              {t.nav.signin} →
            </a>
          </div>
        </footer>

      </div>
    </>
  )
}
