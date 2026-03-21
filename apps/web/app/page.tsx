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
        /* slow aura color cycle — indigo → violet → purple → back */
        @keyframes auraShift {
          0%   { box-shadow: 0 0 28px 6px rgba(99,102,241,.55),  0 0 60px 12px rgba(99,102,241,.2); }
          33%  { box-shadow: 0 0 28px 6px rgba(139,92,246,.55),  0 0 60px 12px rgba(139,92,246,.2); }
          66%  { box-shadow: 0 0 28px 6px rgba(168,85,247,.55),  0 0 60px 12px rgba(168,85,247,.2); }
          100% { box-shadow: 0 0 28px 6px rgba(99,102,241,.55),  0 0 60px 12px rgba(99,102,241,.2); }
        }
        @keyframes auraShiftWide {
          0%   { box-shadow: 0 0 50px 15px rgba(99,102,241,.3),  0 0 100px 30px rgba(99,102,241,.1); }
          33%  { box-shadow: 0 0 50px 15px rgba(139,92,246,.3),  0 0 100px 30px rgba(139,92,246,.1); }
          66%  { box-shadow: 0 0 50px 15px rgba(192,132,252,.3), 0 0 100px 30px rgba(192,132,252,.1); }
          100% { box-shadow: 0 0 50px 15px rgba(99,102,241,.3),  0 0 100px 30px rgba(99,102,241,.1); }
        }
        @keyframes borderCycle {
          0%,100% { border-color: rgba(99,102,241,.35); box-shadow: 0 0 12px rgba(99,102,241,.2); }
          50%      { border-color: rgba(192,132,252,.55); box-shadow: 0 0 12px rgba(192,132,252,.25); }
        }
        @keyframes orb1 {
          0%,100% { opacity:.18; transform: scale(1)   translateY(0); }
          50%      { opacity:.28; transform: scale(1.1) translateY(-20px); }
        }
        @keyframes orb2 {
          0%,100% { opacity:.12; transform: scale(1)    translateX(0); }
          50%      { opacity:.2;  transform: scale(1.08) translateX(20px); }
        }
        @keyframes orb3 {
          0%,100% { opacity:.08; }
          50%      { opacity:.16; }
        }

        .anim-1 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 0ms; }
        .anim-2 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 100ms; }
        .anim-3 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 200ms; }
        .anim-4 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 300ms; }
        .anim-5 { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both 400ms; }
        /* aura glow on CTA button — slow color cycle */
        .cta-glow { animation: auraShift 5s ease infinite; }

        .noise { position:absolute; inset:0; pointer-events:none; opacity:.45;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
        }
        .dot-grid {
          background-image: radial-gradient(circle, #ffffff0f 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* ── Gradient text ── */
        .gradient-text {
          background: linear-gradient(135deg, #fff 0%, #e0d7ff 40%, #c4b5fd 70%, #a78bfa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gradient-text-sub {
          background: linear-gradient(90deg, #818cf8, #a78bfa, #c084fc);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Logo ── */
        .logo-icon {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
        }

        /* ── Primary button — static gradient, aura changes color slowly ── */
        .btn-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%);
          transition: transform 200ms ease, filter 200ms ease;
          position: relative;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .btn-primary:active { transform:translateY(0); filter:brightness(.95); }

        /* ── Ghost button — glass ── */
        .btn-ghost-dark {
          border: 1px solid rgba(255,255,255,.1);
          color: rgba(255,255,255,.6);
          backdrop-filter: blur(8px);
          background: rgba(255,255,255,.03);
          transition: border-color 150ms, color 150ms, background 150ms, box-shadow 150ms;
        }
        .btn-ghost-dark:hover {
          border-color: rgba(168,85,247,.35);
          color: #fff;
          background: rgba(139,92,246,.08);
          box-shadow: 0 0 0 1px rgba(168,85,247,.12);
        }

        /* ── Language toggle ── */
        .lang-btn {
          font-size:12px; font-weight:600; letter-spacing:.04em;
          padding:4px 10px; border-radius:6px;
          transition: background 150ms, color 150ms;
        }
        .lang-btn.active {
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff;
        }
        .lang-btn:not(.active) { color:rgba(255,255,255,.35); }
        .lang-btn:not(.active):hover { color:rgba(255,255,255,.8); background:rgba(255,255,255,.07); }

        /* ── Feature cards — glass ── */
        .card-dark {
          background: rgba(255,255,255,.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,.06);
          transition: background 200ms, border-color 200ms, transform 200ms, box-shadow 200ms;
          position: relative; overflow: hidden;
          cursor: pointer;
        }
        .card-dark::before {
          content:''; position:absolute; inset:0; opacity:0;
          background: linear-gradient(135deg, rgba(99,102,241,.06), rgba(168,85,247,.04));
          transition: opacity 200ms;
        }
        .card-dark:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,.05);
          border-color: rgba(139,92,246,.3);
          box-shadow: 0 8px 32px rgba(99,102,241,.12), 0 0 0 1px rgba(139,92,246,.15);
        }
        .card-dark:hover::before { opacity:1; }

        /* ── Feature badge inside card ── */
        .feature-badge {
          background: linear-gradient(90deg, #6366f1, #a855f7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
        }

        /* ── Section badge pill — glass ── */
        .section-badge {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 14px; border-radius:999px;
          background: rgba(139,92,246,.08);
          backdrop-filter: blur(8px);
          border:1px solid rgba(139,92,246,.18);
          animation: borderCycle 4s ease infinite;
          color:#c4b5fd; font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
        }

        /* ── Nav link ── */
        .nav-link { color:rgba(255,255,255,.45); font-size:14px; transition:color 150ms; }
        .nav-link:hover { color:#fff; }

        /* ── Metrics value ── */
        .metric-value {
          background: linear-gradient(135deg, #fff 0%, #c4b5fd 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── China table ── */
        .service-row { transition: background 150ms; cursor: pointer; }
        .service-row:hover { background: rgba(139,92,246,.04); }

        /* ── Pills — glass ── */
        .pill-dark {
          background: rgba(255,255,255,.03);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.06);
          transition: background 150ms, border-color 150ms, box-shadow 150ms;
          cursor: pointer;
        }
        .pill-dark:hover {
          background: rgba(139,92,246,.06);
          border-color: rgba(139,92,246,.2);
          box-shadow: 0 0 16px rgba(139,92,246,.1);
        }

        /* ── Dest pills — glass ── */
        .dest-pill {
          background: rgba(255,255,255,.04); backdrop-filter: blur(6px);
          border:1px solid rgba(255,255,255,.06);
          color: rgba(255,255,255,.4);
          transition: background 150ms, border-color 150ms, color 150ms;
          cursor: pointer;
        }
        .dest-pill:hover {
          background: rgba(139,92,246,.08);
          border-color: rgba(168,85,247,.25);
          color: #e9d5ff;
        }

        /* ── Step box — glass ── */
        .step-box {
          width:40px; height:40px; border-radius:12px;
          background: rgba(255,255,255,.03);
          backdrop-filter: blur(8px);
          border:1px solid rgba(255,255,255,.08);
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:700; color:rgba(255,255,255,.3);
          transition: border-color 200ms, color 200ms, box-shadow 200ms, background 200ms;
        }
        .step-wrap:hover .step-box {
          background: rgba(139,92,246,.1);
          border-color: rgba(168,85,247,.35);
          color: #c4b5fd;
          box-shadow: 0 0 0 4px rgba(139,92,246,.08), 0 0 20px rgba(139,92,246,.12);
        }

        /* ── CTA section bg ── */
        .cta-glow-bg {
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,.18) 0%, transparent 70%);
        }

        .divider { border:none; border-top:1px solid rgba(255,255,255,.07); margin:0; }
      `}</style>

      <div className="min-h-screen bg-[#080c14] text-white antialiased">

        {/* ── NAV ───────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-50"
                style={{ background:'rgba(8,12,20,.6)', backdropFilter:'blur(24px) saturate(1.4)',
                         borderBottom:'1px solid rgba(255,255,255,.06)' }}>
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
              <span className="font-semibold tracking-tight text-white">TripFlow</span>
            </div>

            {/* Center nav */}
            <nav className="hidden sm:flex items-center gap-6">
              <a href="#features" className="nav-link opacity-100 hover:opacity-100">{t.nav.features}</a>
              <a href="#china" className="nav-link opacity-100 hover:opacity-100">{t.nav.china}</a>
            </nav>

            {/* Right: lang toggle + sign in */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg"
                   style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)' }}>
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
          <div className="noise" />
          <div className="absolute inset-0 dot-grid" />
          {/* animated aura orbs */}
          <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[720px] h-[400px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(79,70,229,.28) 0%, rgba(147,51,234,.14) 45%, transparent 70%)',
                        animation:'orb1 9s ease-in-out infinite' }} />
          <div className="absolute top-[25%] left-[-8%] w-[380px] h-[380px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(139,92,246,.18) 0%, transparent 68%)',
                        filter:'blur(35px)', animation:'orb2 12s ease-in-out infinite' }} />
          <div className="absolute top-[15%] right-[-8%] w-[340px] h-[340px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(192,132,252,.14) 0%, transparent 68%)',
                        filter:'blur(35px)', animation:'orb3 8s ease-in-out infinite' }} />
          <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[500px] h-[180px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(99,102,241,.12) 0%, transparent 70%)',
                        filter:'blur(30px)', animation:'orb2 15s ease-in-out infinite reverse' }} />

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            {/* Hero logo */}
            <div className="anim-1 mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-[22px] overflow-hidden" style={{ boxShadow:'0 0 40px rgba(99,102,241,.3), 0 0 80px rgba(139,92,246,.15)' }}>
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

            <div className="anim-2 section-badge mb-8">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              {t.hero.badge}
            </div>

            <h1 className="anim-3 gradient-text text-5xl sm:text-6xl lg:text-[68px] font-bold tracking-tight leading-[1.07] mb-6"
                style={{ whiteSpace:'pre-line' }}>
              {t.hero.h1}
            </h1>

            <p className="anim-4 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
               style={{ color:'rgba(255,255,255,.5)' }}>
              {t.hero.sub.split('—').map((part, i) => i === 0
                ? <span key={i}>{part}—</span>
                : <span key={i} style={{ color:'rgba(255,255,255,.85)' }}>{part}</span>
              )}
            </p>

            <div className="anim-5 flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <a href="/login"
                 className="btn-primary cta-glow opacity-100 hover:opacity-100 px-7 py-3.5 text-white font-semibold rounded-xl text-base">
                {t.hero.cta1}
              </a>
              <a href="#features"
                 className="btn-ghost-dark opacity-100 hover:opacity-100 px-7 py-3.5 font-medium rounded-xl text-base">
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
               style={{ opacity:.3 }}>
            <div className="w-px h-10 bg-white rounded-full" style={{ animation:'fadeUp .8s ease infinite alternate' }} />
          </div>
        </section>

        {/* ── METRICS ───────────────────────────────────────── */}
        <hr className="divider" />
        <section style={{ background:'rgba(255,255,255,.02)' }}>
          <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 divide-x"
               style={{ borderColor:'rgba(255,255,255,.07)' }}>
            {t.metrics.map((s) => (
              <div key={s.label} className="text-center px-6">
                <div className="metric-value text-3xl font-bold tabular-nums">{s.value}</div>
                <div className="text-sm mt-1" style={{ color:'rgba(255,255,255,.35)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
        <hr className="divider" />

        {/* ── FEATURES ──────────────────────────────────────── */}
        <section id="features" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-14">
              <div className="section-badge mb-5">{t.features.badge}</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">{t.features.h2}</h2>
              <p style={{ color:'rgba(255,255,255,.4)' }} className="text-lg max-w-lg mx-auto">{t.features.sub}</p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {t.featureList.map((f, i) => (
                <FadeIn key={f.title} delay={i * 55}>
                  <div className="card-dark rounded-2xl p-6 h-full">
                    <div className="feature-badge mb-4">✦ Feature</div>
                    <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,.4)' }}>{f.desc}</p>
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
               style={{ background:'radial-gradient(ellipse, rgba(220,38,38,.08) 0%, transparent 70%)' }} />

          <div className="relative z-10 max-w-4xl mx-auto">
            <FadeIn className="text-center mb-14">
              <div className="section-badge mb-5"
                   style={{ background:'rgba(220,38,38,.1)', borderColor:'rgba(220,38,38,.2)', color:'#fca5a5' }}>
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" style={{ animation:'pulse-ring 2s ease infinite' }} />
                {t.china.badge}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">{t.china.h2}</h2>
              <p className="text-lg max-w-xl mx-auto" style={{ color:'rgba(255,255,255,.4)' }}>{t.china.sub}</p>
            </FadeIn>

            <FadeIn>
              <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)', backdropFilter:'blur(12px)' }}>
                <div className="grid grid-cols-3 px-6 py-3"
                     style={{ borderBottom:'1px solid rgba(255,255,255,.07)', background:'rgba(255,255,255,.02)' }}>
                  {t.china.tableHead.map((h, i) => (
                    <span key={h} className={`text-[11px] font-semibold uppercase tracking-widest ${
                      i === 2 ? 'text-center text-red-400' : i === 1 ? 'text-center' : ''
                    }`} style={{ color: i !== 2 ? 'rgba(255,255,255,.3)' : undefined }}>{h}</span>
                  ))}
                </div>
                {services.map((s, i) => (
                  <div key={i}
                       className={`service-row grid grid-cols-3 px-6 py-4 items-center ${
                         i < services.length - 1 ? 'border-b' : ''
                       }`}
                       style={{ borderColor:'rgba(255,255,255,.05)' }}>
                    <span className="text-sm font-medium" style={{ color:'rgba(255,255,255,.5)' }}>
                      {lang === 'th' ? s.category.th : s.category.en}
                    </span>
                    <span className="text-center text-sm line-through" style={{ color:'rgba(255,255,255,.2)', textDecorationColor:'rgba(255,255,255,.15)' }}>
                      {s.global}
                    </span>
                    <span className="text-center text-sm font-semibold text-green-400">{s.china}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={80}>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {t.china.pills.map((p, i) => (
                  <div key={i} className="pill-dark flex items-center gap-3 px-4 py-3.5 rounded-xl">
                    <span className="text-green-400 text-base">{['📡','🔌','⚙️'][i]}</span>
                    <span className="text-sm font-medium" style={{ color:'rgba(255,255,255,.7)' }}>{p}</span>
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
              <div className="section-badge mb-5">{t.how.badge}</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
                  style={{ whiteSpace:'pre-line' }}>{t.how.h2}</h2>
            </FadeIn>

            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10">
              <div className="hidden sm:block absolute top-5 left-[calc(16.5%+20px)] right-[calc(16.5%+20px)] h-px"
                   style={{ background:'linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent)' }} />

              {t.how.steps.map((s) => (
                <FadeIn key={s.n}>
                  <div className="step-wrap flex flex-col items-start sm:items-center sm:text-center cursor-pointer">
                    <div className="step-box mb-5">{s.n}</div>
                    <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,.4)' }}>{s.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ── CTA ───────────────────────────────────────────── */}
        <section className="py-28 px-6 relative overflow-hidden">
          <div className="cta-glow-bg absolute inset-0 pointer-events-none" />
          <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(99,102,241,.25) 0%, rgba(147,51,234,.12) 50%, transparent 70%)',
                        animation:'orb1 10s ease-in-out infinite' }} />
          <div className="absolute bottom-[-60px] left-1/4 w-[300px] h-[200px] rounded-full pointer-events-none"
               style={{ background:'radial-gradient(ellipse, rgba(139,92,246,.15) 0%, transparent 70%)',
                        filter:'blur(30px)', animation:'orb3 13s ease-in-out infinite' }} />
          <FadeIn className="relative z-10 max-w-lg mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">{t.cta.h2}</h2>
            <p className="text-lg mb-10" style={{ color:'rgba(255,255,255,.4)' }}>{t.cta.sub}</p>
            <a href="/login"
               className="btn-primary cta-glow opacity-100 hover:opacity-100 inline-block px-9 py-4 text-white font-semibold text-base rounded-xl mb-5">
              {t.cta.btn}
            </a>
            <p className="text-sm" style={{ color:'rgba(255,255,255,.3)' }}>
              {t.cta.sub2}{' '}
              <a href="/login"
                 className="gradient-text-sub underline underline-offset-2 opacity-100 hover:opacity-80 transition-opacity">
                {t.cta.sub2link}
              </a>
            </p>
          </FadeIn>
        </section>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <hr className="divider" />
        <footer className="px-6 py-7" style={{ background:'rgba(255,255,255,.01)' }}>
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
              <span className="text-sm font-semibold text-white">TripFlow</span>
            </div>
            <p className="text-sm" style={{ color:'rgba(255,255,255,.25)' }}>
              © 2026 TripFlow · {t.footer}
            </p>
            <a href="/login"
               className="text-sm opacity-100 hover:opacity-100 transition-colors"
               style={{ color:'rgba(255,255,255,.3)' }}
               onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,.8)')}
               onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,.3)')}>
              {t.nav.signin} →
            </a>
          </div>
        </footer>

      </div>
    </>
  )
}
