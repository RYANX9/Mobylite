'use client'
import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const load = async () => {
      const phoneParam = params.phones as string

      if (!phoneParam) {
        setPhones([])
        setLoading(false)
        return
      }

      const slugs = phoneParam.split('-vs-')

      try {
        const results = await Promise.all(
          slugs.map(async (slug) => {
            const q = slug.replace(/-/g, ' ')
            const data = await api.phones.search({ q, page_size: 1 })
            if (data.results?.length > 0) {
              return api.phones.getDetails(data.results[0].id)
            }
            return null
          })
        )
        setPhones(results.filter((p): p is Phone => p !== null))
      } catch (err) {
        console.error('Error loading compare phones:', err)
        setPhones([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [params])

  const handlePhonesChange = (newPhones: Phone[]) => {
    setPhones(newPhones)

    if (newPhones.length === 0) {
      // Stay on compare page and show empty state — do NOT redirect home
      window.history.replaceState(null, '', '/compare')
      return
    }

    const slugs = newPhones.map(createPhoneSlug)
    window.history.replaceState(null, '', APP_ROUTES.compare(slugs))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: color.bg }}>
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
        onBack={() => router.push(APP_ROUTES.home)}
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
