'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Search, Loader2, Smartphone, Sparkles } from 'lucide-react'
import { Phone, Filters } from '@/lib/types'
import { APP_ROUTES, RECOMMENDATION_CATEGORIES, createPhoneSlug } from '@/lib/config'
import { isAuthenticated, getAuthToken } from '@/lib/auth'
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback'
import { SearchBar } from '@/app/components/shared/SearchBar'
import { PhoneCard } from '@/app/components/shared/PhoneCard'
import { RecommendationButtons } from '@/app/components/shared/RecommendationButtons'
import { CompareFloatingPanel } from '@/app/components/shared/CompareFloatingPanel'
import QuizModal from '@/app/components/shared/QuizModal'
import { PriceAlertModal } from '@/app/components/shared/PriceAlertModal'
import { UserMenu } from '@/app/components/shared/UserMenu'
import { FilterPanel } from '@/app/components/shared/FilterPanel'
import { PhoneGridSkeleton } from '@/app/components/shared/Skeleton'
import { useCompare } from '@/lib/compare-context'
import { useRouter } from 'next/navigation'
import { color, font } from '@/lib/tokens'
import { api } from '@/lib/api'

interface ExtendedFilters extends Filters {
  brands?: string[]
  has_5g?: boolean
}

const INITIAL_FILTERS: ExtendedFilters = {
  brands: [],
  has_5g: undefined,
}

export default function DesktopHome() {
  const router = useRouter()
  const compare = useCompare()

  const [phones, setPhones] = useState<Phone[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [activeRecommendation, setActiveRecommendation] = useState<string | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showPriceAlert, setShowPriceAlert] = useState(false)
  const [selectedPhoneForAlert, setSelectedPhoneForAlert] = useState<Phone | null>(null)
  const [isNavbarSticky, setIsNavbarSticky] = useState(false)
  const [sortBy, setSortBy] = useState('release_year')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<ExtendedFilters>(INITIAL_FILTERS)
  const [favoritePhoneIds, setFavoritePhoneIds] = useState<Set<number>>(new Set())

  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        setIsNavbarSticky(window.scrollY > heroRef.current.offsetHeight - 80)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveRecommendation(null)
      fetchPhones()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!activeRecommendation) fetchPhones()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filters, sortBy, sortOrder, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters, sortBy, sortOrder])

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated()) return
      try {
        const response = await api.favorites.list()
        if (response.success && response.favorites) {
          setFavoritePhoneIds(new Set(response.favorites.map((fav: any) => fav.phone_id)))
        }
      } catch {}
    }
    loadFavorites()
  }, [])

  const fetchPhones = async () => {
    setLoading(true)
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
      setFilters(INITIAL_FILTERS)
    } else {
      fetchRecommendations(id)
    }
  }

  const handleFiltersChange = (newFilters: ExtendedFilters) => {
    setActiveRecommendation(null)
    setFilters(newFilters)
  }

  const handlePhoneClick = (phone: Phone) => {
    const brandSlug = phone.brand.toLowerCase().replace(/\s+/g, '-')
    const modelSlug = createPhoneSlug(phone)
    router.push(`/${brandSlug}/${modelSlug}`)
  }

  const handleQuizComplete = (newFilters: Partial<Filters>) => {
    setActiveRecommendation(null)
    setFilters({ ...filters, ...newFilters })
    setShowQuiz(false)
  }

  const handleFavoriteToggle = async (phone: Phone) => {
    const newFavorites = new Set(favoritePhoneIds)
    if (newFavorites.has(phone.id)) newFavorites.delete(phone.id)
    else newFavorites.add(phone.id)
    setFavoritePhoneIds(newFavorites)
  }

  const Pagination = () => {
    const totalPages = Math.ceil(totalResults / 40)
    if (totalPages <= 1) return null

    const getPageNumbers = (): (number | string)[] => {
      const pages: (number | string)[] = []
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        if (currentPage > 3) pages.push('...')
        const start = Math.max(2, currentPage - 1)
        const end = Math.min(totalPages - 1, currentPage + 1)
        for (let i = start; i <= end; i++) pages.push(i)
        if (currentPage < totalPages - 2) pages.push('...')
        pages.push(totalPages)
      }
      return pages
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8 mb-12">
        <ButtonPressFeedback
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: currentPage === 1 ? color.borderLight : color.text,
            color: currentPage === 1 ? color.textMuted : color.bg,
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
        >
          Previous
        </ButtonPressFeedback>

        <div className="flex items-center gap-2">
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span key={`e-${idx}`} className="px-3 py-2 text-sm font-bold" style={{ color: color.textMuted }}>...</span>
            ) : (
              <ButtonPressFeedback
                key={page}
                onClick={() => setCurrentPage(page as number)}
                className="px-4 py-2 rounded-lg font-bold text-sm min-w-[40px] text-center"
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
        </div>

        <ButtonPressFeedback
          onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalResults / 40), p + 1))}
          disabled={currentPage === Math.ceil(totalResults / 40)}
          className="px-4 py-2 rounded-lg font-bold text-sm"
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

  const heroBgStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${color.bgInverse} 0%, #000000 50%, ${color.bgInverse} 100%)`,
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: color.bg }}>
      <QuizModal show={showQuiz} onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />
      <PriceAlertModal show={showPriceAlert} onClose={() => setShowPriceAlert(false)} phone={selectedPhoneForAlert} />

      <CompareFloatingPanel
        compareList={compare.list}
        onRemove={compare.remove}
        onClear={compare.clear}
        onCompare={compare.navigate}
        variant="desktop"
      />

      <div ref={heroRef} className="border-b" style={heroBgStyle}>
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex items-start justify-between mb-12">
            <div className="flex-1 max-w-3xl">
              <div className="flex items-center gap-5 mb-6">
                <img src="/logo.svg" alt="phone" className="w-16 h-16 invert" />
                <div>
                  <h1 className="text-6xl font-bold tracking-tight leading-none mb-3" style={{ fontFamily: font.primary, color: color.bg }}>
                    Mobylite
                  </h1>
                  <p className="text-xl font-medium" style={{ color: color.textMuted }}>
                    Compare phones. Make smart choices.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-6 ml-12">
              <div
                className="text-center rounded-2xl px-8 py-6 border"
                style={{ backgroundColor: `${color.bg}0D`, border: `1px solid ${color.borderLight}1A`, backdropFilter: 'blur(4px)' }}
              >
                <div className="text-5xl font-bold mb-2" style={{ color: color.bg }}>{totalResults}</div>
                <div className="text-sm font-medium" style={{ color: color.textMuted }}>Phones</div>
              </div>
              <div
                className="text-center rounded-2xl px-8 py-6 border"
                style={{ backgroundColor: `${color.bg}0D`, border: `1px solid ${color.borderLight}1A`, backdropFilter: 'blur(4px)' }}
              >
                <div className="text-5xl font-bold mb-2" style={{ color: color.bg }}>50+</div>
                <div className="text-sm font-medium" style={{ color: color.textMuted }}>Brands</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`sticky top-0 z-30 border-b transition-all duration-300 ${isNavbarSticky ? 'shadow-lg' : ''}`}
        style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
      >
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="phone" className="w-8 h-8" />
              <h2 className="text-xl font-bold" style={{ fontFamily: font.primary, color: color.text }}>Mobylite</h2>
            </div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} className="flex-1" variant="desktop" />
            <UserMenu variant="desktop" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <ButtonPressFeedback
                onClick={() => setShowQuiz(true)}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3"
                style={{ backgroundColor: color.primary, color: color.primaryText }}
              >
                <Sparkles size={20} strokeWidth={2.5} />
                Find Your Perfect Phone
              </ButtonPressFeedback>
              <FilterPanel
                filters={filters}
                setFilters={handleFiltersChange}
                onReset={() => setFilters(INITIAL_FILTERS)}
                variant="desktop"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-6">
              <RecommendationButtons
                activeRecommendation={activeRecommendation}
                onRecommendationClick={handleRecommendationClick}
                variant="desktop"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2" style={{ borderColor: color.text }}>
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: font.primary, color: color.text }}>
                  {activeRecommendation
                    ? RECOMMENDATION_CATEGORIES[activeRecommendation as keyof typeof RECOMMENDATION_CATEGORIES]?.title || activeRecommendation
                    : 'Latest Releases'}
                </h2>
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
              {totalResults > 0 && (
                <p className="text-xs font-medium" style={{ color: color.textMuted }}>
                  Showing {totalResults} phone{totalResults !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {loading && <PhoneGridSkeleton count={8} />}

            {!loading && phones.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-5 mb-8">
                  {phones.map((phone) => (
                    <PhoneCard
                      key={phone.id}
                      phone={phone}
                      variant="desktop"
                      onPhoneClick={handlePhoneClick}
                      onCompareToggle={(p) => compare.has(p.id) ? compare.remove(p.id) : compare.add(p)}
                      onPriceAlert={(p) => { setSelectedPhoneForAlert(p); setShowPriceAlert(true) }}
                      onFavoriteToggle={handleFavoriteToggle}
                      isInCompare={compare.has(phone.id)}
                      isInFavorites={favoritePhoneIds.has(phone.id)}
                    />
                  ))}
                </div>
                <Pagination />
              </>
            )}

            {!loading && phones.length === 0 && (
              <div className="text-center py-32 px-4">
                <Smartphone size={80} style={{ color: color.borderLight }} className="mx-auto mb-6" />
                <h3 className="font-semibold mb-2" style={{ color: color.text }}>No phones found</h3>
                <p className="text-sm" style={{ color: color.textMuted }}>Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
