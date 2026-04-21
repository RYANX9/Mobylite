'use client'
import React, { useState, useEffect } from 'react'
import {
  Camera, Battery, Bolt, Smartphone, ArrowLeft, Heart, Maximize2,
  Cpu, MemoryStick, HardDrive, Search, Monitor, Zap,
  Video, Wifi, Weight, Ruler, Calendar, Award, Signal, Volume2, Info, Package, Bell,
  ChevronDown, ChevronUp, Star, Users, TrendingUp, Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Phone, Favorite } from '@/lib/types'
import { API_BASE_URL, APP_ROUTES } from '@/lib/config'
import { api } from '@/lib/api'
import { cleanHTMLText } from '@/lib/utils'
import { isAuthenticated, getAuthToken } from '@/lib/auth'
import { navigateToLogin, navigateToPhone } from '@/lib/navigation'
import { extractCleanSpecs } from '@/lib/cleanSpecExtractor'
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback'
import { ReviewSection } from '@/app/components/shared/ReviewSection'
import { HorizontalPhoneScroll } from '@/app/components/shared/HorizontalPhoneScroll'
import { UserMenu } from '@/app/components/shared/UserMenu'
import { PriceAlertModal } from '@/app/components/shared/PriceAlertModal'
import { CompareFloatingPanel } from '@/app/components/shared/CompareFloatingPanel'
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
  'Battery': { layman: 'Battery life', nerd: 'Battery capacity' },
  'Charging': { layman: 'Charging speed', nerd: 'Max charging power' },
}

const ALSO_COMPARED_THRESHOLD = 5

interface MobileDetailProps {
  phone: Phone
  initialReviews?: any[]
  initialStats?: any
  setView?: (view: string) => void
  setComparePhones?: (phones: Phone[]) => void
  setSelectedPhone?: (phone: Phone) => void
}

export default function MobileDetail({ phone, initialStats }: MobileDetailProps) {
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Launch', 'Body', 'Display']))
  // Tooltip expansion is now separate from navigation — tracks index of open tooltip
  const [expandedTooltip, setExpandedTooltip] = useState<number | null>(null)
  const [compareList, setCompareList] = useState<Phone[]>([])
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
      setIsFavorite(previous)
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

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      {/* Navbar */}
      <div className="sticky top-0 z-40 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Back goes to previous page */}
            <ButtonPressFeedback onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft size={20} style={{ color: color.text }} />
              <span className="text-base font-bold" style={{ color: color.text }}>Back</span>
            </ButtonPressFeedback>

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0 relative">
                <Search size={16} style={{ color: color.textMuted }} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-full text-sm font-medium focus:outline-none"
                  style={{ backgroundColor: color.borderLight, border: `1px solid ${color.border}`, color: color.text }}
                  placeholder="Search..."
                />
              </div>

              <ButtonPressFeedback
                onClick={toggleFavorite}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isFavorite ? color.dangerBg : color.borderLight }}
              >
                <Heart size={20} style={{ color: isFavorite ? color.danger : color.textMuted }} fill={isFavorite ? 'currentColor' : 'none'} />
              </ButtonPressFeedback>

              <UserMenu variant="mobile" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden border flex-shrink-0"
            style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}
          >
            {phone.main_image_url ? (
              <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain p-3" />
            ) : (
              <Smartphone size={40} style={{ color: color.textLight }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>{phone.brand}</p>
            <h1 className="text-xl font-bold leading-tight mb-2" style={{ fontFamily: font.primary, color: color.text }}>
              {phone.model_name}
            </h1>

            {phone.price_usd && (
              <p className="text-lg font-bold mb-1" style={{ color: color.text }}>${phone.price_usd.toLocaleString()}</p>
            )}

            {phoneStats?.average_rating > 0 && (
              <div className="flex items-center gap-1.5">
                <Star size={13} style={{ color: color.starFilled }} fill={color.starFilled} />
                <span className="text-xs font-bold" style={{ color: color.text }}>{phoneStats.average_rating.toFixed(1)}</span>
                <span className="text-[11px]" style={{ color: color.textMuted }}>({phoneStats.total_reviews.toLocaleString()})</span>
              </div>
            )}
          </div>
        </div>

        {/* Primary CTA */}
        {phone.amazon_link && (
          <ButtonPressFeedback onClick={() => window.open(phone.amazon_link!, '_blank')} className="w-full mb-3">
            <div className="w-full py-4 text-center font-bold rounded-xl text-sm" style={{ backgroundColor: color.primary, color: color.primaryText }}>
              Buy on Amazon
            </div>
          </ButtonPressFeedback>
        )}

        {/* Secondary CTAs */}
        <div className="flex gap-2 mb-1">
          <ButtonPressFeedback
            onClick={() => setShowPriceAlert(true)}
            className="flex-1 py-3 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: color.borderLight, color: color.text }}
          >
            <Bell size={16} />
            Price Alert
          </ButtonPressFeedback>
        </div>

        {/* MobyMon as footnote */}
        <div className="text-center mt-2 mb-2">
          <button
            onClick={() => setShowMobyMon(true)}
            className="text-xs underline underline-offset-2"
            style={{ color: color.textMuted }}
          >
            View MobyMon Card
          </button>
        </div>
      </div>

      {/* Specs */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ fontFamily: font.primary, color: color.text }}>Specifications</h2>
          <div className="inline-flex p-1 rounded-full" style={{ backgroundColor: color.borderLight }}>
            <button
              onClick={() => setIsOverviewMode(true)}
              className={`px-4 py-2 text-xs font-bold rounded-full ${isOverviewMode ? 'shadow-sm' : ''}`}
              style={isOverviewMode ? { backgroundColor: color.bg, color: color.text } : { color: color.textMuted }}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setIsOverviewMode(false)}
              className={`px-4 py-2 text-xs font-bold rounded-full ${!isOverviewMode ? 'shadow-sm' : ''}`}
              style={!isOverviewMode ? { backgroundColor: color.bg, color: color.text } : { color: color.textMuted }}
            >
              FULL SPECS
            </button>
          </div>
        </div>

        {isOverviewMode ? (
          <div className="grid grid-cols-2 gap-3">
            {overviewSpecs.map((spec, idx) => {
              const isOpen = expandedTooltip === idx
              return (
                <div key={idx} className="rounded-xl overflow-hidden border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
                  {/* Main card — navigates on click, separate tooltip toggle button */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color.borderLight }}>
                          <spec.icon size={16} style={{ color: color.text }} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: color.textMuted }}>
                          {spec.label}
                        </span>
                      </div>
                      {/* Tooltip toggle — separate from navigation */}
                      {spec.tooltip && (
                        <button
                          onClick={() => setExpandedTooltip(isOpen ? null : idx)}
                          className="p-1 rounded-full"
                          style={{ color: color.textMuted }}
                        >
                          <Info size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm font-bold leading-snug" style={{ color: color.text }}>{spec.value}</p>
                  </div>

                  {/* Tooltip expansion */}
                  {isOpen && spec.tooltip && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: color.borderLight }}>
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-xs font-bold mb-0.5" style={{ color: color.text }}>What it means</p>
                          <p className="text-xs" style={{ color: color.textMuted }}>{spec.tooltip.layman}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold mb-0.5" style={{ color: color.text }}>Technical</p>
                          <p className="text-xs" style={{ color: color.textMuted }}>{spec.tooltip.nerd}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
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
                const isExpanded = expandedCategories.has(category)
                return (
                  <div key={category} className="rounded-xl overflow-hidden border" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
                    <ButtonPressFeedback
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-3 flex items-center justify-between border-b"
                      style={{ backgroundColor: color.borderLight, borderColor: color.borderLight }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ backgroundColor: color.bg, borderColor: color.border }}>
                          <Icon size={14} style={{ color: color.text }} />
                        </div>
                        <h3 className="text-sm font-bold" style={{ color: color.text }}>{category}</h3>
                      </div>
                      {isExpanded ? <ChevronUp size={18} style={{ color: color.textMuted }} /> : <ChevronDown size={18} style={{ color: color.textMuted }} />}
                    </ButtonPressFeedback>

                    {isExpanded && (
                      <div className="p-4">
                        {Object.entries(specs).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-12 py-2.5 border-b last:border-0 items-start" style={{ borderColor: color.borderLight }}>
                            <span className="col-span-4 text-xs font-bold uppercase tracking-wide pr-4" style={{ color: color.textMuted }}>{key}</span>
                            <span className="col-span-8 text-xs font-medium leading-relaxed" style={{ color: color.text }}>{formatSpecValue(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {similarPhones.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 px-4 mb-4">
            <TrendingUp size={18} style={{ color: color.text }} />
            <h3 className="text-lg font-bold" style={{ fontFamily: font.primary, color: color.text }}>Similar Phones</h3>
          </div>
          <HorizontalPhoneScroll
            title=""
            phones={similarPhones}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
            variant="mobile"
          />
        </div>
      )}

      {alsoComparedWith.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 px-4 mb-4">
            <Users size={18} style={{ color: color.text }} />
            <h3 className="text-lg font-bold" style={{ fontFamily: font.primary, color: color.text }}>Also Compared With</h3>
          </div>
          <HorizontalPhoneScroll
            title=""
            phones={alsoComparedWith}
            onPhoneClick={handlePhoneClick}
            onCompareClick={handleCompareWithPhone}
            showComparisonCount
            comparisonCounts={comparisonCounts}
            variant="mobile"
          />
        </div>
      )}

      {/* Reviews with scroll anchor */}
      <div id="reviews" className="px-4 pb-20 scroll-mt-16">
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} style={{ color: color.text }} />
          <h3 className="text-lg font-bold" style={{ fontFamily: font.primary, color: color.text }}>Reviews & Ratings</h3>
        </div>
        <ReviewSection phoneId={phone.id} variant="mobile" />
      </div>

      <CompareFloatingPanel
        compareList={compareList}
        onRemove={(id) => setCompareList((prev) => prev.filter((p) => p.id !== id))}
        onClear={() => setCompareList([])}
        onCompare={() => {
          router.push(APP_ROUTES.compare([phone, ...compareList].map(createPhoneSlug)))
        }}
        variant="mobile"
      />

      {showMobyMon && <MobyMonCard phone={phone} onClose={() => setShowMobyMon(false)} />}
      <PriceAlertModal show={showPriceAlert} onClose={() => setShowPriceAlert(false)} phone={phone} />
    </div>
  )
}
