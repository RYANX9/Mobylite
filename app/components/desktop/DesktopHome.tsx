// desktop/DesktopHome.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Smartphone, SlidersHorizontal, X, GitCompare, Star  } from 'lucide-react';

// types & helpers
import { Phone, Filters } from '../../components/shared/types';
import { API_BASE, INITIAL_FILTERS } from '../../components/shared/constants';
import { buildSearchURL } from '../../components/shared/utils';

// shared UI components
import { ButtonPressFeedback } from '../../components/shared/ButtonPressFeedback';
import { SearchBar }            from '../../components/shared/SearchBar';
import { PhoneCard }            from '../../components/shared/PhoneCard';
import { RecommendationButtons } from '../../components/shared/RecommendationButtons';
import { CompareFloatingPanel }  from '../../components/shared/CompareFloatingPanel';
import { QuizModal }            from '../../components/shared/QuizModal';
import { PriceAlertModal }      from '../../components/shared/PriceAlertModal';

// desktop-only component in the same folder
import { FilterPanel } from './FilterPanel';


interface DesktopHomeProps {
  setSelectedPhone: (phone: Phone) => void;
  setView: (view: string) => void;
  setComparePhones: (phones: Phone[]) => void;
}

export default function DesktopHome({ setSelectedPhone, setView, setComparePhones }: DesktopHomeProps) {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [topRatedPhones, setTopRatedPhones] = useState<Phone[]>([]);
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
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (activeRecommendation) setActiveRecommendation(null);
      fetchPhones();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!activeRecommendation) fetchPhones();
  }, [filters, sortBy, sortOrder]);

  const fetchTopRated = async () => {
    try {
      const statsRes = await fetch('/reviews.json');
      const statsData = await statsRes.json();
      
      const topRated = statsData.phone_stats
        .filter((s: any) => s.total_reviews >= 100 && s.average_rating >= 4.0)
        .sort((a: any, b: any) => {
          const scoreA = a.average_rating * Math.log(a.total_reviews);
          const scoreB = b.average_rating * Math.log(b.total_reviews);
          return scoreB - scoreA;
        })
        .slice(0, 12);

      const phonePromises = topRated.map(async (stat: any) => {
        const res = await fetch(`${API_BASE}/phones/${stat.phone_id}`);
        const phone = await res.json();
        return { ...phone, rating: stat.average_rating, review_count: stat.total_reviews };
      });

      const phones = await Promise.all(phonePromises);
      setTopRatedPhones(phones);
    } catch (error) {
      console.error('Error fetching top rated:', error);
    }
  };

  const fetchPhones = async () => {
    setLoading(true);
    try {
      const url = buildSearchURL(filters, sortBy, sortOrder, searchQuery);
      const res = await fetch(url);
      const data = await res.json();
      setPhones(data.results || []);
      setTotalResults(data.total || 0);
    } catch (e) {
      console.error('Error fetching phones:', e);
      setPhones([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (useCase: string) => {
    setLoading(true);
    setActiveRecommendation(useCase);
    try {
      const url = `${API_BASE}/phones/recommend?use_case=${useCase}&limit=50`;
      const res = await fetch(url);
      const data = await res.json();
      setPhones(data.recommendations || []);
      setTotalResults((data.recommendations || []).length);
    } catch (e) {
      console.error('Error fetching recommendations:', e);
      setPhones([]);
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
    setCompareList([...compareList, phone]);
  };

  const removeFromCompare = (phoneId: number) => {
    setCompareList(compareList.filter(p => p.id !== phoneId));
  };

  const handlePhoneClick = async (phone: Phone) => {
    try {
      const res = await fetch(`${API_BASE}/phones/${phone.id}`);
      const full = await res.json();
      setSelectedPhone(full);
      setView('pdp');
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuizComplete = (newFilters: Partial<Filters>, useCase?: string) => {
    setFilters({ ...filters, ...newFilters });
    if (useCase) fetchRecommendations(useCase);
    setShowQuiz(false);
  };

  const handleCompareNavigate = async () => {
    const fullPhones = await Promise.all(
      compareList.map(async (phone) => {
        const res = await fetch(`${API_BASE}/phones/${phone.id}`);
        return await res.json();
      })
    );
    setComparePhones(fullPhones);
    setView('compare');
  };

  const TopRatedCard = ({ phone }: { phone: any }) => {
    const isInCompare = compareList.find(p => p.id === phone.id);

    return (
      <div className="flex-shrink-0 w-64 bg-white border border-gray-200 hover:border-black rounded-2xl overflow-hidden transition-all group">
        <div className="absolute top-3 right-3 bg-black text-white px-3 py-1 rounded-full flex items-center gap-1.5 z-10">
          <Star size={12} className="fill-white" strokeWidth={2} />
          <span className="text-xs font-bold">{phone.rating.toFixed(1)}</span>
        </div>

        <button
          onClick={() => handlePhoneClick(phone)}
          className="w-full active:scale-[0.98] transition-all"
        >
          <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden group-hover:bg-gray-100 transition-colors">
            {phone.main_image_url ? (
              <img
                src={phone.main_image_url}
                alt={phone.model_name}
                className="w-full h-full object-contain p-6"
              />
            ) : (
              <Smartphone size={48} className="text-gray-300" strokeWidth={2} />
            )}
          </div>

          <div className="p-5">
            <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wide">{phone.brand}</p>
            <p className="text-sm font-bold text-black leading-tight line-clamp-2 mb-2 min-h-[36px]">
              {phone.model_name}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < Math.round(phone.rating) ? 'fill-black text-black' : 'text-gray-300'}
                    strokeWidth={2}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({phone.review_count})</span>
            </div>
            {phone.price_usd && (
              <p className="text-xl font-bold text-black">${phone.price_usd}</p>
            )}
          </div>
        </button>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={() => isInCompare ? removeFromCompare(phone.id) : addToCompare(phone)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              isInCompare ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            {isInCompare ? 'Remove' : 'Compare'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <QuizModal show={showQuiz} onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />
      <PriceAlertModal show={showPriceAlert} onClose={() => setShowPriceAlert(false)} phone={selectedPhoneForAlert} />

      <CompareFloatingPanel
        compareList={compareList}
        onRemove={removeFromCompare}
        onClear={() => setCompareList([])}
        onCompare={handleCompareNavigate}
        variant="desktop"
      />

      <div ref={heroRef} className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex items-start justify-between mb-12">
            <div className="flex-1 max-w-3xl">
              <div className="flex items-center gap-5 mb-6">
                <img src="/logo.svg" alt="phone" className="w-16 h-16 invert" />
                <div>
                  <h1 className="text-6xl font-bold text-white tracking-tight leading-none mb-3">Mobylite</h1>
                  <p className="text-xl text-gray-300 font-medium">Compare phones. Make smart choices.</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Search size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm mb-1">Search Phones</div>
                      <div className="text-gray-400 text-xs leading-relaxed">Browse thousands of devices with detailed specs</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Search size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm mb-1">Compare Side-by-Side</div>
                      <div className="text-gray-400 text-xs leading-relaxed">Add up to 4 phones and see differences instantly</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Star size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm mb-1">Get Recommendations</div>
                      <div className="text-gray-400 text-xs leading-relaxed">Find phones matched to your needs and budget</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 ml-12">
              <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-6">
                <div className="text-5xl font-bold text-white mb-2">{totalResults}</div>
                <div className="text-sm text-gray-300 font-medium">Phones</div>
              </div>
              <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-6">
                <div className="text-5xl font-bold text-white mb-2">50+</div>
                <div className="text-sm text-gray-300 font-medium">Brands</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`sticky top-0 z-30 bg-white border-b border-gray-200 transition-all duration-300 ${isNavbarSticky ? 'shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="phone" className="w-8 h-8" />
              <h2 className="text-xl font-bold text-black">Mobylite</h2>
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {topRatedPhones.length > 0 && !activeRecommendation && !searchQuery && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                  <Star size={24} className="fill-black" strokeWidth={2} />
                  Top Rated
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Highest rated by users with 100+ reviews</p>
              </div>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
              {topRatedPhones.map((phone) => (
                <TopRatedCard key={phone.id} phone={phone} />
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
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-black">
                <h2 className="text-2xl font-bold text-black tracking-tight">
                  {activeRecommendation ? (
                    <span className="capitalize">{activeRecommendation} Phones</span>
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
                  className="px-4 py-3 border border-gray-200 rounded-xl text-xs text-black bg-white focus:outline-none focus:border-black font-semibold transition-all"
                >
                  <option value="release_year-desc">Newest First</option>
                  <option value="release_year-asc">Oldest First</option>
                  <option value="price_usd-asc">Price: Low to High</option>
                  <option value="price_usd-desc">Price: High to Low</option>
                </select>
              </div>
              {totalResults > 0 && (
                <p className="text-xs text-gray-500 font-medium">
                  Showing {totalResults} phone{totalResults !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {loading && (
              <div className="flex justify-center items-center py-32">
                <Loader2 className="animate-spin text-gray-400" size={48} strokeWidth={2} />
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
                <Smartphone size={80} className="text-gray-200 mx-auto mb-6" strokeWidth={1.5} />
                <p className="text-gray-500 text-base font-semibold">No phones found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}