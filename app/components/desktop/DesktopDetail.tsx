'use client'
import React, { useState, useEffect } from 'react'
import {
  Camera, Battery, Bolt, Smartphone, ArrowLeft, Heart, Maximize2,
  Cpu, MemoryStick, HardDrive, Search, Monitor, Zap,
  Video, Wifi, Weight, Ruler, Calendar, Award, Signal, Volume2, Info, Package, Bell, Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Phone, Favorite } from '@/lib/types'
import { API_BASE_URL, APP_ROUTES } from '@/lib/config'
import { api } from '@/lib/api'
import { cleanHTMLText } from '@/lib/utils'
import { isAuthenticated, getAuthToken } from '@/lib/auth'
import { navigateToLogin, navigateToPhone, navigateToCompare } from '@/lib/navigation'
import { extractCleanSpecs } from '@/lib/cleanSpecExtractor'
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback'
import { Tooltip } from '@/app/components/shared/Tooltip'
import { RatingsSummary } from '@/app/components/shared/RatingsSummary'
import { HorizontalPhoneScroll } from '@/app/components/shared/HorizontalPhoneScroll'
import { UserMenu } from '@/app/components/shared/UserMenu'
import { PriceAlertModal } from '@/app/components/shared/PriceAlertModal'
import { ReviewSection } from '@/app/components/shared/ReviewSection'
import MobyMonCard from '@/app/components/shared/MobyMonCard'
import { color, font } from '@/lib/tokens'
import { createPhoneSlug } from '@/lib/config'

const ICON_MAP: Record<string, any> = {
  '📱': Maximize2, '☀️': Zap, '🔧': Cpu, '📷': Camera, '🔍': Search,
  '🤳': Camera, '🔋': Battery, '💾': MemoryStick, '📂': HardDrive,
  '🏗️': Package, '📡': Wifi, '⚡': Bolt, '📏': Ruler, '🔘': Info,
  '✏️': Info, '🛰️': Signal, '💰': Info, '📸': Camera, '🔭': Video, '🔬': Camera,
}

const SPEC_TOOLTIPS: Record<string, { layman: string; nerd: string }> = {
  'Display': { layman: 'Screen size and type', nerd: 'Display diagonal, resolution, and panel technology' },
  'Chipset': { layman: 'Brain of the phone', nerd: 'System on Chip processor' },
  'RAM': { layman: 'Memory for running apps', nerd: 'LPDDR5/5X RAM capacity' },
  'Storage': { layman: 'Space for files', nerd: 'UFS 3.1/4.0 storage' },
  'Battery': { layman: 'Battery life', nerd: 'Battery capacity' },
  'Charging': { layman: 'Charging speed', nerd: 'Max charging power' },
}

// Minimum comparison count before showing "Also Compared With"
const ALSO_COMPARED_THRESHOLD = 5

interface DesktopDetailProps {
  phone: Phone
  initialReviews?: any[]
  initialStats?: any
  // Legacy SPA props — accepted but ignored, navigation is internal
  setView?: (view: string) => void
  setComparePhones?: (phones: Phone[]) => void
  setSelectedPhone?: (phone: Phone) => void
}

export default function DesktopDetail({ phone, initialStats }: DesktopDetailProps) {
  const router = useRouter()
  const [isOverviewMode, setIsOverviewMode] = useState(true)
  const [similarPhones, setSimilarPhones] = useState<Phone[]>([])
  const [alsoComparedWith, setAlsoComparedWith] = useState<Phone[]>([])
  const [comparisonCounts, setComparisonCounts] = useState<Record<number, number>>({})
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [phoneStats, setPhoneStats] = useState<any>(initialStats || null)
  const [showPriceAlert, setShowPriceAlert] = useState(false)
  const [showMobyMon, setShowMobyMon] = useState(false)

  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated()) return
      try {
        const data = await api.favorites.list()
        setIsFavorite(data.favorites?.some((f: Favorite) => f.phone_id === phone.id) ?? false)
      } catch {}
    }
    checkFavorite()
  }, [phone.id])

  useEffect(() => {
    fetchSimilarPhones()
    fetchAlsoComparedWith()
    if (!initialStats) fetchPhoneStats()

    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/history/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ phoneId: phone.id }),
      }).catch(() => {})
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [phone])

  const fetchPhoneStats = async () => {
    try {
      const data = await api.phones.getStats(phone.id)
      if (data.success) setPhoneStats(data.stats)
    } catch {}
  }

  const fetchAlsoComparedWith = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/phones/${phone.id}/also-compared`)
      const data = await res.json()
      if (data.success && data.phones.length > 0) {
        // Only show if at least one phone has enough comparisons
        const counts: Record<number, number> = data.comparisonCounts || {}
        const qualified = data.phones.filter((p: Phone) => (counts[p.id] || 0) >= ALSO_COMPARED_THRESHOLD)
        if (qualified.length > 0) {
          setAlsoComparedWith(qualified)
          setComparisonCounts(counts)
        }
      }
    } catch {}
  }

  const fetchSimilarPhones = async () => {
    try {
      const params: any = { page_size: 30 }
      if (phone.price_usd) {
        params.min_price = Math.floor(phone.price_usd * 0.7)
        params.max_price = Math.ceil(phone.price_usd * 1.3)
      }
      if (phone.ram_options?.length) params.min_ram = Math.max(Math.max(...phone.ram_options) - 2, 4)
      if (phone.storage_options?.length) params.min_storage = Math.max(Math.max(...phone.storage_options) / 2, 64)
      if (phone.release_year) params.min_year = phone.release_year - 1

      const data = await api.phones.search(params)

      const scored = (data.results || [])
        .filter((p: Phone) => p.id !== phone.id)
        .map((p: Phone) => {
          let score = 0
          if (p.brand === phone.brand) score += 40
          if (phone.price_usd && p.price_usd) score += Math.max(0, 25 - (Math.abs(phone.price_usd - p.price_usd) / phone.price_usd) * 25)
          if (phone.ram_options?.length && p.ram_options?.length) {
            const diff = Math.abs(Math.max(...phone.ram_options) - Math.max(...p.ram_options))
            score += diff === 0 ? 15 : diff <= 2 ? 10 : diff <= 4 ? 5 : 0
          }
          if (phone.battery_capacity && p.battery_capacity) {
            const diff = Math.abs(phone.battery_capacity - p.battery_capacity)
            score += diff <= 300 ? 10 : diff <= 500 ? 7 : diff <= 1000 ? 3 : 0
          }
          if (phone.release_year && p.release_year && phone.release_year === p.release_year) score += 5
          return { ...p, similarityScore: score }
        })
        .sort((a: any, b: any) => b.similarityScore - a.similarityScore)
        .slice(0, 12)

      setSimilarPhones(scored)
    } catch {}
  }

  const handleStartCompare = () => {
    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/comparisons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ phoneIds: [phone.id] }),
      }).catch(() => {})
    }
    router.push(APP_ROUTES.compare([createPhoneSlug(phone)]))
  }

  const handleCompareWithPhone = (comparePhone: Phone) => {
    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/comparisons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ phoneIds: [phone.id, comparePhone.id] }),
      }).catch(() => {})
    }
    router.push(APP_ROUTES.compare([phone, comparePhone].map(createPhoneSlug)))
  }

  const handlePhoneClick = (p: Phone) => navigateToPhone(router, p)

  const toggleFavorite = async () => {
    if (!isAuthenticated()) {
      navigateToLogin(router)
      return
    }
    if (favoriteLoading) return

    const previous = isFavorite
    setIsFavorite(!previous)
    setFavoriteLoading(true)

    try {
      if (previous) {
        await api.favorites.remove(phone.id)
      } else {
        await api.favorites.add(phone.id)
      }
    } catch {
      setIsFavorite(previous) // silent rollback
    } finally {
      setFavoriteLoading(false)
    }
  }

  const cleanSpecs = extractCleanSpecs(phone)
  const overviewSpecs = cleanSpecs
    .filter((s) => s.label !== 'Price')
    .map((s) => {
      let label = s.label
      if (s.label.includes('Wide') && !s.label.includes('Ultrawide')) label = 'Main Camera'
      else if (s.label.includes('Ultrawide')) label = 'Ultrawide Camera'
      else if (s.label.includes('Telephoto') || s.label.includes('Periscope')) label = 'Telephoto Camera'
      return { icon: ICON_MAP[s.icon] || Info, label, value: s.value, tooltip: SPEC_TOOLTIPS[label] || SPEC_TOOLTIPS[s.label] }
    })

  const getIconForCategory = (cat: string) => {
    const map: Record<string, any> = {
      Launch: Calendar, Body: Package, Display: Monitor, Platform: Cpu,
      Memory: MemoryStick, 'Main Camera': Camera, 'Selfie camera': Camera,
      'Selfie Camera': Camera, Sound: Volume2, Comms: Wifi, Features: Zap,
      Battery, Misc: Info, Network: Signal, 'Our Tests': Award,
    }
    return map[cat] || Info
  }

  const formatSpecValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return 'N/A'
    if (Array.isArray(value)) return value.map((v) => cleanHTMLText(v)).join(', ')
    if (typeof value === 'object') return cleanHTMLText(JSON.stringify(value))
    return cleanHTMLText(value)
  }

  const fullSpecs = phone.full_specifications?.specifications || {}
  const categoryOrder = ['Launch', 'Body', 'Display', 'Platform', 'Memory', 'Main Camera', 'Selfie camera', 'Battery', 'Comms', 'Sound', 'Features', 'Network', 'Misc', 'Our Tests']

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      {/* Navbar */}
      <div className="sticky top-0 z-30 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            {/* Back goes to previous page, not hardcoded home */}
            <ButtonPressFeedback
              onClick={() => router.back()}
              className="flex items-center gap-3 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft size={20} style={{ color: color.text }} />
              <img src="/logo.svg" alt="Mobylite" className="w-8 h-8" />
              <h2 className="text-xl font-bold" style={{ color: color.text }}>Mobylite</h2>
            </ButtonPressFeedback>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} style={{ color: color.textMuted }} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
                  }
                }}
                className="block w-full pl-12 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                style={{ backgroundColor: color.borderLight, border: `1px solid ${color.border}`, color: color.text }}
                onFocus={(e) => (e.currentTarget.style.borderColor = color.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = color.border)}
                placeholder="Search phones..."
              />
            </div>

            <ButtonPressFeedback
              className="p-2.5 rounded-full transition-all"
              style={{ color: isFavorite ? color.danger : color.textMuted, backgroundColor: isFavorite ? color.dangerBg : 'transparent' }}
              onClick={toggleFavorite}
            >
              <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
            </ButtonPressFeedback>

            <UserMenu variant="desktop" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-5 gap-8 mb-12">
          {/* Left column */}
          <div className="col-span-2">
            <div className="sticky top-24">
              <div className="flex gap-6 mb-6">
                <div
                  className="w-48 h-48 flex-shrink-0 rounded-2xl flex items-center justify-center overflow-hidden border"
                  style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}
                >
                  {phone.main_image_url ? (
                    <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-6" />
                  ) : (
                    <Smartphone size={80} style={{ color: color.textLight }} />
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: color.textMuted }}>
                    {phone.brand}
                  </p>
                  <h1 className="text-3xl font-bold leading-tight mb-2" style={{ fontFamily: font.primary, color: color.text }}>
                    {phone.model_name}
                  </h1>
                  {phoneStats && <RatingsSummary phoneId={phone.id} variant="compact" />}
                  {phone.release_date_full && (
                    <p className="text-sm font-medium mt-2" style={{ color: color.textMuted }}>
                      {cleanHTMLText(phone.release_date_full)}
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              {phone.price_usd && (
                <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: color.text, color: color.bg }}>
                  <p className="text-sm font-bold mb-1 opacity-70">PRICE</p>
                  <p className="text-4xl font-bold" style={{ fontFamily: font.numeric }}>${phone.price_usd}</p>
                  {phone.price_original && phone.currency && (
                    <p className="text-sm opacity-70 mt-1">{phone.price_original} {phone.currency}</p>
                  )}
                </div>
              )}

              {/* Primary CTA */}
              {phone.amazon_link && (
                <ButtonPressFeedback className="w-full mb-3" onClick={() => window.open(phone.amazon_link!, '_blank')}>
                  <div
                    className="w-full py-4 text-center font-bold rounded-xl text-sm"
                    style={{ backgroundColor: color.primary, color: color.primaryText }}
                  >
                    Buy on Amazon
                  </div>
                </ButtonPressFeedback>
              )}

              {/* Secondary CTAs */}
              <div className="space-y-2">
                <ButtonPressFeedback
                  onClick={handleStartCompare}
                  className="w-full py-3 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: color.borderLight, color: color.text }}
                  hoverStyle={{ backgroundColor: color.border }}
                >
                  Compare this phone
                </ButtonPressFeedback>

                <ButtonPressFeedback
                  onClick={() => setShowPriceAlert(true)}
                  className="w-full py-3 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: color.borderLight, color: color.text }}
                  hoverStyle={{ backgroundColor: color.border }}
                >
                  <Bell size={16} />
                  Set Price Alert
                </ButtonPressFeedback>
              </div>

              {/* MobyMon as footnote — not primary action */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowMobyMon(true)}
                  className="text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-60"
                  style={{ color: color.textMuted }}
                >
                  View MobyMon Card
                </button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold" style={{ fontFamily: font.primary, color: color.text }}>
                Specifications
              </h2>
              <div className="inline-flex p-1 rounded-xl" style={{ backgroundColor: color.borderLight }}>
                <button
                  onClick={() => setIsOverviewMode(true)}
                  className={`px-6 py-2.5 text-xs font-bold transition-all rounded-lg ${isOverviewMode ? 'shadow-sm' : ''}`}
                  style={isOverviewMode ? { backgroundColor: color.bg, color: color.text } : { color: color.textMuted }}
                >
                  OVERVIEW
                </button>
                <button
                  onClick={() => setIsOverviewMode(false)}
                  className={`px-6 py-2.5 text-xs font-bold transition-all rounded-lg ${!isOverviewMode ? 'shadow-sm' : ''}`}
                  style={!isOverviewMode ? { backgroundColor: color.bg, color: color.text } : { color: color.textMuted }}
                >
                  FULL SPECS
                </button>
              </div>
            </div>

            {isOverviewMode ? (
              <div className="grid grid-cols-2 gap-4">
                {overviewSpecs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-5 transition-all"
                    style={{ backgroundColor: color.bg, border: `1px solid ${color.borderLight}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = color.text)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = color.borderLight)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color.borderLight }}>
                        <spec.icon size={20} style={{ color: color.text }} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>
                          {spec.label}
                        </span>
                        {spec.tooltip && (
                          <Tooltip term={spec.label} layman={spec.tooltip.layman} nerd={spec.tooltip.nerd} />
                        )}
                      </div>
                    </div>
                    <p className="text-base font-bold leading-snug" style={{ color: color.text }}>{spec.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(fullSpecs)
                  .sort(([a], [b]) => {
                    const ia = categoryOrder.indexOf(a), ib = categoryOrder.indexOf(b)
                    if (ia === -1 && ib === -1) return 0
                    if (ia === -1) return 1
                    if (ib === -1) return -1
                    return ia - ib
                  })
                  .map(([category, specs]) => {
                    const Icon = getIconForCategory(category)
                    return (
                      <div key={category} className="rounded-xl overflow-hidden border" style={{ backgroundColor: color.bg, border: `1px solid ${color.borderLight}` }}>
                        <div className="border-b px-5 py-3 flex items-center gap-3" style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
                            <Icon size={14} style={{ color: color.text }} />
                          </div>
                          <h3 className="text-sm font-bold" style={{ color: color.text }}>{category}</h3>
                        </div>
                        <div className="p-5 space-y-3">
                          {Object.entries(specs).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-12 py-3 border-b last:border-0 items-start" style={{ borderColor: color.borderLight }}>
                              <span className="col-span-2 text-xs font-bold uppercase tracking-wide pr-4" style={{ color: color.textMuted }}>{key}</span>
                              <span className="col-span-10 text-xs font-medium leading-relaxed" style={{ color: color.text }}>{formatSpecValue(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        {similarPhones.length > 0 && (
          <HorizontalPhoneScroll
            title="Similar Phones"
            subtitle="Based on specs, price, and features"
            phones={similarPhones}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
            variant="desktop"
          />
        )}

        {alsoComparedWith.length > 0 && (
          <HorizontalPhoneScroll
            title="Also Compared With"
            phones={alsoComparedWith}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
            showComparisonCount
            comparisonCounts={comparisonCounts}
            variant="desktop"
          />
        )}

        {/* Reviews — with scroll anchor */}
        <div id="reviews" className="mt-16 scroll-mt-24">
          <h3 className="text-2xl font-bold mb-8" style={{ color: color.text }}>Reviews & Ratings</h3>
          <ReviewSection phoneId={phone.id} />
        </div>
      </div>

      {showMobyMon && <MobyMonCard phone={phone} onClose={() => setShowMobyMon(false)} />}
      <PriceAlertModal show={showPriceAlert} onClose={() => setShowPriceAlert(false)} phone={phone} />
    </div>
  )
}
