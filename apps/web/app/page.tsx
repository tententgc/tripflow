'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/* ── i18n ──────────────────────────────────────────────── */
const content = {
  th: {
    nav: { features: 'ฟีเจอร์', china: 'China Mode', how: 'วิธีใช้งาน', signin: 'เข้าสู่ระบบ' },
    hero: {
      badge: 'สำหรับบริษัททัวร์และนักเดินทางชาวไทย',
      h1: 'จัดการทริปกลุ่ม\nได้ทั่วโลก',
      sub: 'TripFlow รองรับทุกปลายทางทั่วโลก และยังใช้งานได้เต็มรูปแบบในจีน — โดยไม่ต้อง VPN',
      cta1: 'เริ่มต้นใช้งานฟรี',
      cta2: 'ดูฟีเจอร์ทั้งหมด',
    },
    metrics: [
      { value: 10, suffix: '+', label: 'ประเทศปลายทาง' },
      { value: 5, suffix: '', label: 'บริการรองรับจีน' },
      { value: 99.9, suffix: '%', label: 'ออฟไลน์พร้อมใช้' },
      { value: 0, suffix: '', label: 'VPN ที่ต้องการ' },
    ],
    features: {
      badge: 'ฟีเจอร์',
      h2: 'ทุกอย่างที่นักเดินทางต้องการ',
      sub: 'ออกแบบสำหรับทัวร์กลุ่มชาวไทย ใช้งานได้ทุกประเทศ แม้ออฟไลน์',
    },
    featureList: [
      { icon: '📋', title: 'แผนเที่ยวรายวัน', desc: 'กำหนดการ กิจกรรม ที่พัก พร้อมชื่อภาษาท้องถิ่นในทุก destination' },
      { icon: '🗺️', title: 'แผนที่ dual-stack', desc: 'Amap สำหรับจีน, Mapbox สำหรับที่อื่น — สลับอัตโนมัติตาม destination' },
      { icon: '🤖', title: 'AI Assistant ภาษาไทย', desc: 'Qwen ในจีน, Claude ที่อื่น — ตอบเป็นภาษาไทยเสมอ' },
      { icon: '✅', title: 'Real-time Checklist', desc: 'ซิงค์กับทุกคนในกลุ่มทันที ผ่าน Socket.io' },
      { icon: '🈶', title: 'คำศัพท์ไทย–จีน', desc: 'พร้อม Pinyin และเสียงอ่าน TTS ใช้ได้แม้ไม่มีสัญญาณ' },
      { icon: '📱', title: 'Offline-first PWA', desc: 'ดาวน์โหลดทริปไว้ล่วงหน้า ใช้งานได้ในรถไฟใต้ดินปักกิ่ง' },
    ],
    china: {
      badge: 'China Mode',
      h2: 'ใช้งานได้แม้ในจีน',
      sub: 'เมื่อปลายทางคือจีน TripFlow สลับทุก service ให้อัตโนมัติ ไม่ต้องตั้งค่า ไม่ต้อง VPN',
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
    footer: 'สร้างสำหรับนักเดินทางชาวไทย',
    destinations: ['🇨🇳 จีน', '🇯🇵 ญี่ปุ่น', '🇰🇷 เกาหลี', '🇫🇷 ฝรั่งเศส', '🇮🇹 อิตาลี', '🇬🇧 อังกฤษ', '🇩🇪 เยอรมนี', '🇸🇬 สิงคโปร์', '🇦🇺 ออสเตรเลีย', '🇦🇪 UAE'],
  },
  en: {
    nav: { features: 'Features', china: 'China Mode', how: 'How it works', signin: 'Sign in' },
    hero: {
      badge: 'For Thai tour operators & travelers worldwide',
      h1: 'Group tour management\nfor anywhere in the world.',
      sub: 'TripFlow works across every destination globally — and runs fully in China without VPN when you need it.',
      cta1: 'Get started free',
      cta2: 'See all features',
    },
    metrics: [
      { value: 10, suffix: '+', label: 'destinations worldwide' },
      { value: 5, suffix: '', label: 'China-ready services' },
      { value: 99.9, suffix: '%', label: 'offline reliability' },
      { value: 0, suffix: '', label: 'VPN required' },
    ],
    features: {
      badge: 'Features',
      h2: 'Everything your travelers need',
      sub: 'Designed for Thai group tours — works in every country, even offline.',
    },
    featureList: [
      { icon: '📋', title: 'Daily Itinerary', desc: 'Schedule, activities, hotels — with local-language names at every destination worldwide.' },
      { icon: '🗺️', title: 'Dual-stack Maps', desc: 'Amap for China, Mapbox elsewhere — switches automatically by destination.' },
      { icon: '🤖', title: 'Thai AI Assistant', desc: 'Qwen in China, Claude elsewhere — always responds in Thai.' },
      { icon: '✅', title: 'Real-time Checklist', desc: 'Syncs across the entire group instantly via Socket.io.' },
      { icon: '🈶', title: 'Thai–Chinese Phrasebook', desc: 'Pinyin and TTS audio — fully accessible offline.' },
      { icon: '📱', title: 'Offline-first PWA', desc: 'Cache the entire trip before departure. Works anywhere — including the Beijing subway.' },
    ],
    china: {
      badge: 'China Mode',
      h2: 'Works even in China',
      sub: 'When your tour goes to mainland China, every service switches automatically. No config. No VPN.',
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
    footer: 'Built for Thai travelers',
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

/* ── Animated counter ─────────────────────────────────── */
function AnimatedNumber({ value, suffix = '', duration = 2000 }: {
  value: number; suffix?: string; duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState('0')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && !started) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const startTime = performance.now()
    const isDecimal = value % 1 !== 0

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * value

      if (isDecimal) {
        setDisplay(current.toFixed(1))
      } else {
        setDisplay(Math.round(current).toString())
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [started, value, duration])

  return <span ref={ref}>{display}{suffix}</span>
}

/* ── Scroll reveal ────────────────────────────────────── */
function Reveal({ children, className = '', delay = 0, direction = 'up' }: {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'scale'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const transforms: Record<string, string> = {
    up: 'translateY(40px)',
    left: 'translateX(-40px)',
    right: 'translateX(40px)',
    scale: 'scale(0.95)',
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0) scale(1)' : transforms[direction],
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ── Gradient border card ─────────────────────────────── */
function GradientCard({ children, className = '' }: {
  children: React.ReactNode
  className?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  return (
    <div
      ref={cardRef}
      className={`relative group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient border */}
      <div
        className="absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.15), transparent 70%)`,
        }}
      />
      {/* Resting border */}
      <div
        className="absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0 : 1,
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      />
      {/* Card content */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl h-full transition-all duration-300 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-indigo-500/5">
        {children}
      </div>
    </div>
  )
}

/* ── TripFlow Logo SVG ────────────────────────────────── */
function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`logoBg${size}`} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#logoBg${size})`} />
      <circle cx="256" cy="256" r="160" stroke="white" strokeWidth="12" opacity="0.25" />
      <ellipse cx="256" cy="256" rx="70" ry="160" stroke="white" strokeWidth="8" opacity="0.15" />
      <line x1="96" y1="256" x2="416" y2="256" stroke="white" strokeWidth="8" opacity="0.15" />
      <path d="M120 370L220 256L120 210L380 120L300 400L256 300L120 370Z" fill="white" fillOpacity="0.95" />
      <path d="M380 120L256 300" stroke="white" strokeWidth="6" opacity="0.3" strokeDasharray="12 8" />
    </svg>
  )
}

/* ── Main page ────────────────────────────────────────── */
export default function LandingPage() {
  const [lang, setLang] = useState<'th' | 'en'>('th')
  const [scrolled, setScrolled] = useState(false)
  const t = content[lang]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased overflow-x-hidden">

      {/* ── NAV ───────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(1.4)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(226,232,240,0.6)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
              <Logo size={28} />
            </div>
            <span className="font-semibold tracking-tight text-gray-900 text-[15px]">TripFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '#features', label: t.nav.features },
              { href: '#china', label: t.nav.china },
              { href: '#how', label: t.nav.how },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 opacity-100 hover:opacity-100"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-0.5 p-0.5 rounded-lg border border-gray-200"
            >
              {(['th', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-200 ${
                    lang === l
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <a
              href="/login"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 opacity-100 hover:opacity-100"
            >
              {t.nav.signin}
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(226,232,240,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(226,232,240,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 100%)',
          }}
        />

        {/* Gradient orbs */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)' }} />
        <div className="absolute top-[35%] left-[5%] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-[25%] right-[5%] w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Reveal delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-600">{t.hero.badge}</span>
            </div>
          </Reveal>

          {/* Heading */}
          <Reveal delay={100}>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
              style={{
                whiteSpace: 'pre-line',
                background: 'linear-gradient(135deg, #111827 0%, #1e1b4b 30%, #4338ca 60%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t.hero.h1}
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={200}>
            <p className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-12 text-gray-500">
              {t.hero.sub}
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <a
                href="/login"
                className="group relative px-8 py-4 text-white font-semibold rounded-xl text-base overflow-hidden opacity-100 hover:opacity-100 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
              >
                <span className="relative z-10">{t.hero.cta1}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="#features"
                className="px-8 py-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl text-base hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-0.5 opacity-100 hover:opacity-100"
              >
                {t.hero.cta2}
              </a>
            </div>
          </Reveal>

          {/* Destination pills */}
          <Reveal delay={400}>
            <div className="flex flex-wrap justify-center gap-2">
              {t.destinations.map((d) => (
                <span
                  key={d}
                  className="px-3.5 py-1.5 text-xs rounded-full font-medium bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-200 cursor-default"
                >
                  {d}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-6 h-10 rounded-full border-2 border-gray-300 flex items-start justify-center p-1.5">
            <div className="w-1 h-2.5 bg-gray-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── METRICS ───────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {t.metrics.map((m, i) => (
              <Reveal key={m.label} delay={i * 100} direction="scale">
                <div className="text-center">
                  <div
                    className="text-4xl md:text-5xl font-bold tabular-nums mb-2"
                    style={{
                      background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    <AnimatedNumber value={m.value} suffix={m.suffix} duration={2000 + i * 300} />
                  </div>
                  <div className="text-sm text-gray-500 font-medium">{m.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-5">
              <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">{t.features.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">{t.features.h2}</h2>
            <p className="text-lg max-w-lg mx-auto text-gray-500">{t.features.sub}</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.featureList.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <GradientCard>
                  <div className="p-7">
                    <div className="text-2xl mb-4">{f.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                  </div>
                </GradientCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHINA MODE ────────────────────────────────────── */}
      <section id="china" className="py-28 px-6 bg-gray-50/80 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">{t.china.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">{t.china.h2}</h2>
            <p className="text-lg max-w-xl mx-auto text-gray-500">{t.china.sub}</p>
          </Reveal>

          {/* Service comparison table */}
          <Reveal>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-3 px-6 py-3.5 bg-gray-50 border-b border-gray-100">
                {t.china.tableHead.map((h, i) => (
                  <span
                    key={h}
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      i === 2 ? 'text-center text-red-500' : i === 1 ? 'text-center text-gray-400' : 'text-gray-400'
                    }`}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {/* Rows */}
              {services.map((s, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 px-6 py-4 items-center transition-colors duration-150 hover:bg-gray-50/80 ${
                    i < services.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-gray-700">
                    {lang === 'th' ? s.category.th : s.category.en}
                  </span>
                  <span className="text-center text-sm line-through text-gray-300 decoration-gray-300">
                    {s.global}
                  </span>
                  <span className="text-center text-sm font-semibold text-emerald-600">
                    {s.china}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Pills */}
          <Reveal delay={100}>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {t.china.pills.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white border border-gray-200 hover:border-emerald-200 hover:shadow-sm transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-sm">
                    {['📡', '🔌', '⚙️'][i]}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{p}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 mb-5">
              <span className="text-xs font-semibold text-gray-600 tracking-wide uppercase">{t.how.badge}</span>
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900"
              style={{ whiteSpace: 'pre-line' }}
            >
              {t.how.h2}
            </h2>
          </Reveal>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-[32px] left-[calc(16.6%+24px)] right-[calc(16.6%+24px)] h-px"
              style={{
                background: 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2), rgba(99,102,241,0.2))',
              }}
            />

            {t.how.steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 150}>
                <div className="group flex flex-col items-center text-center">
                  {/* Step number */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-400 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-lg group-hover:shadow-indigo-500/25 group-hover:scale-110">
                      {s.n}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-3">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500 max-w-[280px]">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(238,242,255,0.5) 0%, rgba(245,243,255,0.5) 50%, rgba(238,242,255,0.3) 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(226,232,240,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(226,232,240,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%)',
          }}
        />

        <Reveal className="relative z-10 max-w-lg mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-5">{t.cta.h2}</h2>
          <p className="text-lg mb-10 text-gray-500">{t.cta.sub}</p>
          <a
            href="/login"
            className="group relative inline-block px-10 py-4 text-white font-semibold text-base rounded-xl overflow-hidden opacity-100 hover:opacity-100 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            <span className="relative z-10">{t.cta.btn}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <p className="mt-6 text-sm text-gray-400">
            {t.cta.sub2}{' '}
            <a
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-2 opacity-100 hover:opacity-100 transition-colors"
            >
              {t.cta.sub2link}
            </a>
          </p>
        </Reveal>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 px-6 py-8 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md overflow-hidden">
              <Logo size={24} />
            </div>
            <span className="text-sm font-semibold text-gray-900">TripFlow</span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; 2026 TripFlow &middot; {t.footer}
          </p>
          <a
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors opacity-100 hover:opacity-100 font-medium"
          >
            {t.nav.signin} &rarr;
          </a>
        </div>
      </footer>
    </div>
  )
}
