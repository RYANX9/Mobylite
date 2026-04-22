'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Phone } from '@/lib/types'
import { api } from '@/lib/api'
import { createPhoneSlug, APP_ROUTES } from '@/lib/config'
import MobileCompare from '@/app/components/mobile/MobileCompare'
import DesktopCompare from '@/app/components/desktop/DesktopCompare'
import { color } from '@/lib/tokens'

export default function ComparePage() {
  const params = useParams()
  const router = useRouter()
  const [phones, setPhones] = useState<Phone[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Track whether we are currently syncing from URL (initial load)
  // vs syncing TO url (user action). Prevents feedback loop.
  const isInitialLoad = useRef(true)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // On mount: read URL slugs, fetch phones once.
  useEffect(() => {
    const phoneParam = params.phones as string

    if (!phoneParam) {
      setPhones([])
      setLoading(false)
      return
    }

    const slugs = phoneParam.split('-vs-').filter(Boolean)

    if (slugs.length === 0) {
      setPhones([])
      setLoading(false)
      return
    }

    setLoading(true)

    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          slugs.map(async (slug) => {
            const searchTerm = slug.replace(/-/g, ' ')
            const data = await api.phones.search({ q: searchTerm, page_size: 3 })
            if (!data.results?.length) return null
            // Try to pick the best match — phone whose slug matches exactly
            const match =
              data.results.find(
                (p: Phone) => createPhoneSlug(p) === slug
              ) || data.results[0]
            return api.phones.getDetails(match.id)
          })
        )
        const valid = results.filter((p): p is Phone => p !== null)
        setPhones(valid)
      } catch {
        setPhones([])
      } finally {
        setLoading(false)
        isInitialLoad.current = false
      }
    }

    fetchAll()
    // Only runs on mount / actual URL param change from outside (browser nav)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When user adds/removes phones inside the compare table,
  // sync the URL without triggering a re-fetch.
  const handlePhonesChange = (newPhones: Phone[]) => {
    setPhones(newPhones)

    if (newPhones.length === 0) {
      // Stay on page, update URL to /compare (no slugs)
      window.history.replaceState(null, '', '/compare')
      return
    }

    const slugs = newPhones.map(createPhoneSlug)
    const newPath = APP_ROUTES.compare(slugs)
    window.history.replaceState(null, '', newPath)
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: color.bg }}
      >
        <div
          className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
          style={{ borderColor: color.border }}
        />
      </div>
    )
  }

  if (isMobile) {
    return (
      <MobileCompare
        phones={phones}
        onPhonesChange={handlePhonesChange}
        onBack={() => router.push('/')}
      />
    )
  }

  return (
    <DesktopCompare
      phones={phones}
      onPhonesChange={handlePhonesChange}
    />
  )
}
