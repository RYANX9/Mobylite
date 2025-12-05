
/* MobileHome.tsx */
'use client';
import { FiltersModal, SortModal, QuizModal, PriceAlertModal } from './MobileModals';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Smartphone, SlidersHorizontal, X, Zap, Camera, DollarSign, Battery, Trophy, ArrowRight, GitCompare, TrendingDown, Menu, ChevronDown } from 'lucide-react';

const API_BASE = 'https://renderphones.onrender.com';

const ButtonPressFeedback = ({ children, className = '', onClick, disabled = false }) => (
  <button
    className={`active:scale-95 transition-all duration-150 touch-manipulation ${className} ${
      disabled ? 'opacity-40 cursor-not-allowed' : ''
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

export default function MobileHome({ setSelectedPhone, setView, setComparePhones }) {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [activeRecommendation, setActiveRecommendation] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [selectedPhoneForAlert, setSelectedPhoneForAlert] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const [sortBy, setSortBy] = useState('release_year');
  const [sortOrder, setSortOrder] = useState('desc');

  const [filters, setFilters] = useState({
    min_price: null,
    max_price: null,
    min_ram: null,
    min_battery: null,
    min_camera_mp: null,
    min_year: null,
    brands: [],
    has_5g: null,
    min_storage: null,
    screen_size: null,
    os: null,
  });

  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (activeRecommendation) {
        setActiveRecommendation(null);
      }
      fetchPhones();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!activeRecommendation) {
      fetchPhones();
    }
  }, [filters, sortBy, sortOrder]);

  const fetchPhones = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/phones/search?page=1&page_size=100&sort_by=${sortBy}&sort_order=${sortOrder}`;

      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
      if (filters.min_price) url += `&min_price=${filters.min_price}`;
      if (filters.max_price) url += `&max_price=${filters.max_price}`;
      if (filters.min_ram) url += `&min_ram=${filters.min_ram}`;
      if (filters.min_battery) url += `&min_battery=${filters.min_battery}`;
      if (filters.min_camera_mp) url += `&min_camera_mp=${filters.min_camera_mp}`;
      if (filters.min_year) url += `&min_year=${filters.min_year}`;
      if (filters.min_storage) url += `&min_storage=${filters.min_storage}`;
      if (filters.screen_size) url += `&screen_size=${filters.screen_size}`;
      if (filters.os) url += `&os=${encodeURIComponent(filters.os)}`;
      if (filters.has_5g === true) url += `&has_5g=true`;
      
      if (filters.brands && filters.brands.length > 0) {
        filters.brands.forEach(brand => {
          url += `&brand=${encodeURIComponent(brand)}`;
        });
      }

      const res = await fetch(url);
      const data = await res.json();

      const list = data.results || [];
      setPhones(list);
      setTotalResults(data.total || 0);
    } catch (e) {
      console.error('Error fetching phones:', e);
      setPhones([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (useCase) => {
    setLoading(true);
    setActiveRecommendation(useCase);
    try {
      const url = `${API_BASE}/phones/recommend?use_case=${useCase}&limit=50`;
      const res = await fetch(url);
      const data = await res.json();

      const list = data.recommendations || [];
      setPhones(list);
      setTotalResults(list.length);
    } catch (e) {
      console.error('Error fetching recommendations:', e);
      setPhones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      min_price: null,
      max_price: null,
      min_ram: null,
      min_battery: null,
      min_camera_mp: null,
      min_year: null,
      brands: [],
      has_5g: null,
      min_storage: null,
      screen_size: null,
      os: null,
    });
  };

  const addToCompare = (phone) => {
    if (compareList.length >= 4) {
      alert('You can compare up to 4 phones');
      return;
    }
    if (compareList.find(p => p.id === phone.id)) return;
    setCompareList([...compareList, phone]);
  };

  const removeFromCompare = (phoneId) => {
    setCompareList(compareList.filter(p => p.id !== phoneId));
  };

  const recommendations = [
    { id: 'gamer', label: 'Gaming', icon: Zap },
    { id: 'photographer', label: 'Photo', icon: Camera },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'battery', label: 'Battery', icon: Battery },
    { id: 'flagship', label: 'Premium', icon: Trophy },
  ];

  const isNewRelease = (phone) => {
    if (!phone.release_year) return false;
    const y = phone.release_year;
    const m = phone.release_month ?? 1;
    const d = phone.release_day ?? 1;
    const release = new Date(y, m - 1, d);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    return release >= cutoff;
  };

  const Card = ({ phone }) => {
    const isNew = isNewRelease(phone);
    const isInCompare = compareList.find(p => p.id === phone.id);

    return (
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden active:scale-[0.97] transition-all">
        {isNew && (
          <div className="absolute top-2 right-2 bg-black text-white text-[8px] font-bold px-2 py-1 rounded-full z-10">
            NEW
          </div>
        )}

        <ButtonPressFeedback
          className="w-full"
          onClick={async () => {
            try {
              const res = await fetch(`${API_BASE}/phones/${phone.id}`);
              const full = await res.json();
              setSelectedPhone(full);
              setView('pdp');
            } catch (e) {
              console.error(e);
            }
          }}
        >
          <div className="w-full h-44 bg-gray-50 flex items-center justify-center p-4">
            {phone.main_image_url ? (
              <img
                src={phone.main_image_url}
                alt={phone.model_name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <Smartphone size={40} className="text-gray-300" strokeWidth={2} />
            )}
          </div>

          <div className="p-4">
            <p className="text-[9px] text-gray-500 mb-1 font-medium uppercase">{phone.brand}</p>
            <h3 className="font-bold text-black text-sm leading-snug mb-2 line-clamp-2 min-h-[40px]">
              {phone.model_name}
            </h3>
            {phone.price_usd ? (
              <p className="font-bold text-lg text-black">${phone.price_usd}</p>
            ) : (
              <p className="text-xs text-gray-400 font-medium">Price unavailable</p>
            )}
          </div>
        </ButtonPressFeedback>

        <div className="px-4 pb-4 flex gap-2">
          <ButtonPressFeedback
            onClick={() => isInCompare ? removeFromCompare(phone.id) : addToCompare(phone)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isInCompare
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black'
            }`}
          >
            {isInCompare ? 'Remove' : 'Compare'}
          </ButtonPressFeedback>
          <ButtonPressFeedback
            onClick={() => {
              setSelectedPhoneForAlert(phone);
              setShowPriceAlert(true);
            }}
            className="px-3 py-2.5 rounded-xl bg-gray-100"
          >
            <TrendingDown size={16} className="text-black" />
          </ButtonPressFeedback>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-br from-gray-900 via-black to-gray-900 shadow-xl">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Mobylite" className="w-8 h-8 invert" />
              <h1 className="text-xl font-bold text-white">Mobylite</h1>
            </div>
            <ButtonPressFeedback
              onClick={() => setShowFilters(true)}
              className="p-2 rounded-xl bg-white/10 backdrop-blur-sm"
            >
              <SlidersHorizontal size={20} className="text-white" />
            </ButtonPressFeedback>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="Search phones..."
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
            <ButtonPressFeedback
              onClick={() => setShowQuiz(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-xl font-bold flex-shrink-0"
            >
              <Zap size={14} strokeWidth={2.5} />
              <span className="text-xs whitespace-nowrap">Find Phone</span>
            </ButtonPressFeedback>
            {recommendations.map((rec) => (
              <ButtonPressFeedback
                key={rec.id}
                onClick={() => fetchRecommendations(rec.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border flex-shrink-0 ${
                  activeRecommendation === rec.id
                    ? 'bg-white text-black border-white'
                    : 'bg-white/10 text-white border-white/20'
                }`}
              >
                <rec.icon size={14} strokeWidth={2.5} />
                <span className="text-xs font-bold whitespace-nowrap">{rec.label}</span>
              </ButtonPressFeedback>
            ))}
            
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white sticky top-[140px] z-30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-black">
              {activeRecommendation ? (
                <span className="capitalize">{activeRecommendation} Phones</span>
              ) : (
                'Latest Phones'
              )}
            </h2>
            {totalResults > 0 && (
              <p className="text-xs text-gray-500 mt-1">{totalResults} results</p>
            )}
          </div>
          <ButtonPressFeedback
            onClick={() => setShowSort(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold"
          >
            Sort
            <ChevronDown size={14} />
          </ButtonPressFeedback>
        </div>
      </div>

      {/* Phone Grid */}
      <div className="px-4 py-4">
        {loading && (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin text-gray-400" size={40} strokeWidth={2} />
          </div>
        )}

        {!loading && phones.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {phones.map((phone) => (
              <Card key={phone.id} phone={phone} />
            ))}
          </div>
        )}

        {!loading && phones.length === 0 && (
          <div className="text-center py-24 px-4">
            <Smartphone size={60} className="text-gray-200 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-gray-500 text-sm font-semibold">No phones found</p>
            <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Filters Modal - SEE NEXT FILE */}
      
      {/* Compare Bottom Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 z-50 safe-area-inset-bottom">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Compare ({compareList.length}/4)</h3>
            <button onClick={() => setCompareList([])} className="text-gray-400">
              <X size={18} />
            </button>
          </div>
          <ButtonPressFeedback
            onClick={async () => {
              const fullPhones = await Promise.all(
                compareList.map(async (phone) => {
                  const res = await fetch(`${API_BASE}/phones/${phone.id}`);
                  return await res.json();
                })
              );
              setComparePhones(fullPhones);
              setView('compare');
            }}
            className="w-full py-3 bg-white text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          >
            <GitCompare size={16} />
            Compare Now
          </ButtonPressFeedback>
        </div>
      )}

      {/* Modals */}
      <FiltersModal
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        setFilters={setFilters}
        handleResetFilters={handleResetFilters}
      />

      <SortModal
        showSort={showSort}
        setShowSort={setShowSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        setSortBy={setSortBy}
        setSortOrder={setSortOrder}
      />

      <QuizModal
        showQuiz={showQuiz}
        setShowQuiz={setShowQuiz}
        setFilters={setFilters}
        setActiveRecommendation={setActiveRecommendation}
      />

      <PriceAlertModal
        showPriceAlert={showPriceAlert}
        setShowPriceAlert={setShowPriceAlert}
        selectedPhoneForAlert={selectedPhoneForAlert}
      />
    </div>
  );
}