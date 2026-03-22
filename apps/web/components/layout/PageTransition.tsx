'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Trigger enter animation on every path change
    setAnimate(false)
    const raf = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(raf)
  }, [pathname])

  return (
    <div className={animate ? 'page-transition-enter' : 'opacity-0'}>
      {children}
    </div>
  )
}
