// app/components/mobile/MobileHome.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Smartphone, SlidersHorizontal, X, Star, Sparkles } from 'lucide-react';
import { Phone, Filters, User } from '@/lib/types';
import { API_BASE_URL, APP_ROUTES, RECOMMENDATION_CATEGORIES } from '@/lib/config';
import { createPhoneSlug } from '@/lib/config';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { PhoneCard } from '@/app/components/shared/PhoneCard';
import { CompareFloatingPanel } from '@/app/components/shared/CompareFloatingPanel';
import QuizModal from '@/app/components/shared/QuizModal';
import { PriceAlertModal } from '@/app/components/shared/PriceAlertModal';
import { UserMenu } from '../mobile/UserMenu';
import { FilterPanel } from '@/app/components/mobile/FilterPanel';
import { useRouter } from 'next/navigation';
import { color, font } from '@/lib/tokens';
import { api } from '@/lib/api';

const { auth, phones, reviews } = api;

interface ExtendedFilters extends Filters {
  brands?: string[];
  has_5g?: boolean;
  screen_size?: string | null;
  comparison?: string | null;
}

const INITIAL_FILTERS: ExtendedFilters = {
  q: undefined,
  min_price: undefined,
  max_price: undefined,
  min_ram: undefined,
  min_storage: undefined,
  min_battery: undefined,
  min_screen_size: undefined,
  min_camera_mp: undefined,
  brand: undefined,
  min_year: undefined,
  sort_by: undefined,
  sort_order: undefined,
  page: undefined,
  page_size: undefined,
  brands: [],
  has_5g: undefined,
  screen_size: undefined,
  comparison: undefined,
  os: undefined,
};

interface MobileHomeProps {
  setSelectedPhone: (phone: Phone) => void;
  setView: (view: string) => void;
  setComparePhones: (phones: Phone[]) => void;
  onNavigateToCompare?: (phones: Phone[]) => void;
  onNavigateToPhone?: (phone: Phone) => void;
}

export default function MobileHome({ 
  setSelectedPhone, 
  setView, 
  setComparePhones,
  onNavigateToCompare,
  onNavigateToPhone 
}: MobileHomeProps) {
  const router = useRouter();
  const [phonesList, setPhonesList] = useState<Phone[]>([]);
  const [topRatedPhones, setTopRatedPhones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [activeRecommendation, setActiveRecommendation] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<Phone[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [selectedPhoneForAlert, setSelectedPhoneForAlert] = useState<Phone | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('release_year');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ExtendedFilters>(INITIAL_FILTERS);
  const [favoritePhoneIds, setFavoritePhoneIds] = useState<Set<number>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Prevent body scroll when filter bottom sheet is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilters]);
  
  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated()) return;
      try {
        const response = await api.auth.getMe();
        if (response.success || response.id) {
          setCurrentUser(response.user || response);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    fetchTopRated();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (activeRecommendation) setActiveRecommendation(null);
      fetchPhones();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    if (!activeRecommendation) fetchPhones();
  }, [filters, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy, sortOrder]);

  const fetchTopRated = async () => {
    try {
      const data = await api.phones.search({
        sort_by: 'antutu_score',
        page_size: 30
      });
      
      const phonesWithRatings = await Promise.all(
        (data.results || []).slice(0, 15).map(async (phone) => {
          try {
            const statsResponse = await api.phones.getStats(phone.id);
            if (statsResponse.success && statsResponse.stats) {
              return {
                ...phone,
                rating: statsResponse.stats.average_rating,
                review_count: statsResponse.stats.total_reviews
              };
            }
          } catch (err) {
            console.error(`Failed to fetch stats for phone ${phone.id}:`, err);
          }
          return { ...phone, rating: 0, review_count: 0 };
        })
      );
      
      const ratedPhones = phonesWithRatings
        .filter(p => p.review_count > 0)
        .sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.review_count - a.review_count;
        })
        .slice(0, 6);
      
      setTopRatedPhones(ratedPhones);
    } catch (error) {
      console.error('Failed to fetch top rated:', error);
      setTopRatedPhones([]);
    }
  };

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isAuthenticated()) return;
      try {
        const response = await api.favorites.list();
        if (response.success && response.favorites) {
          const ids = new Set(response.favorites.map((fav: any) => fav.phone_id));
          setFavoritePhoneIds(ids);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    };
    loadFavorites();
  }, [currentUser]);
  
  const fetchPhones = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        q: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        page_size: 20,
      };
      
      const data = await api.phones.search(params);
      setPhonesList(data.results || []);
      setTotalResults(data.total || 0);
    } catch (error) {
      console.error('Error fetching phones:', error);
      setPhonesList([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (useCase: string) => {
    setLoading(true);
    setActiveRecommendation(useCase);
    try {
      const data = await api.phones.recommend(useCase, undefined, 30);
      setPhonesList(data.recommendations || []);
      setTotalResults((data.recommendations || []).length);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setPhonesList([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleApply = () => {
    setShowFilters(false);
  };

  const addToCompare = (phone: Phone) => {
    if (compareList.length >= 4) {
      alert('You can compare up to 4 phones');
      return;
    }
    if (compareList.find(p => p.id === phone.id)) return;
    
    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/comparisons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ phoneIds: [...compareList.map(p => p.id), phone.id] })
      }).catch(console.error);
    }
    
    setCompareList([...compareList, phone]);
  };

  const removeFromCompare = (phoneId: number) => {
    setCompareList(compareList.filter(p => p.id !== phoneId));
  };

  const handleFavoriteToggle = async (phone: Phone) => {
    const newFavorites = new Set(favoritePhoneIds);
    if (newFavorites.has(phone.id)) {
      newFavorites.delete(phone.id);
    } else {
      newFavorites.add(phone.id);
    }
    setFavoritePhoneIds(newFavorites);
  };

  const handlePhoneClick = (phone: Phone) => {
    const brandSlug = phone.brand.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = createPhoneSlug(phone);
    router.push(APP_ROUTES.phoneDetail(brandSlug, modelSlug));
  };

  const handleQuizComplete = (newFilters: Partial<Filters>, useCase?: string) => {
    setFilters({ ...filters, ...newFilters });
    if (useCase) fetchRecommendations(useCase);
    setShowQuiz(false);
  };

  const handleCompareNavigate = async () => {
    try {
      const phoneSlugs = compareList.map(phone => createPhoneSlug(phone));
      router.push(APP_ROUTES.compare(phoneSlugs));
    } catch (error) {
      console.error('Error navigating to compare:', error);
    }
  };

  const Pagination = () => {
    const totalPages = Math.ceil(totalResults / 20);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 py-6">
        <ButtonPressFeedback
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg font-bold text-xs transition-all"
          style={{
            backgroundColor: currentPage === 1 ? color.borderLight : color.text,
            color: currentPage === 1 ? color.textMuted : color.bg,
            opacity: currentPage === 1 ? 0.5 : 1,
          }}
        >
          Prev
        </ButtonPressFeedback>

        <span className="px-4 py-2 text-xs font-bold" style={{ color: color.textMuted }}>
          {currentPage} / {totalPages}
        </span>

        <ButtonPressFeedback
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg font-bold text-xs transition-all"
          style={{
            backgroundColor: currentPage === totalPages ? color.borderLight : color.text,
            color: currentPage === totalPages ? color.textMuted : color.bg,
            opacity: currentPage === totalPages ? 0.5 : 1,
          }}
        >
          Next
        </ButtonPressFeedback>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: color.bg }}>
      <QuizModal show={showQuiz} onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />
      <PriceAlertModal show={showPriceAlert} onClose={() => setShowPriceAlert(false)} phone={selectedPhoneForAlert} />

      <CompareFloatingPanel
        compareList={compareList}
        onRemove={removeFromCompare}
        onClear={() => setCompareList([])}
        onCompare={handleCompareNavigate}
        variant="mobile"
      />

      {/* Compact Hero Header */}
      <div 
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Mobylite" className="w-7 h-7" />
              <h1 className="text-lg font-bold" style={{ fontFamily: font.primary, color: color.text }}>
                Mobylite
              </h1>
            </div>
            <UserMenu />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" 
              style={{ color: color.textMuted }} 
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search phones..."
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
              style={{
                backgroundColor: color.borderLight,
                border: `2px solid ${searchFocused ? color.primary : 'transparent'}`,
                color: color.text,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={18} style={{ color: color.textMuted }} />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            <ButtonPressFeedback
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
              style={{ 
                backgroundColor: Object.values(filters).some(v => v !== undefined && v !== null && v !== '') ? color.text : color.borderLight,
                color: Object.values(filters).some(v => v !== undefined && v !== null && v !== '') ? color.bg : color.text
              }}
            >
              <SlidersHorizontal size={14} />
              Filters
              {Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length > 0 && (
                <span className="ml-1">({Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length})</span>
              )}
            </ButtonPressFeedback>

            <ButtonPressFeedback
              onClick={() => setShowQuiz(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
              style={{ backgroundColor: color.borderLight, color: color.text }}
            >
              <Sparkles size={14} />
              Find My Phone
            </ButtonPressFeedback>
          </div>
        </div>
      </div>

      {/* Recommendation Chips */}
      {!searchQuery && (
        <div className="sticky top-[145px] z-30 py-3 border-b" style={{ backgroundColor: color.bg, borderColor: color.borderLight }}>
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
            {Object.entries(RECOMMENDATION_CATEGORIES).map(([key, category]) => (
              <ButtonPressFeedback
                key={key}
                onClick={() => fetchRecommendations(key)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  backgroundColor: activeRecommendation === key ? color.text : color.borderLight,
                  color: activeRecommendation === key ? color.bg : color.text,
                }}
              >
                {React.createElement(category.icon, { size: 14 })}
                {category.title}
              </ButtonPressFeedback>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 pt-4">
        {/* Top Rated Section */}
        {topRatedPhones.length > 0 && !activeRecommendation && !searchQuery && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} style={{ color: color.starFilled }} fill={color.starFilled} />
              <h2 className="text-lg font-bold" style={{ fontFamily: font.primary, color: color.text }}>
                Top Rated
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
              {topRatedPhones.map((phone) => (
                <TopRatedMobileCard key={phone.id} phone={phone} onClick={handlePhoneClick} />
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: color.text }}>
              {activeRecommendation ? (
                RECOMMENDATION_CATEGORIES[activeRecommendation as keyof typeof RECOMMENDATION_CATEGORIES]?.title
              ) : (
                'Latest Releases'
              )}
            </h2>
            {totalResults > 0 && (
              <p className="text-xs font-medium mt-0.5" style={{ color: color.textMuted }}>
                {totalResults} phone{totalResults !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className="px-3 py-2 rounded-lg text-xs font-bold focus:outline-none"
            style={{ 
              border: `1px solid ${color.border}`,
              backgroundColor: color.bg,
              color: color.text 
            }}
          >
            <option value="release_year-desc">Newest</option>
            <option value="price_usd-asc">Price ↑</option>
            <option value="price_usd-desc">Price ↓</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin" size={32} style={{ color: color.textMuted }} />
          </div>
        )}

        {/* Phone Grid */}
        {!loading && phonesList.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {phonesList.map((phone) => (
                <PhoneCard
                  key={phone.id}
                  phone={phone}
                  variant="mobile"
                  onPhoneClick={handlePhoneClick}
                  onCompareToggle={(p) => compareList.find(cp => cp.id === p.id) ? removeFromCompare(p.id) : addToCompare(p)}
                  onPriceAlert={(p) => {
                    setSelectedPhoneForAlert(p);
                    setShowPriceAlert(true);
                  }}
                  onFavoriteToggle={handleFavoriteToggle}
                  isInCompare={!!compareList.find(p => p.id === phone.id)}
                  isInFavorites={favoritePhoneIds.has(phone.id)}
                />
              ))}
            </div>
            <Pagination />
          </>
        )}

        {/* Empty State */}
        {!loading && phonesList.length === 0 && (
          <div className="text-center py-16">
            <Smartphone size={48} style={{ color: color.borderLight }} className="mx-auto mb-3" />
            <h3 className="font-bold text-sm mb-1" style={{ color: color.text }}>No phones found</h3>
            <p className="text-xs" style={{ color: color.textMuted }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Properly Styled Mobile Filter Bottom Sheet */}
      {showFilters && (
        <div 
          className="fixed inset-0 z-50 flex items-end"
          style={{ 
            backgroundColor: `${color.bgInverse}80`,
          }}
          onClick={onClose}
        >
          <div 
            className="w-full flex flex-col rounded-t-3xl overflow-hidden"
            style={{ 
              backgroundColor: color.bg,
              height: '85vh',
              maxHeight: 'calc(85vh - env(safe-area-inset-bottom, 0px))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile-Optimized Sticky Header */}
            <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center justify-between shrink-0" 
                 style={{ 
                   backgroundColor: color.bg, 
                   borderColor: color.borderLight,
                   paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))'
                 }}>
              <h3 className="text-lg font-bold" style={{ color: color.text }}>Filters</h3>
              <button onClick={onClose} className="p-1">
                <X size={24} style={{ color: color.textMuted }} />
              </button>
            </div>
            
            {/* Full-Width Scrollable Content with Mobile Padding */}
            <div className="flex-1 overflow-y-auto">
              {/* Override FilterPanel's desktop styles with mobile-specific ones */}
              <div className="w-full px-4 py-4">
                {/* Mobile Filter Panel (full width, no fixed width) */}
                <MobileFilterPanelContent 
                  filters={filters}
                  setFilters={setFilters}
                  onReset={handleResetFilters}
                />
              </div>
            </div>

            {/* Sticky Footer with Safe Area Support */}
            <div className="sticky bottom-0 px-4 py-3 border-t flex gap-3 shrink-0" 
                 style={{ 
                   backgroundColor: color.bg, 
                   borderColor: color.borderLight,
                   paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))'
                 }}>
              <ButtonPressFeedback
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ backgroundColor: color.borderLight, color: color.text }}
              >
                Reset
              </ButtonPressFeedback>
              <ButtonPressFeedback
                onClick={handleApply}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ backgroundColor: color.text, color: color.bg }}
              >
                Apply
              </ButtonPressFeedback>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function onClose() {
    setShowFilters(false);
  }
}

// Mobile-optimized filter content (extracted from FilterPanel but adapted for mobile)
const MobileFilterPanelContent: React.FC<{
  filters: ExtendedFilters;
  setFilters: (filters: ExtendedFilters) => void;
  onReset: () => void;
}> = ({ filters, setFilters, onReset }) => {
  const { color, font } = require('@/lib/tokens');
  const { BRANDS } = require('@/lib/config');

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: font.primary,
    color: color.text,
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${color.border}`,
    backgroundColor: color.bg,
    color: color.text,
  };

  const inputFocusStyle: React.CSSProperties = {
    borderColor: color.primary,
    boxShadow: `0 0 0 2px ${color.primary}1A`,
  };

  const tagStyle: React.CSSProperties = {
    backgroundColor: color.text,
    color: color.bg,
  };

  const handleBrandAdd = (newBrand: string) => {
    if (!newBrand) return;
    const currentBrands = filters.brands || [];
    if (!currentBrands.includes(newBrand)) {
      setFilters({ ...filters, brands: [...currentBrands, newBrand] });
    }
  };

  const handleBrandRemove = (brandToRemove: string) => {
    const currentBrands = filters.brands || [];
    setFilters({ 
      ...filters, 
      brands: currentBrands.filter(b => b !== brandToRemove) 
    });
  };

  return (
    <div className="w-full">
      {/* Mobile-optimized header (replaces FilterPanel's header) */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: color.borderLight }}>
        <h2 
          className="text-lg font-bold tracking-tight flex items-center gap-2"
          style={sectionTitleStyle}
        >
          <SlidersHorizontal size={20} strokeWidth={2} />
          Filters
        </h2>

      </div>

      {/* Mobile-optimized filter sections with tighter spacing */}
      <div className="space-y-5 pb-4">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={sectionTitleStyle}>
            Price Range (USD)
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_price || ''}
              onChange={(e) => setFilters({ ...filters, min_price: e.target.value ? Number(e.target.value) : undefined })}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_price || ''}
              onChange={(e) => setFilters({ ...filters, max_price: e.target.value ? Number(e.target.value) : undefined })}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
            />
          </div>
        </div>

        {/* Brands */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={sectionTitleStyle}>
            Brand
          </label>
          <select
            value=""
            onChange={(e) => handleBrandAdd(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
          >
            <option value="">Select brand...</option>
            {BRANDS.map((brand: string) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          {filters.brands && filters.brands.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.brands.map((brand: string) => (
                <div
                  key={brand}
                  className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
                  style={tagStyle}
                >
                  {brand}
                  <button
                    onClick={() => handleBrandRemove(brand)}
                    className="hover:opacity-70 transition-opacity"
                    style={{ color: color.bg }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OS */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={sectionTitleStyle}>
            Operating System
          </label>
          <select
            value={filters.os || ''}
            onChange={(e) => setFilters({ ...filters, os: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
          >
            <option value="">Any</option>
            <option value="Android">Android</option>
            <option value="iOS">iOS</option>
          </select>
        </div>

        {/* RAM */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={sectionTitleStyle}>
            Minimum RAM
          </label>
          <select
            value={filters.min_ram || ''}
            onChange={(e) => setFilters({ ...filters, min_ram: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
          >
            <option value="">Any</option>
            <option value="4">4 GB</option>
            <option value="6">6 GB</option>
            <option value="8">8 GB</option>
            <option value="12">12 GB</option>
            <option value="16">16 GB</option>
          </select>
        </div>

        {/* Storage */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={sectionTitleStyle}>
            Minimum Storage
          </label>
          <select
            value={filters.min_storage || ''}
            onChange={(e) => setFilters({ ...filters, min_storage: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
          >
            <option value="">Any</option>
            <option value="64">64 GB</option>
            <option value="128">128 GB</option>
            <option value="256">256 GB</option>
            <option value="512">512 GB</option>
            <option value="1024">1 TB</option>
          </select>
        </div>

        {/* Battery */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={sectionTitleStyle}>
            Minimum Battery
          </label>
          <select
            value={filters.min_battery || ''}
            onChange={(e) => setFilters({ ...filters, min_battery: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
          >
            <option value="">Any</option>
            <option value="3000">3000 mAh</option>
            <option value="4000">4000 mAh</option>
            <option value="5000">5000 mAh</option>
            <option value="6000">6000 mAh</option>
          </select>
        </div>

        {/* Camera */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={sectionTitleStyle}>
            Minimum Camera
          </label>
          <select
            value={filters.min_camera_mp || ''}
            onChange={(e) => setFilters({ ...filters, min_camera_mp: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
          >
            <option value="">Any</option>
            <option value="12">12 MP</option>
            <option value="48">48 MP</option>
            <option value="64">64 MP</option>
            <option value="108">108 MP</option>
          </select>
        </div>

        {/* 5G Support */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.has_5g === true}
              onChange={(e) => setFilters({ ...filters, has_5g: e.target.checked ? true : undefined })}
              className="w-5 h-5 rounded transition-colors"
              style={{ 
                border: `1px solid ${color.border}`, 
                accentColor: color.text 
              }}
            />
            <span className="text-sm font-semibold" style={{ color: color.text }}>5G Support</span>
          </label>
        </div>

        {/* Release Year */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={sectionTitleStyle}>
            Release Year
          </label>
          <select
            value={filters.min_year || ''}
            onChange={(e) => setFilters({ ...filters, min_year: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
          >
            <option value="">Any</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Top Rated Mobile Card (unchanged)
interface TopRatedMobileCardProps {
  phone: Phone & { rating?: number; review_count?: number };
  onClick: (phone: Phone) => void;
}

const TopRatedMobileCard: React.FC<TopRatedMobileCardProps> = ({ phone, onClick }) => {
  return (
    <ButtonPressFeedback
      onClick={() => onClick(phone)}
      className="rounded-xl overflow-hidden flex-shrink-0 w-[160px] border transition-all"
      style={{ backgroundColor: color.bg, borderColor: color.borderLight }}
    >
      <div 
        className="w-full h-32 flex items-center justify-center p-3"
        style={{ backgroundColor: color.borderLight }}
      >
        {phone.main_image_url ? (
          <img src={phone.main_image_url} alt={phone.model_name} className="w-full h-full object-contain" />
        ) : (
          <Smartphone size={32} style={{ color: color.textLight }} />
        )}
      </div>
      
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          {phone.rating && phone.rating > 0 && (
            <>
              <Star size={12} fill={color.starFilled} style={{ color: color.starFilled }} />
              <span className="text-xs font-bold" style={{ color: color.text }}>
                {phone.rating.toFixed(1)}
              </span>
            </>
          )}
        </div>
        
        <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: color.textMuted }}>
          {phone.brand}
        </p>
        
        <p className="font-bold text-xs leading-tight line-clamp-2 mb-2" style={{ color: color.text }}>
          {phone.model_name}
        </p>
        
        {phone.price_usd && (
          <p className="font-bold text-sm" style={{ color: color.text }}>
            ${phone.price_usd}
          </p>
        )}
      </div>
    </ButtonPressFeedback>
  );
};