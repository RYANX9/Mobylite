'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Smartphone, SlidersHorizontal, GitCompare, Star } from 'lucide-react';
import { Phone, Filters, User } from '@/lib/types';
import { API_BASE_URL, APP_ROUTES, RECOMMENDATION_CATEGORIES } from '@/lib/config';
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
}

export default function DesktopHome({ setSelectedPhone, setView, setComparePhones }: DesktopHomeProps) {
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
  const [filters, setFilters] = useState<ExtendedFilters>(INITIAL_FILTERS);

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
  }, [filters, sortBy, sortOrder]);

  const fetchTopRated = async () => {
    try {
      // Use search with sort by rating (most popular phones)
      const data = await api.phones.search({
        sort_by: 'antutu_score', // or 'popularity' if your API supports it
        page_size: 10
      });
      setTopRatedPhones(data.results || []);
    } catch (error) {
      console.error('Failed to fetch top rated:', error);
      setTopRatedPhones([]);
    }
  };


  
  const fetchPhones = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        q: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: 1,
        page_size: 20,
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

  const handlePhoneClick = async (phone: Phone) => {
    try {
      // Add to view history
      if (isAuthenticated()) {
        fetch(`${API_BASE_URL}/history/views`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ phoneId: phone.id })
        }).catch(console.error);
      }

      const fullPhone = await api.phones.getDetails(phone.id);
      setSelectedPhone(fullPhone);
      setView('pdp');
    } catch (error) {
      console.error('Error fetching phone details:', error);
    }
  };

  const handleQuizComplete = (newFilters: Partial<Filters>, useCase?: string) => {
    setFilters({ ...filters, ...newFilters });
    if (useCase) fetchRecommendations(useCase);
    setShowQuiz(false);
  };

  const handleCompareNavigate = async () => {
    try {
      const fullPhones = await Promise.all(
        compareList.map(phone => api.phones.getDetails(phone.id))
      );
      setComparePhones(fullPhones);
      setView('compare');
    } catch (error) {
      console.error('Error loading compare phones:', error);
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
                    isInCompare={!!compareList.find(p => p.id === phone.id)}
                  />
                ))}
              </div>
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
  
  const cardStyle: React.CSSProperties = {
    backgroundColor: color.bg,
    border: `1px solid ${isHovered ? color.text : color.borderLight}`,
    flexShrink: 0,
    width: '256px',
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: color.bgInverse,
    color: color.primaryText,
  };

  return (
    <div 
      className="rounded-2xl p-4 transition-all"
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ButtonPressFeedback
        onClick={() => onClick(phone)}
        className="w-full"
      >
        <div 
          className="w-full h-48 flex items-center justify-center overflow-hidden rounded-t-2xl mb-3"
          style={{ backgroundColor: color.borderLight }}
        >
          {phone.main_image_url ? (
            <img
              src={phone.main_image_url}
              alt={phone.model_name}
              className="w-full h-full object-contain p-6"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <Smartphone size={48} style={{ color: color.textLight }} />
          )}
        </div>
        <div>
          <p className="text-[10px]" style={{ color: color.textMuted }}>{phone.brand}</p>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2" style={{ color: color.text }}>
            {phone.model_name}
          </h3>
          {phone.price_usd && (
            <p className="font-bold mb-2" style={{ color: color.text }}>${phone.price_usd}</p>
          )}
          {phone.rating !== undefined && (
            <div className="flex items-center gap-2 text-xs" style={{ color: color.textMuted }}>
              <div className="flex items-center gap-1">
                <Star size={12} style={{ color: color.starFilled }} />
                <span className="font-semibold">{phone.rating.toFixed(1)}</span>
              </div>
              <span>({phone.review_count?.toLocaleString()} reviews)</span>
            </div>
          )}
        </div>
      </ButtonPressFeedback>
    </div>
  );
};