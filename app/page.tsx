'use client'

import { useState, useEffect } from 'react'
import Loader from './Loader'

import MobileHome from './components/mobile/MobileHome'
import MobileDetail from './components/mobile/MobileDetail'

import DesktopHome from './components/desktop/DesktopHome'
import DesktopDetail from './components/desktop/DesktopDetail'

// Note: Compare pages are handled by /compare/[phones] route.
// MobileCompare and DesktopCompare are no longer rendered from this file.
// They live at app/compare/[phones]/page.tsx.

export default function Page() {
  const [isDesktop, setIsDesktop] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 1024)
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) return <Loader />

  if (!isDesktop) return <MobileHome />

  return <DesktopHome />
}
