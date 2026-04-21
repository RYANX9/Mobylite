'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Search, Loader2, Smartphone, Star, Sparkles } from 'lucide-react'
import { Phone, Filters, User } from '@/lib/types'
import { API_BASE_URL, APP_ROUTES, RECOMMENDATION_CATEGORIES } from '@/lib/config'
import { createPhoneSlug } from '@/lib/config'
import { isAuthenticated, getAuthToken } from '@/lib/auth'
import { navigateToLogin, navigateToPhone, navigateToCompare } from '@/lib/navigation'
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback'
import { SearchBar } from '@/app/components/shared/SearchBar'
import { PhoneCard } from '@/app/components/shared/PhoneCard'
import { RecommendationButtons } from '@/app/components/shared/RecommendationButtons'
import { CompareFloatingPanel } from '@/app/components/shared/CompareFloatingPanel'
import { ActiveFilterChips } from '@/app/components/shared/ActiveFilterChips'
import QuizModal from '@/app/components/shared/QuizModal'
import { PriceAlertModal } from '@/app/components/shared/PriceAlertModal'
import { UserMenu } from '@/app/components/shared/UserMenu'
import { FilterPanel } from '@/app/components/shared/FilterPanel'
import { useRouter } from 'next/navigation'
import { color, font } from '@/lib/tokens'
import { api } from '@/lib/api'

interface ExtendedFilters extends Filters {
  brands?: string[]
}

const INITIAL_FILTERS: ExtendedFilters = { brands: [] }

interface DesktopHomeProps {
  setSelectedPhone: (phone: Phone) => void
  setView: (view: string) => void
  setComparePhones: (phones: Phone[]) => void
  onNavigateToCompare?: (phones: Phone[]) => void
  onNavigateToPhone?: (phone: Phone) => void
}

export default function DesktopHome({
  setSelectedPhone,
  setView,
  setComparePhones,
}: DesktopHomeProps) {
  const router = useRouter()
  const [phones, setPhones] = useState<Phone[]>([])
  const [topRatedPhones, setTopRatedPhones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [warmingUp, setWarmingUp] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [activeRecommendation, setActiveRecommendation] = useState<string | null>(null)
  const [compareList, setCompareList] = useState<Phone[]>([])
  const [showQuiz, setShowQuiz] = useState(false)
  const [showPriceAlert, setShowPriceAlert] = useState(false)
  const [selectedPhoneForAlert, setSelectedPhoneForAlert] = useState<Phone | null>(null)
  const [sortBy, setSortBy] = useState('release_year')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<ExtendedFilters>(INITIAL_FILTERS)
  const [favoritePhoneIds, setFavoritePhoneIds] = useState<Set<number>>(new Set())
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated()) return
      try {
        const res = await api.auth.getMe()
        if (res.success || res.id) setCurrentUser(res.user || res)
      } catch {}
    }
    loadUser()
  }, [])

  useEffect(() => {
    fetchTopRated()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setActiveRecommendation(null)
      fetchPhones()
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (!activeRecommendation) fetchPhones()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters, sortBy, sortOrder, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])
  // Sort changes do NOT reset page — user explicitly picked a sort, keep their position

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated()) return
      try {
        const res = await api.favorites.list()
        if (res.success && res.favorites) {
          setFavoritePhoneIds(new Set(res.favorites.map((f: any) => f.phone_id)))
        }
      } catch {}
    }
    loadFavorites()
  }, [currentUser])

  const fetchTopRated = async () => {
    try {
      const data = await api.phones.search({ sort_by: 'antutu_score', page_size: 50 })
      const withRatings = await Promise.all(
        (data.results || []).slice(0, 20).map(async (phone: Phone) => {
          try {
            const s = await api.phones.getStats(phone.id)
            if (s.success && s.stats) {
              return { ...phone, rating: s.stats.average_rating, review_count: s.stats.total_reviews }
            }
          } catch {}
          return { ...phone, rating: 0, review_count: 0 }
        })
      )
      const rated = withRatings
        .filter((p) => p.review_count > 0)
        .sort((a, b) => b.rating !== a.rating ? b.rating - a.rating : b.review_count - a.review_count)
        .slice(0, 10)
      setTopRatedPhones(rated)
    } catch {
      setTopRatedPhones([])
    }
  }

  const fetchPhones = async () => {
    setLoading(true)

    // Show warmup message if API takes > 4s (Render cold start)
    warmupTimerRef.current = setTimeout(() => setWarmingUp(true), 4000)

    try {
      const params = {
        ...filters,
        q: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        page_size: 40,
      }
      const data = await api.phones.search(params)
      setPhones(data.results || [])
      setTotalResults(data.total || 0)
    } catch {
      setPhones([])
      setTotalResults(0)
    } finally {
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current)
      setWarmingUp(false)
      setLoading(false)
    }
  }

  const fetchRecommendations = async (useCase: string) => {
    setLoading(true)
    setActiveRecommendation(useCase)
    try {
      const data = await api.phones.recommend(useCase, undefined, 50)
      setPhones(data.recommendations || [])
      setTotalResults((data.recommendations || []).length)
    } catch {
      setPhones([])
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }

  const handleRecommendationClick = (id: string) => {
    if (activeRecommendation === id) {
      setActiveRecommendation(null)
      fetchPhones()
    } else {
      fetchRecommendations(id)
    }
  }

  const handleFiltersChange = (newFilters: ExtendedFilters) => {
    setActiveRecommendation(null)
    setFilters(newFilters)
  }

  const handleRemoveFilter = (key: keyof Filters) => {
    const updated = { ...filters }
    // When removing price, clear both bounds
    if (key === 'min_price') { delete updated.min_price; delete updated.max_price }
    else delete (updated as any)[key]
    handleFiltersChange(updated)
  }

  const handleRemoveBrand = (brand: string) => {
    handleFiltersChange({
      ...filters,
      brands: (filters.brands || []).filter((b) => b !== brand),
    })
  }

  const addToCompare = (phone: Phone) => {
    if (compareList.length >= 4 || compareList.find((p) => p.id === phone.id)) return
    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/comparisons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ phoneIds: [...compareList.map((p) => p.id), phone.id] }),
      }).catch(() => {})
    }
    setCompareList([...compareList, phone])
  }

  const removeFromCompare = (phoneId: number) =>
    setCompareList(compareList.filter((p) => p.id !== phoneId))

  const handleFavoriteToggle = (phone: Phone) => {
    setFavoritePhoneIds((prev) => {
      const next = new Set(prev)
      next.has(phone.id) ? next.delete(phone.id) : next.add(phone.id)
      return next
    })
  }

  const handlePhoneClick = (phone: Phone) => navigateToPhone(router, phone)

  const handleQuizComplete = (newFilters: Partial<Filters>) => {
    setActiveRecommendation(null)
    setFilters({ ...filters, ...newFilters })
    setShowQuiz(false)
  }

  const handleCompareNavigate = () => navigateToCompare(router, compareList)

  const activeFilterCount = [
    filters.min_price || filters.max_price,
    ...(filters.brands || []),
    filters.min_ram,
    filters.min_storage,
    filters.min_battery,
    filters.min_camera_mp,
    filters.min_year,
  ].filter(Boolean).length

  const Pagination = () => {
    const totalPages = Math.ceil(totalResults / 40)
    if (totalPages <= 1) return null

    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8 mb-12">
        <ButtonPressFeedback
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
          style={{
            backgroundColor: currentPage === 1 ? color.borderLight : color.text,
            color: currentPage === 1 ? color.textMuted : color.bg,
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
        >
          Previous
        </ButtonPressFeedback>

        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`e${idx}`} className="px-3 py-2 text-sm font-bold" style={{ color: color.textMuted }}>...</span>
          ) : (
            <ButtonPressFeedback
              key={page}
              onClick={() => setCurrentPage(page as number)}
              className="px-4 py-2 rounded-lg font-bold text-sm transition-all min-w-[40px] text-center"
              style={{
                backgroundColor: page === currentPage ? color.text : color.borderLight,
                color: page === currentPage ? color.bg : color.text,
                border: page === currentPage ? 'none' : `1px solid ${color.border}`,
              }}
            >
              {page}
            </ButtonPressFeedback>
          )
        )}

        <ButtonPressFeedback
          onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalResults / 40), p + 1))}
          disabled={currentPage === Math.ceil(totalResults / 40)}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
          style={{
            backgroundColor: currentPage === Math.ceil(totalResults / 40) ? color.borderLight : color.text,
            color: currentPage === Math.ceil(totalResults / 40) ? color.textMuted : color.bg,
            opacity: currentPage === Math.ceil(totalResults / 40) ? 0.5 : 1,
          }}
        >
          Next
        </ButtonPressFeedback>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      <QuizModal show={showQuiz} onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />
      <PriceAlertModal show={showPriceAlert} onClose={() => setShowPriceAlert(false)} phone={selectedPhoneForAlert} />
      <CompareFloatingPanel
        compareList={compareList}
        onRemove={removeFromCompare}
        onClear={() => setCompareList([])}
        onCompare={handleCompareNavigate}
        variant="desktop"
      />

      {/* Navbar — replaces the hero entirely */}
      <div
        className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
      >
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 flex-shrink-0">
              <img src="/logo.svg" alt="Mobylite" className="w-8 h-8" />
              <h1 className="text-xl font-bold" style={{ fontFamily: font.primary, color: color.text }}>
                Mobylite
              </h1>
            </div>

            <SearchBar value={searchQuery} onChange={setSearchQuery} className="flex-1" variant="desktop" />

            <ButtonPressFeedback
              onClick={() => setShowQuiz(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: color.text, color: color.bg }}
            >
              <Sparkles size={16} strokeWidth={2.5} />
              Find My Phone
            </ButtonPressFeedback>

            <UserMenu variant="desktop" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Top Rated strip */}
        {topRatedPhones.length > 0 && !activeRecommendation && !searchQuery && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Star size={20} style={{ color: color.text }} />
              <h2 className="text-xl font-bold" style={{ fontFamily: font.primary, color: color.text }}>
                Top Rated
              </h2>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
              {topRatedPhones.map((phone) => (
                <TopRatedCard key={phone.id} phone={phone} onClick={handlePhoneClick} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <FilterPanel
                filters={filters}
                setFilters={handleFiltersChange}
                onReset={() => setFilters(INITIAL_FILTERS)}
                variant="desktop"
              />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="mb-5">
              <RecommendationButtons
                activeRecommendation={activeRecommendation}
                onRecommendationClick={handleRecommendationClick}
                variant="desktop"
              />
            </div>

            {/* Results header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 pb-4 border-b-2" style={{ borderColor: color.text }}>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: font.primary, color: color.text }}>
                    {activeRecommendation
                      ? RECOMMENDATION_CATEGORIES[activeRecommendation as keyof typeof RECOMMENDATION_CATEGORIES]?.title
                      : 'Latest Releases'}
                  </h2>
                  {totalResults > 0 && (
                    <p className="text-xs font-medium mt-1" style={{ color: color.textMuted }}>
                      {totalResults} phone{totalResults !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sb, so] = e.target.value.split('-')
                    setSortBy(sb)
                    setSortOrder(so)
                  }}
                  className="px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none"
                  style={{ border: `1px solid ${color.border}`, backgroundColor: color.bg, color: color.text }}
                >
                  <option value="release_year-desc">Newest First</option>
                  <option value="release_year-asc">Oldest First</option>
                  <option value="price_usd-asc">Price: Low to High</option>
                  <option value="price_usd-desc">Price: High to Low</option>
                </select>
              </div>

              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <ActiveFilterChips
                  filters={filters}
                  onRemove={handleRemoveFilter}
                  onRemoveBrand={handleRemoveBrand}
                />
              )}
            </div>

            {/* Warmup message */}
            {loading && warmingUp && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm font-medium text-center"
                style={{ backgroundColor: color.borderLight, color: color.textMuted }}
              >
                Server is warming up — this may take a few seconds...
              </div>
            )}

            {loading && (
              <div className="flex justify-center items-center py-32">
                <Loader2 className="animate-spin" size={48} style={{ color: color.textMuted }} />
              </div>
            )}

            {!loading && phones.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-5 mb-8">
                  {phones.map((phone) => (
                    <PhoneCard
                      key={phone.id}
                      phone={phone}
                      variant="desktop"
                      onPhoneClick={handlePhoneClick}
                      onCompareToggle={(p) =>
                        compareList.find((cp) => cp.id === p.id) ? removeFromCompare(p.id) : addToCompare(p)
                      }
                      onPriceAlert={(p) => { setSelectedPhoneForAlert(p); setShowPriceAlert(true) }}
                      onFavoriteToggle={handleFavoriteToggle}
                      isInCompare={!!compareList.find((p) => p.id === phone.id)}
                      isInFavorites={favoritePhoneIds.has(phone.id)}
                    />
                  ))}
                </div>
                <Pagination />
              </>
            )}

            {!loading && phones.length === 0 && (
              <div className="text-center py-32 px-4">
                <Smartphone size={64} style={{ color: color.borderLight }} className="mx-auto" />
                <h3 className="font-bold text-lg mt-6 mb-2" style={{ color: color.text }}>No phones found</h3>
                <p className="text-sm mb-6" style={{ color: color.textMuted }}>
                  Try adjusting your filters or search terms
                </p>
                {activeFilterCount > 0 && (
                  <ButtonPressFeedback
                    onClick={() => setFilters(INITIAL_FILTERS)}
                    className="px-6 py-3 rounded-xl font-bold text-sm"
                    style={{ backgroundColor: color.text, color: color.bg }}
                  >
                    Clear all filters
                  </ButtonPressFeedback>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface TopRatedCardProps {
  phone: Phone & { rating?: number; review_count?: number }
  onClick: (phone: Phone) => void
}

const TopRatedCard: React.FC<TopRatedCardProps> = ({ phone, onClick }) => {
  const [hovered, setHovered] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <ButtonPressFeedback
      onClick={() => onClick(phone)}
      className="rounded-2xl overflow-hidden flex-shrink-0 w-[380px] flex flex-row transition-all duration-200"
      style={{
        backgroundColor: color.bg,
        border: `1px solid ${hovered ? color.border : color.borderLight}`,
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-28 h-28 flex items-center justify-center flex-shrink-0 border-r"
        style={{ backgroundColor: color.borderLight, borderColor: color.border }}
      >
        {phone.main_image_url && !imgFailed ? (
          <img
            src={phone.main_image_url}
            alt={phone.model_name}
            className="w-full h-full object-contain p-3"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Smartphone size={36} style={{ color: color.textLight }} strokeWidth={1.5} />
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: color.textMuted }}>
            {phone.brand}
          </p>
          {phone.rating && phone.rating > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold" style={{ color: color.text }}>
                {phone.rating.toFixed(1)}
              </span>
              <Star size={12} fill={color.starFilled} style={{ color: color.starFilled }} />
            </div>
          )}
        </div>

        <h3 className="font-bold text-sm leading-snug mb-1.5 line-clamp-2" style={{ color: color.text }}>
          {phone.model_name}
        </h3>

        {phone.price_usd && (
          <p className="font-bold text-base" style={{ color: color.text }}>
            ${phone.price_usd.toLocaleString()}
          </p>
        )}
        {phone.review_count && phone.review_count > 0 && (
          <p className="text-[11px] mt-0.5" style={{ color: color.textLight }}>
            {phone.review_count.toLocaleString()} reviews
          </p>
        )}
      </div>
    </ButtonPressFeedback>
  )
}
