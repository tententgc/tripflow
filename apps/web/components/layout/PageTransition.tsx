'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitioning, setTransitioning] = useState(false)
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (pathname !== prevPath.current) {
      // Path changed — run exit then enter
      setTransitioning(true)
      const timeout = setTimeout(() => {
        setDisplayChildren(children)
        setTransitioning(false)
        prevPath.current = pathname
      }, 200) // matches pageExit duration
      return () => clearTimeout(timeout)
    } else {
      // Initial load or same path — just update
      setDisplayChildren(children)
    }
  }, [pathname, children])

  return (
    <div
      className={transitioning ? 'page-transition-exit' : 'page-transition-enter'}
      key={transitioning ? 'exit' : pathname}
    >
      {displayChildren}
    </div>
  )
}
