// app\components\desktop\DesktopHome.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Smartphone, SlidersHorizontal, GitCompare, Star } from 'lucide-react';
import { Phone, Filters, User } from '@/lib/types';
import { API_BASE_URL, APP_ROUTES, RECOMMENDATION_CATEGORIES } from '@/lib/config';
import { createPhoneSlug } from '@/lib/config';
import { isAuthenticated, getAuthToken } from '@/lib/auth';
import { ButtonPressFeedback } from '@/app/components/shared/ButtonPressFeedback';
import { SearchBar } from '@/app/components/shared/SearchBar';
import { PhoneCard } from '@/app/components/shared/PhoneCard';
import RecommendationButtons  from '@/app/components/shared/RecommendationButtons';
import { CompareFloatingPanel } from '@/app/components/shared/CompareFloatingPanel';
import  QuizModal  from '@/app/components/shared/QuizModal';
import { PriceAlertModal } from '@/app/components/shared/PriceAlertModal';
import { UserMenu } from './UserMenu';
import { FilterPanel } from './FilterPanel';
import { useRouter } from 'next/navigation';

import { color, font } from '@/lib/tokens';

import { api } from '@/lib/api';

// Then destructure where needed:
const { auth, phones, reviews } = api;

if (!phones) {
  throw new Error("Phones API failed to initialize");
}

// Extended filters for UI features
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
};

interface DesktopHomeProps {
  setSelectedPhone: (phone: Phone) => void;
  setView: (view: string) => void;
  setComparePhones: (phones: Phone[]) => void;
  onNavigateToCompare?: (phones: Phone[]) => void;
  onNavigateToPhone?: (phone: Phone) => void;
}

export default function DesktopHome({ 
  setSelectedPhone, 
  setView, 
  setComparePhones,
  onNavigateToCompare,
  onNavigateToPhone 
}: DesktopHomeProps) {
  const router = useRouter();
  const [phones, setPhones] = useState<Phone[]>([]);
  const [topRatedPhones, setTopRatedPhones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [activeRecommendation, setActiveRecommendation] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<Phone[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [selectedPhoneForAlert, setSelectedPhoneForAlert] = useState<Phone | null>(null);
  const [isNavbarSticky, setIsNavbarSticky] = useState(false);
  const [sortBy, setSortBy] = useState('release_year');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1); 
  const [filters, setFilters] = useState<ExtendedFilters>(INITIAL_FILTERS);
  const [favoritePhoneIds, setFavoritePhoneIds] = useState<Set<number>>(new Set());

  const heroRef = useRef<HTMLDivElement>(null);

  // Auth check and user data fetch
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated()) return;
      
      try {
        const response = await api.auth.getMe();
        if (response.success) {
          setCurrentUser(response.user);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.offsetHeight;
        setIsNavbarSticky(window.scrollY > heroBottom - 80);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    // Reset to page 1 when search or filters change
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy, sortOrder]);

  const fetchTopRated = async () => {
    try {
      const data = await api.phones.search({
        sort_by: 'antutu_score',
        page_size: 50
      });
      
      // Fetch stats for each phone to get real ratings
      const phonesWithRatings = await Promise.all(
        (data.results || []).slice(0, 20).map(async (phone) => {
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
      
      // Filter phones with reviews and sort by rating
      const ratedPhones = phonesWithRatings
        .filter(p => p.review_count > 0)
        .sort((a, b) => {
          // Sort by rating first, then by review count
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.review_count - a.review_count;
        })
        .slice(0, 10);
      
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
        page_size: 40,
      };
      
      const data = await api.phones.search(params);
      setPhones(data.results || []);
      setTotalResults(data.total || 0);
    } catch (error) {
      console.error('Error fetching phones:', error);
      setPhones([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (useCase: string) => {
    setLoading(true);
    setActiveRecommendation(useCase);
    try {
      const data = await api.phones.recommend(useCase, undefined, 50);
      setPhones(data.recommendations || []);
      setTotalResults((data.recommendations || []).length);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setPhones([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const addToCompare = (phone: Phone) => {
    if (compareList.length >= 4) {
      alert('You can compare up to 4 phones');
      return;
    }
    if (compareList.find(p => p.id === phone.id)) return;
    
    // Add to comparison history
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
    const modelSlug = phone.model_name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    router.push(`/${brandSlug}/${modelSlug}`);
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

  // Tokenized styles
  const heroBgStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${color.bgInverse} 0%, #000000 50%, ${color.bgInverse} 100%)`,
  };

  const navbarBgStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    borderColor: color.borderLight,
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: `${color.bg}0D`,
    border: `1px solid ${color.borderLight}1A`,
    backdropFilter: 'blur(4px)',
  };

  // Pagination component
  const Pagination = () => {
    const totalPages = Math.ceil(totalResults / 40);
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const showPages = 7; // Show max 7 page buttons
      
      if (totalPages <= showPages) {
        // Show all pages if total is small
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);
        
        if (currentPage > 3) {
          pages.push('...');
        }
        
        // Show pages around current page
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        if (currentPage < totalPages - 2) {
          pages.push('...');
        }
        
        // Always show last page
        pages.push(totalPages);
      }
      
      return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex items-center justify-center gap-2 mt-8 mb-12">
        {/* Previous Button */}
        <ButtonPressFeedback
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
          style={{
            backgroundColor: currentPage === 1 ? color.borderLight : color.text,
            color: currentPage === 1 ? color.textMuted : color.bg,
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Previous
        </ButtonPressFeedback>

        {/* Page Numbers */}
        <div className="flex items-center gap-2">
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-3 py-2 text-sm font-bold" style={{ color: color.textMuted }}>
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            
            return (
              <ButtonPressFeedback
                key={page}
                onClick={() => setCurrentPage(page as number)}
                className="px-4 py-2 rounded-lg font-bold text-sm transition-all min-w-[40px] text-center"
                style={{
                  backgroundColor: isActive ? color.text : color.borderLight,
                  color: isActive ? color.bg : color.text,
                  border: isActive ? 'none' : `1px solid ${color.border}`
                }}
                hoverStyle={!isActive ? { backgroundColor: color.border } : undefined}
              >
                {page}
              </ButtonPressFeedback>
            );
          })}
        </div>

        {/* Next Button */}
        <ButtonPressFeedback
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
          style={{
            backgroundColor: currentPage === totalPages ? color.borderLight : color.text,
            color: currentPage === totalPages ? color.textMuted : color.bg,
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Next
        </ButtonPressFeedback>
      </div>
    );
  };

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

      <div ref={heroRef} className="border-b" style={heroBgStyle}>
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex items-start justify-between mb-12">
            <div className="flex-1 max-w-3xl">
              <div className="flex items-center gap-5 mb-6">
                <img src="/logo.svg" alt="phone" className="w-16 h-16 invert" />
                <div>
                  <h1 
                    className="text-6xl font-bold tracking-tight leading-none mb-3"
                    style={{ fontFamily: font.primary, color: color.bg }}
                  >
                    Mobylite
                  </h1>
                  <p className="text-xl font-medium" style={{ color: color.textMuted }}>
                    Compare phones. Make smart choices.
                  </p>
                </div>
              </div>

              <div 
                className="rounded-2xl p-6 border"
                style={statCardStyle}
              >
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color.bg}1A` }}
                    >
                      <Search size={20} style={{ color: color.bg }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1" style={{ color: color.bg }}>Search Phones</div>
                      <div className="text-xs leading-relaxed" style={{ color: color.textMuted }}>
                        Browse thousands of devices with detailed specs
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color.bg}1A` }}
                    >
                      <GitCompare size={20} style={{ color: color.bg }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1" style={{ color: color.bg }}>Compare Side-by-Side</div>
                      <div className="text-xs leading-relaxed" style={{ color: color.textMuted }}>
                        Add up to 4 phones and see differences instantly
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color.bg}1A` }}
                    >
                      <Star size={20} style={{ color: color.bg }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1" style={{ color: color.bg }}>
                        Get Recommendations
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: color.textMuted }}>
                        Find phones matched to your needs and budget
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 ml-12">
              <div 
                className="text-center rounded-2xl px-8 py-6 border"
                style={statCardStyle}
              >
                <div 
                  className="text-5xl font-bold mb-2"
                  style={{ fontFamily: font.numeric, color: color.bg }}
                >
                  {totalResults}
                </div>
                <div className="text-sm font-medium" style={{ color: color.textMuted }}>Phones</div>
              </div>
              <div 
                className="text-center rounded-2xl px-8 py-6 border"
                style={statCardStyle}
              >
                <div 
                  className="text-5xl font-bold mb-2"
                  style={{ fontFamily: font.numeric, color: color.bg }}
                >
                  50+
                </div>
                <div className="text-sm font-medium" style={{ color: color.textMuted }}>Brands</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        className={`sticky top-0 z-30 border-b transition-all duration-300 ${
          isNavbarSticky ? 'shadow-lg' : ''
        }`}
        style={navbarBgStyle}
      >
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="phone" className="w-8 h-8" />
              <h2 
                className="text-xl font-bold"
                style={{ fontFamily: font.primary, color: color.text }}
              >
                Mobylite
              </h2>
            </div>

            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
              className="flex-1"
              variant="desktop"
            />

            <RecommendationButtons
              activeRecommendation={activeRecommendation}
              onRecommendationClick={fetchRecommendations}
              onQuizClick={() => setShowQuiz(true)}
              variant="desktop"
            />

            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {topRatedPhones.length > 0 && !activeRecommendation && !searchQuery && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 
                  className="text-2xl font-bold flex items-center gap-3"
                  style={{ fontFamily: font.primary, color: color.text }}
                >
                  <Star size={24} style={{ color: color.text }} />
                  Top Rated
                </h2>
                <p className="text-sm font-medium mt-1" style={{ color: color.textMuted }}>
                  Highest rated by users with 100+ reviews
                </p>
              </div>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
              {topRatedPhones.map((phone) => (
                <TopRatedCard key={phone.id} phone={phone} onClick={handlePhoneClick} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          <FilterPanel 
            filters={filters}
            setFilters={setFilters}
            onReset={handleResetFilters}
          />

          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2" style={{ borderColor: color.text }}>
                <h2 
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: font.primary, color: color.text }}
                >
                  {activeRecommendation ? (
                    <span className="capitalize">{RECOMMENDATION_CATEGORIES[activeRecommendation as keyof typeof RECOMMENDATION_CATEGORIES]?.title || activeRecommendation}</span>
                  ) : (
                    'Latest Releases'
                  )}
                </h2>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none transition-all"
                  style={{ border: `1px solid ${color.border}`, backgroundColor: color.bg, color: color.text }}
                  onFocus={(e) => e.currentTarget.style.borderColor = color.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = color.border}
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
                
                {/* ✅ Add Pagination */}
                <Pagination />
              </>
            )}

            {!loading && phones.length === 0 && (
              <div className="text-center py-32 px-4">
                <Smartphone size={80} style={{ color: color.borderLight }} />
                <h3 className="font-semibold mt-6" style={{ color: color.text }}>No phones found</h3>
                <p className="text-sm mt-2" style={{ color: color.textMuted }}>Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal component for top rated cards

interface TopRatedCardProps {
  phone: Phone & { rating?: number; review_count?: number };
  onClick: (phone: Phone) => void;
}

const TopRatedCard: React.FC<TopRatedCardProps> = ({ phone, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const rating = phone.rating ?? 0;
  const reviewCount = phone.review_count ?? 0;

  return (
    <ButtonPressFeedback
      onClick={() => onClick(phone)}
      className="rounded-2xl overflow-hidden flex-shrink-0 w-[420px] flex flex-row transition-all duration-300"
      style={{ 
        backgroundColor: color.bg,
        border: `1px solid ${isHovered ? color.border : color.borderLight}`,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 28px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section - Left */}
      <div 
        className="w-32 h-32 flex items-center justify-center flex-shrink-0 transition-colors duration-300"
        style={{ background: `linear-gradient(135deg, ${isHovered ? color.border : color.borderLight} 0%, ${color.bg} 50%)` }}
      >
        {phone.main_image_url ? (
          <img
            src={phone.main_image_url}
            alt={phone.model_name}
            className="w-full h-full object-contain p-4 transition-transform duration-300 ease-out"
            style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <Smartphone size={40} style={{ color: color.textLight, opacity: 0.7 }} strokeWidth={1.5} />
        )}
      </div>
      
      {/* Content Section - Middle (Full Width) */}
      <div className="flex-1 p-6 flex flex-col justify-center min-w-0">
        {/* Header Row: Brand + Rating */}
        <div className="flex items-center gap-3 mb-2">
          <p 
            className="text-xs font-extrabold uppercase tracking-widest"
            style={{ color: color.textMuted, fontFamily: font.primary }}
          >
            {phone.brand}
          </p>
          
          {/* Star Rating Badge */}
          {rating > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
              <span className="text-[13px] font-extrabold" style={{ color: color.text }}>
                ★
              </span>
              <span className="text-sm font-extrabold" style={{ color: color.text, fontFamily: font.numeric }}>
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Model Name - Primary Focus */}
        <h3 
          className="font-extrabold text-base leading-snug mb-2 text-left line-clamp-2"
          style={{ color: color.text, fontFamily: font.primary }}
        >
          {phone.model_name}
        </h3>
        
        {/* Price - Strong Accent */}
        {phone.price_usd && (
          <p 
            className="font-extrabold text-lg text-left"
            style={{ color: color.text, fontFamily: font.numeric }}
          >
            ${phone.price_usd.toLocaleString()}
          </p>
        )}
        
        {/* Review Count - Subtle */}
        {reviewCount > 0 && (
          <p className="text-[11px] font-medium mt-1" style={{ color: color.textLight }}>
            {reviewCount.toLocaleString()} reviews
          </p>
        )}
      </div>

      {/* Optional CTA Indicator - Right */}
      <div className="flex-shrink-0 w-12 flex items-center justify-center pr-4">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 transition-all duration-300"
          style={{ 
            backgroundColor: color.primary,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(0)' : 'translateX(-4px)'
          }}
        >
          <span style={{ color: color.primaryText, fontWeight: 800 }}>›</span>
        </div>
      </div>
    </ButtonPressFeedback>
  );
};

